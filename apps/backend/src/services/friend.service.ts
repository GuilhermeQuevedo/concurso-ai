import { levelFromXp } from '@concurso-ai/shared';

import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { findUserIdByIdentifier } from '../repositories/user-lookup.repository.js';

export const FRIEND_REQUEST_NOTIFICATION = 'FRIEND_REQUEST';
export const FRIEND_CODE_LENGTH = 8;
// Sem 0, O, 1, I (parecidos): o código é digitado ou lido em voz alta.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_CODE_ATTEMPTS = 8;

export interface FriendView {
  friendshipId: string;
  user: { id: string; name: string; nickname: string | null; level: number; tier: string };
}

export interface FriendRequestView {
  friendshipId: string;
  user: { id: string; name: string; nickname: string | null };
  createdAt: Date;
}

export interface FriendOverview {
  friends: FriendView[];
  received: FriendRequestView[];
  sent: FriendRequestView[];
}

const pair = (a: string, b: string) => (a < b ? { userLowId: a, userHighId: b } : { userLowId: b, userHighId: a });
const otherOf = (f: { userLowId: string; userHighId: string }, me: string) => (f.userLowId === me ? f.userHighId : f.userLowId);

function randomCode(): string {
  let code = '';
  for (let i = 0; i < FRIEND_CODE_LENGTH; i++) code += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  return code;
}

// Amizade entre duas pessoas: código pessoal, pedido por nickname ou código, aceitar/recusar e lista.
export class FriendService {
  constructor(private readonly notifications = new NotificationRepository()) {}

  async getCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { friendCode: true } });
    if (user?.friendCode) return user.friendCode;
    return this.assignCode(userId);
  }

  async regenerateCode(userId: string): Promise<string> {
    return this.assignCode(userId);
  }

  async overview(userId: string): Promise<FriendOverview> {
    const rows = await prisma.friendship.findMany({
      where: { OR: [{ userLowId: userId }, { userHighId: userId }] },
      orderBy: { createdAt: 'desc' },
    });
    const userIds = rows.map((r) => otherOf(r, userId));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, nickname: true, totalXp: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    const overview: FriendOverview = { friends: [], received: [], sent: [] };
    for (const row of rows) {
      const other = byId.get(otherOf(row, userId));
      if (!other) continue;
      if (row.status === 'ACCEPTED') {
        const level = levelFromXp(other.totalXp);
        overview.friends.push({
          friendshipId: row.id,
          user: { id: other.id, name: other.name, nickname: other.nickname, level: level.level, tier: level.tier.name },
        });
      } else {
        const view = { friendshipId: row.id, user: { id: other.id, name: other.name, nickname: other.nickname }, createdAt: row.createdAt };
        (row.requestedById === userId ? overview.sent : overview.received).push(view);
      }
    }
    return overview;
  }

  async request(userId: string, identifier: string): Promise<{ accepted: boolean }> {
    const target = await findUserIdByIdentifier(identifier);
    if (!target) throw new AppError(404, 'FRIEND_NOT_FOUND', 'Nenhuma pessoa encontrada com esse nickname ou código.');
    if (target.id === userId) throw new AppError(400, 'FRIEND_SELF', 'Você não pode adicionar a si mesmo.');

    const where = pair(userId, target.id);
    const existing = await prisma.friendship.findUnique({ where: { userLowId_userHighId: where } });
    if (existing?.status === 'ACCEPTED') throw new AppError(409, 'ALREADY_FRIENDS', 'Vocês já são amigos.');
    if (existing && existing.requestedById === userId) throw new AppError(409, 'REQUEST_PENDING', 'Você já enviou um pedido para essa pessoa.');
    // A outra pessoa já tinha pedido: os dois querem, então vira amizade na hora.
    if (existing) {
      await this.accept(userId, existing.id);
      return { accepted: true };
    }

    try {
      const created = await prisma.friendship.create({ data: { ...where, requestedById: userId } });
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, nickname: true } });
      await this.notifications.create({
        userId: target.id,
        type: FRIEND_REQUEST_NOTIFICATION,
        message: `${this.label(me)} quer ser seu amigo na plataforma.`,
        payload: { friendshipId: created.id },
      });
      return { accepted: false };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        const concurrent = await prisma.friendship.findUnique({ where: { userLowId_userHighId: where } });
        if (concurrent?.status === 'ACCEPTED') throw new AppError(409, 'ALREADY_FRIENDS', 'Vocês já são amigos.');
        if (concurrent && concurrent.requestedById === userId) {
          throw new AppError(409, 'REQUEST_PENDING', 'Você já enviou um pedido para essa pessoa.');
        }
        if (concurrent) {
          await this.accept(userId, concurrent.id);
          return { accepted: true };
        }
      }
      throw error;
    }
  }

  async accept(userId: string, friendshipId: string): Promise<void> {
    const row = await this.findPendingFor(userId, friendshipId);
    await prisma.friendship.update({ where: { id: row.id }, data: { status: 'ACCEPTED' } });
    await this.markRequestRead(userId, friendshipId);
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, nickname: true } });
    await this.notifications.create({
      userId: row.requestedById,
      type: 'FRIEND_ACCEPTED',
      message: `${this.label(me)} aceitou seu pedido de amizade.`,
    });
  }

  async decline(userId: string, friendshipId: string): Promise<void> {
    const row = await this.findPendingFor(userId, friendshipId);
    await prisma.friendship.delete({ where: { id: row.id } });
    await this.markRequestRead(userId, friendshipId);
  }

  // Cancela um pedido que a própria pessoa enviou.
  async cancel(userId: string, friendshipId: string): Promise<void> {
    const { count } = await prisma.friendship.deleteMany({ where: { id: friendshipId, requestedById: userId, status: 'PENDING' } });
    if (count === 0) throw new AppError(404, 'REQUEST_NOT_FOUND', 'Pedido não encontrado.');
  }

  async remove(userId: string, friendshipId: string): Promise<void> {
    const { count } = await prisma.friendship.deleteMany({
      where: { id: friendshipId, status: 'ACCEPTED', OR: [{ userLowId: userId }, { userHighId: userId }] },
    });
    if (count === 0) throw new AppError(404, 'FRIENDSHIP_NOT_FOUND', 'Amizade não encontrada.');
  }

  private async assignCode(userId: string): Promise<string> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = randomCode();
      try {
        await prisma.user.update({ where: { id: userId }, data: { friendCode: code } });
        return code;
      } catch (error) {
        if ((error as { code?: string }).code !== 'P2002') throw error;
      }
    }
    throw new AppError(500, 'FRIEND_CODE_FAILED', 'Não foi possível gerar o código agora. Tente de novo.');
  }

  private async findPendingFor(userId: string, friendshipId: string) {
    const row = await prisma.friendship.findFirst({
      where: { id: friendshipId, status: 'PENDING', requestedById: { not: userId }, OR: [{ userLowId: userId }, { userHighId: userId }] },
    });
    if (!row) throw new AppError(404, 'REQUEST_NOT_FOUND', 'Pedido não encontrado ou já respondido.');
    return row;
  }

  private async markRequestRead(userId: string, friendshipId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, type: FRIEND_REQUEST_NOTIFICATION, readAt: null, payload: { path: '$.friendshipId', equals: friendshipId } },
      data: { readAt: new Date() },
    });
  }

  private label(user: { name: string; nickname: string | null } | null): string {
    if (!user) return 'Alguém';
    return user.nickname ? `${user.name} (@${user.nickname})` : user.name;
  }
}
