import { levelFromXp } from '@concurso-ai/shared';
import { startOfWeekSP } from '../utils/time-sp.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import type { CreateGroupDTO } from '../validators/group.validators.js';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const POINTS_MAP: Record<string, number> = {
  SESSION_COMPLETED: 10,
  QUESTION_CORRECT: 2,
  QUESTION_ANSWERED: 1,
  PERFECT_SESSION: 20,
  FLASHCARD_REVIEW: 3,
  STREAK_DAY: 5,
};

export class GroupService {
  async create(userId: string, dto: CreateGroupDTO) {
    let code = generateCode();
    while (await prisma.studyGroup.findUnique({ where: { code } })) {
      code = generateCode();
    }

    const group = await prisma.studyGroup.create({
      data: {
        name: dto.name,
        description: dto.description,
        code,
        createdById: userId,
        members: {
          create: { userId, role: 'ADMIN' },
        },
      },
      include: { members: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
    });

    return group;
  }

  async join(userId: string, code: string) {
    const group = await prisma.studyGroup.findUnique({ where: { code } });
    if (!group) {
      throw new AppError(404, 'GROUP_NOT_FOUND', 'Grupo não encontrado com este código');
    }

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (existing) {
      throw new AppError(409, 'ALREADY_MEMBER', 'Você já faz parte deste grupo');
    }

    try {
      await prisma.groupMember.create({
        data: { groupId: group.id, userId },
      });
    } catch (err: unknown) {
      const prismaErr = err as { code?: string };
      if (prismaErr?.code === 'P2002') {
        throw new AppError(409, 'ALREADY_MEMBER', 'Você já faz parte deste grupo');
      }
      throw err;
    }

    return this.getById(userId, group.id);
  }

  async getById(userId: string, groupId: string) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) {
      throw new AppError(403, 'NOT_MEMBER', 'Você não é membro deste grupo');
    }

    return prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
  }

  async listMyGroups(userId: string) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, avatar: true } } },
            },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({ ...m.group, myRole: m.role }));
  }

  async leave(userId: string, groupId: string) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) {
      throw new AppError(404, 'NOT_MEMBER', 'Você não é membro deste grupo');
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    const remaining = await prisma.groupMember.count({ where: { groupId } });
    if (remaining === 0) {
      await prisma.studyGroup.delete({ where: { id: groupId } });
    }
  }

  async getRanking(userId: string, groupId: string) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) {
      throw new AppError(403, 'NOT_MEMBER', 'Você não é membro deste grupo');
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, avatar: true, totalXp: true } } },
    });

    // Ranking do grupo = XP da semana (segunda a domingo, fuso de São Paulo); o nível vem do XP total.
    const weekly = await prisma.xpEvent.groupBy({
      by: ['userId'],
      where: { userId: { in: members.map((m) => m.user.id) }, createdAt: { gte: startOfWeekSP() } },
      _sum: { xp: true },
    });
    const weekMap = new Map(weekly.map((w) => [w.userId, w._sum.xp ?? 0]));

    return members
      .map((m) => {
        const level = levelFromXp(m.user.totalXp);
        return {
          userId: m.user.id,
          name: m.user.name,
          avatar: m.user.avatar,
          weekPoints: weekMap.get(m.user.id) ?? 0,
          totalPoints: m.user.totalXp,
          level: level.level,
          tier: level.tier.name,
        };
      })
      .sort((x, y) => y.weekPoints - x.weekPoints);
  }

  async getFeed(userId: string, groupId: string) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) {
      throw new AppError(403, 'NOT_MEMBER', 'Você não é membro deste grupo');
    }

    return prisma.groupActivity.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async recordActivity(userId: string, type: string, description: string, customPoints?: number) {
    const points = customPoints ?? POINTS_MAP[type] ?? 1;

    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });

    if (memberships.length === 0) return;

    await prisma.groupActivity.createMany({
      data: memberships.map((m) => ({
        groupId: m.groupId,
        userId,
        type,
        points,
        description,
      })),
    });
  }
}
