import { prisma } from '../database/prisma.js';
import { addDays } from '../utils/spaced-repetition.js';
import { advanceStreak } from '../utils/streak-shield.js';
import { dayKeySP, startOfDaySP } from '../utils/time-sp.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  TIER_1: { name: 'Faixa Aplicado', description: 'Chegou ao nível 5', check: () => false },
  TIER_2: { name: 'Faixa Dedicado', description: 'Chegou ao nível 10', check: () => false },
  TIER_3: { name: 'Faixa Veterano', description: 'Chegou ao nível 15', check: () => false },
  TIER_4: { name: 'Faixa Mestre', description: 'Chegou ao nível 20', check: () => false },
  TIER_5: { name: 'Faixa Lenda', description: 'Chegou ao nível 25', check: () => false },
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
    const today = startOfDaySP();
    const streak = await prisma.streak.findUnique({ where: { userId } });

    if (!streak) {
      return prisma.streak.create({ data: { userId, current: 1, longest: 1, lastDate: today } });
    }

    const diffDays = Math.round((today.getTime() - startOfDaySP(streak.lastDate).getTime()) / MS_PER_DAY);
    if (diffDays <= 0) return streak;

    const step = advanceStreak(streak, diffDays - 1);
    const shieldedDates = Array.from({ length: step.coveredDays }, (_, i) =>
      dayKeySP(addDays(startOfDaySP(streak.lastDate), i + 1)),
    );

    const [updated] = await prisma.$transaction([
      prisma.streak.update({
        where: { userId },
        data: { current: step.current, longest: step.longest, shields: step.shields, lastDate: today },
      }),
      prisma.streakShieldUse.createMany({
        data: shieldedDates.map((date) => ({ userId, date })),
        skipDuplicates: true,
      }),
    ]);
    return updated;
  }

  async checkAchievements(userId: string) {
    const stats = await this.getGameStats(userId);
    const existing = await prisma.achievement.findMany({ where: { userId }, select: { type: true } });
    const existingTypes = new Set(existing.map((a) => a.type));

    const candidates = Object.entries(ACHIEVEMENT_DEFS)
      .filter(([type, def]) => !existingTypes.has(type) && def.check(stats))
      .map(([type]) => type);

    if (candidates.length === 0) {
      return [];
    }

    const newAchievements: string[] = [];

    for (const type of candidates) {
      try {
        await prisma.achievement.upsert({
          where: { userId_type: { userId, type } },
          create: { userId, type },
          update: {},
        });
        newAchievements.push(type);
      } catch (err: unknown) {
        // Idempotência: se requisição concorrente já criou o registro (P2002), não é erro
        const prismaErr = err as { code?: string };
        if (prismaErr?.code === 'P2002') {
          newAchievements.push(type);
        } else {
          throw err;
        }
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
