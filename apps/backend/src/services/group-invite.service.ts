import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { areFriends, findUserIdByIdentifier } from '../repositories/user-lookup.repository.js';

export const GROUP_INVITE_NOTIFICATION = 'GROUP_INVITE';

export interface PendingInvite {
  id: string;
  groupId: string;
  groupName: string;
  invitedBy: { name: string; nickname: string | null };
  createdAt: Date;
}

export interface InviteTarget {
  nickname?: string;
  friendUserId?: string;
}

// Convites para grupo de estudo: só quem já é membro convida, por nickname, e quem recebe aceita ou recusa.
export class GroupInviteService {
  constructor(private readonly notifications = new NotificationRepository()) {}

  async invite(userId: string, groupId: string, target: InviteTarget): Promise<void> {
    const [membership, group, inviter] = await Promise.all([
      prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } }),
      prisma.studyGroup.findUnique({ where: { id: groupId }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, nickname: true } }),
    ]);
    if (!membership || !group || !inviter) {
      throw new AppError(403, 'NOT_GROUP_MEMBER', 'Só membros do grupo podem convidar.');
    }

    const invitee = await this.resolveTarget(userId, target);
    if (invitee.id === userId) throw new AppError(400, 'INVITE_SELF', 'Você já faz parte do grupo.');

    const alreadyMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: invitee.id } },
    });
    if (alreadyMember) throw new AppError(409, 'ALREADY_MEMBER', 'Essa pessoa já está no grupo.');

    const existing = await prisma.groupInvite.findUnique({
      where: { groupId_invitedUserId: { groupId, invitedUserId: invitee.id } },
    });
    if (existing?.status === 'PENDING') {
      throw new AppError(409, 'INVITE_PENDING', 'Já existe um convite pendente para essa pessoa.');
    }

    const invite = await prisma.groupInvite.upsert({
      where: { groupId_invitedUserId: { groupId, invitedUserId: invitee.id } },
      create: { groupId, invitedUserId: invitee.id, invitedById: userId },
      update: { status: 'PENDING', invitedById: userId },
    });

    const who = inviter.nickname ? `${inviter.name} (@${inviter.nickname})` : inviter.name;
    await this.notifications.create({
      userId: invitee.id,
      type: GROUP_INVITE_NOTIFICATION,
      message: `${who} convidou você para o grupo "${group.name}".`,
      payload: { inviteId: invite.id, groupId },
    });
  }

  private async resolveTarget(userId: string, who: InviteTarget): Promise<{ id: string }> {
    if (who.friendUserId) {
      if (!(await areFriends(userId, who.friendUserId))) {
        throw new AppError(403, 'NOT_FRIENDS', 'Só dá para convidar por aqui quem já é seu amigo.');
      }
      return { id: who.friendUserId };
    }
    const found = who.nickname ? await findUserIdByIdentifier(who.nickname) : null;
    if (!found) {
      throw new AppError(404, 'NICKNAME_NOT_FOUND', 'Não achei ninguém com esse nickname ou código. Confira se está certo ou escolha um amigo da lista.');
    }
    return found;
  }

  async listPending(userId: string): Promise<PendingInvite[]> {
    const invites = await prisma.groupInvite.findMany({
      where: { invitedUserId: userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        group: { select: { name: true } },
        invitedBy: { select: { name: true, nickname: true } },
      },
    });
    return invites.map((i) => ({
      id: i.id,
      groupId: i.groupId,
      groupName: i.group.name,
      invitedBy: i.invitedBy,
      createdAt: i.createdAt,
    }));
  }

  async accept(userId: string, inviteId: string): Promise<{ groupId: string }> {
    const invite = await this.findPending(userId, inviteId);
    await prisma.$transaction([
      prisma.groupMember.upsert({
        where: { groupId_userId: { groupId: invite.groupId, userId } },
        create: { groupId: invite.groupId, userId },
        update: {},
      }),
      prisma.groupInvite.update({ where: { id: inviteId }, data: { status: 'ACCEPTED' } }),
    ]);
    await this.markNotificationRead(userId, inviteId);
    return { groupId: invite.groupId };
  }

  async decline(userId: string, inviteId: string): Promise<void> {
    await this.findPending(userId, inviteId);
    await prisma.groupInvite.update({ where: { id: inviteId }, data: { status: 'DECLINED' } });
    await this.markNotificationRead(userId, inviteId);
  }

  private async markNotificationRead(userId: string, inviteId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, type: GROUP_INVITE_NOTIFICATION, readAt: null, payload: { path: '$.inviteId', equals: inviteId } },
      data: { readAt: new Date() },
    });
  }

  private async findPending(userId: string, inviteId: string) {
    const invite = await prisma.groupInvite.findFirst({
      where: { id: inviteId, invitedUserId: userId, status: 'PENDING' },
    });
    if (!invite) throw new AppError(404, 'INVITE_NOT_FOUND', 'Convite não encontrado ou já respondido.');
    return invite;
  }
}
