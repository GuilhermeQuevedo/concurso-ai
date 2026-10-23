import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';

const CORRECT_WEIGHT = 10;
const STREAK_WEIGHT = 5;
const GAME_WEIGHT = 0.25;
const GAME_WINDOW_MS = 30 * 86400000;

interface SuggestRankingInput {
  title: string;
  description?: string;
  documentId?: string;
  subjectId?: string;
}

export class RankingService {
  async suggest(userId: string, dto: SuggestRankingInput) {
    let subjectId = dto.subjectId ?? null;

    if (dto.documentId) {
      const doc = await prisma.document.findUnique({ where: { id: dto.documentId } });
      if (!doc || doc.userId !== userId) {
        throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
      }
      if (!subjectId) subjectId = doc.subjectId;
    }

    return prisma.rankingBoard.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        documentId: dto.documentId ?? null,
        subjectId,
        createdById: userId,
        status: 'SUGGESTED',
      },
    });
  }

  async listApproved() {
    return prisma.rankingBoard.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        subjectId: true,
        createdAt: true,
        subject: { select: { name: true } },
        _count: { select: { participants: true } },
      },
    });
  }

  async listPending() {
    return prisma.rankingBoard.findMany({
      where: { status: 'SUGGESTED' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        document: { select: { name: true, kind: true } },
        subject: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });
  }

  async setStatus(id: string, adminId: string, status: 'APPROVED' | 'REJECTED') {
    const board = await prisma.rankingBoard.findUnique({ where: { id } });
    if (!board) throw new AppError(404, 'RANKING_NOT_FOUND', 'Ranking não encontrado');
    return prisma.rankingBoard.update({
      where: { id },
      data: { status, approvedById: adminId },
    });
  }

  async delete(id: string) {
    const board = await prisma.rankingBoard.findUnique({ where: { id } });
    if (!board) throw new AppError(404, 'RANKING_NOT_FOUND', 'Ranking não encontrado');
    await prisma.rankingBoard.delete({ where: { id } });
  }

  async join(userId: string, rankingId: string) {
    const board = await prisma.rankingBoard.findUnique({ where: { id: rankingId } });
    if (!board || board.status !== 'APPROVED') {
      throw new AppError(404, 'RANKING_NOT_FOUND', 'Ranking não disponível');
    }
    return prisma.rankingParticipant.upsert({
      where: { rankingId_userId: { rankingId, userId } },
      create: { rankingId, userId },
      update: {},
    });
  }

  async leave(userId: string, rankingId: string) {
    await prisma.rankingParticipant
      .delete({ where: { rankingId_userId: { rankingId, userId } } })
      .catch(() => {});
  }

  async leaderboard(rankingId: string, currentUserId: string) {
    const board = await prisma.rankingBoard.findUnique({
      where: { id: rankingId },
      select: {
        id: true,
        title: true,
        description: true,
        subjectId: true,
        status: true,
        subject: { select: { name: true } },
      },
    });
    if (!board || board.status !== 'APPROVED') {
      throw new AppError(404, 'RANKING_NOT_FOUND', 'Ranking não disponível');
    }

    const participants = await prisma.rankingParticipant.findMany({
      where: { rankingId },
      select: { userId: true },
    });
    const userIds = participants.map((p) => p.userId);

    if (userIds.length === 0) {
      return { board, joined: false, entries: [] };
    }

    const attemptWhere = board.subjectId
      ? { userId: { in: userIds }, question: { subjectId: board.subjectId } }
      : { userId: { in: userIds } };

    const [totals, corrects, streaks, users, gamePoints] = await Promise.all([
      prisma.questionAttempt.groupBy({
        by: ['userId'],
        where: attemptWhere,
        _count: { _all: true },
      }),
      prisma.questionAttempt.groupBy({
        by: ['userId'],
        where: { ...attemptWhere, isCorrect: true },
        _count: { _all: true },
      }),
      prisma.streak.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, current: true },
      }),
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, avatar: true },
      }),
      prisma.gameSession.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, createdAt: { gte: new Date(Date.now() - GAME_WINDOW_MS) } },
        _sum: { points: true },
      }),
    ]);

    const totalMap = new Map(totals.map((t) => [t.userId, t._count._all]));
    const correctMap = new Map(corrects.map((c) => [c.userId, c._count._all]));
    const streakMap = new Map(streaks.map((s) => [s.userId, s.current]));
    const userMap = new Map(users.map((u) => [u.id, u]));
    const gameMap = new Map(gamePoints.map((g) => [g.userId, g._sum.points ?? 0]));

    const entries = userIds
      .map((uid) => {
        const correct = correctMap.get(uid) ?? 0;
        const total = totalMap.get(uid) ?? 0;
        const streak = streakMap.get(uid) ?? 0;
        const games = gameMap.get(uid) ?? 0;
        const user = userMap.get(uid);
        return {
          userId: uid,
          name: user?.name ?? 'Aluno',
          avatar: user?.avatar ?? null,
          correct,
          total,
          streak,
          games,
          score: correct * CORRECT_WEIGHT + streak * STREAK_WEIGHT + Math.round(games * GAME_WEIGHT),
          isCurrentUser: uid === currentUserId,
        };
      })
      .sort((a, b) => b.score - a.score || b.correct - a.correct)
      .map((entry, index) => ({ ...entry, position: index + 1 }));

    return {
      board,
      joined: userIds.includes(currentUserId),
      entries,
    };
  }
}
