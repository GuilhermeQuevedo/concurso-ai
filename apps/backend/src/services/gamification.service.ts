import { prisma } from '../database/prisma.js';

const ACHIEVEMENT_DEFS: Record<string, { name: string; description: string; check: (stats: UserGameStats) => boolean }> = {
  FIRST_QUESTION: {
    name: 'Primeira Questão',
    description: 'Respondeu sua primeira questão',
    check: (s) => s.totalAnswered >= 1,
  },
  TEN_QUESTIONS: {
    name: 'Dedicado',
    description: 'Respondeu 10 questões',
    check: (s) => s.totalAnswered >= 10,
  },
  FIFTY_QUESTIONS: {
    name: 'Estudioso',
    description: 'Respondeu 50 questões',
    check: (s) => s.totalAnswered >= 50,
  },
  HUNDRED_QUESTIONS: {
    name: 'Veterano',
    description: 'Respondeu 100 questões',
    check: (s) => s.totalAnswered >= 100,
  },
  PERFECT_SESSION: {
    name: 'Perfeição',
    description: 'Acertou todas as questões em uma sessão',
    check: (s) => s.hadPerfectSession,
  },
  STREAK_3: {
    name: 'Constância',
    description: '3 dias seguidos estudando',
    check: (s) => s.currentStreak >= 3,
  },
  STREAK_7: {
    name: 'Semana Perfeita',
    description: '7 dias seguidos estudando',
    check: (s) => s.currentStreak >= 7,
  },
  STREAK_30: {
    name: 'Maratonista',
    description: '30 dias seguidos estudando',
    check: (s) => s.currentStreak >= 30,
  },
  FIRST_FLASHCARD: {
    name: 'Memorizador',
    description: 'Criou seu primeiro flashcard',
    check: (s) => s.totalFlashcards >= 1,
  },
};

interface UserGameStats {
  totalAnswered: number;
  currentStreak: number;
  hadPerfectSession: boolean;
  totalFlashcards: number;
}

export class GamificationService {
  async updateStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = await prisma.streak.findUnique({ where: { userId } });

    if (!streak) {
      streak = await prisma.streak.create({
        data: { userId, current: 1, longest: 1, lastDate: today },
      });
      return streak;
    }

    const lastDate = new Date(streak.lastDate);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return streak;

    if (diffDays === 1) {
      const newCurrent = streak.current + 1;
      return prisma.streak.update({
        where: { userId },
        data: {
          current: newCurrent,
          longest: Math.max(streak.longest, newCurrent),
          lastDate: today,
        },
      });
    }

    return prisma.streak.update({
      where: { userId },
      data: { current: 1, lastDate: today },
    });
  }

  async checkAchievements(userId: string) {
    const stats = await this.getGameStats(userId);
    const existing = await prisma.achievement.findMany({ where: { userId } });
    const existingTypes = new Set(existing.map((a) => a.type));

    const newAchievements: string[] = [];

    for (const [type, def] of Object.entries(ACHIEVEMENT_DEFS)) {
      if (!existingTypes.has(type) && def.check(stats)) {
        await prisma.achievement.create({ data: { userId, type } });
        newAchievements.push(type);
      }
    }

    return newAchievements;
  }

  async getProfile(userId: string) {
    const [streak, achievements, stats] = await Promise.all([
      prisma.streak.findUnique({ where: { userId } }),
      prisma.achievement.findMany({ where: { userId }, orderBy: { unlockedAt: 'desc' } }),
      this.getGameStats(userId),
    ]);

    return {
      streak: streak ?? { current: 0, longest: 0 },
      achievements: achievements.map((a) => ({
        type: a.type,
        ...ACHIEVEMENT_DEFS[a.type],
        unlockedAt: a.unlockedAt,
      })),
      availableAchievements: Object.entries(ACHIEVEMENT_DEFS).map(([type, def]) => ({
        type,
        name: def.name,
        description: def.description,
        unlocked: achievements.some((a) => a.type === type),
      })),
      stats,
    };
  }

  private async getGameStats(userId: string): Promise<UserGameStats> {
    const [totalAnswered, perfectSessions, totalFlashcards, streak] = await Promise.all([
      prisma.questionAttempt.count({ where: { userId } }),
      prisma.studySession.findMany({
        where: { userId, correctCount: { gt: 0 } },
        select: { questionsCount: true, correctCount: true },
      }),
      prisma.flashcard.count({ where: { userId } }),
      prisma.streak.findUnique({ where: { userId } }),
    ]);

    const hadPerfectSession = perfectSessions.some(
      (s) => s.questionsCount > 0 && s.questionsCount === s.correctCount,
    );

    return {
      totalAnswered,
      currentStreak: streak?.current ?? 0,
      hadPerfectSession,
      totalFlashcards,
    };
  }
}
