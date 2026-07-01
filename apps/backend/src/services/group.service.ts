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

    await prisma.groupMember.create({
      data: { groupId: group.id, userId },
    });

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
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const activities = await prisma.groupActivity.groupBy({
      by: ['userId'],
      where: { groupId, createdAt: { gte: weekStart } },
      _sum: { points: true },
    });

    const pointsMap: Record<string, number> = {};
    for (const a of activities) {
      pointsMap[a.userId] = a._sum.points ?? 0;
    }

    const allTimeActivities = await prisma.groupActivity.groupBy({
      by: ['userId'],
      where: { groupId },
      _sum: { points: true },
    });

    const allTimeMap: Record<string, number> = {};
    for (const a of allTimeActivities) {
      allTimeMap[a.userId] = a._sum.points ?? 0;
    }

    return members
      .map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        avatar: m.user.avatar,
        weekPoints: pointsMap[m.user.id] ?? 0,
        totalPoints: allTimeMap[m.user.id] ?? 0,
      }))
      .sort((a, b) => b.weekPoints - a.weekPoints);
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

  async recordActivity(userId: string, type: string, description: string) {
    const points = POINTS_MAP[type] ?? 1;

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
