import { prisma } from '../database/prisma.js';
import { startOfDay, addDays } from '../utils/spaced-repetition.js';

const HEATMAP_DAYS = 182;

function dateKey(date: Date): string {
  const d = startOfDay(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export class DashboardService {
  async getSummary(userId: string) {
    const [streak, heatmap, goal, averages] = await Promise.all([
      this.getStreak(userId),
      this.buildHeatmap(userId),
      this.buildGoal(userId),
      this.buildAverages(userId),
    ]);

    return { streak, heatmap, goal, averages };
  }

  async setDailyGoal(userId: string, dailyGoal: number) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { dailyGoal },
      select: { dailyGoal: true },
    });
    return { dailyGoal: user.dailyGoal };
  }

  private async getStreak(userId: string) {
    const streak = await prisma.streak.findUnique({ where: { userId } });
    return { current: streak?.current ?? 0, longest: streak?.longest ?? 0 };
  }

  private async buildHeatmap(userId: string) {
    const since = addDays(startOfDay(new Date()), -HEATMAP_DAYS);

    try {
      // Otimização: agregação GROUP BY direto no banco de dados para evitar carregar milhares de registros em memória
      const [attempts, reviews] = await Promise.all([
        prisma.$queryRaw<{ dateStr: string; cnt: bigint }[]>`
          SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') as dateStr, COUNT(*) as cnt
          FROM QuestionAttempt
          WHERE userId = ${userId} AND createdAt >= ${since}
          GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d')
        `,
        prisma.$queryRaw<{ dateStr: string; cnt: bigint }[]>`
          SELECT DATE_FORMAT(completedAt, '%Y-%m-%d') as dateStr, COUNT(*) as cnt
          FROM TopicReview
          WHERE userId = ${userId} AND completedAt >= ${since}
          GROUP BY DATE_FORMAT(completedAt, '%Y-%m-%d')
        `,
      ]);

      const counts = new Map<string, number>();
      for (const a of attempts) {
        counts.set(a.dateStr, (counts.get(a.dateStr) ?? 0) + Number(a.cnt));
      }
      for (const r of reviews) {
        counts.set(r.dateStr, (counts.get(r.dateStr) ?? 0) + Number(r.cnt));
      }

      return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
    } catch {
      // Fallback seguro via findMany
      const [attempts, reviews] = await Promise.all([
        prisma.questionAttempt.findMany({
          where: { userId, createdAt: { gte: since } },
          select: { createdAt: true },
        }),
        prisma.topicReview.findMany({
          where: { userId, completedAt: { gte: since } },
          select: { completedAt: true },
        }),
      ]);

      const counts = new Map<string, number>();
      for (const a of attempts) counts.set(dateKey(a.createdAt), (counts.get(dateKey(a.createdAt)) ?? 0) + 1);
      for (const r of reviews) {
        if (r.completedAt) counts.set(dateKey(r.completedAt), (counts.get(dateKey(r.completedAt)) ?? 0) + 1);
      }

      return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
    }
  }

  private async buildGoal(userId: string) {
    const today = startOfDay(new Date());

    // Otimização: aggregation COUNT + SUM direto no banco sem alocar arrays de tentativas no Node.js
    const [user, agg] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { dailyGoal: true } }),
      prisma.questionAttempt.aggregate({
        where: { userId, createdAt: { gte: today } },
        _count: { _all: true },
        _sum: { timeSpent: true },
      }),
    ]);

    const studyMinutes = Math.round((agg._sum.timeSpent ?? 0) / 60);
    return {
      dailyQuestions: user?.dailyGoal ?? 30,
      todayQuestions: agg._count._all,
      todayStudyMinutes: studyMinutes,
    };
  }

  private async buildAverages(userId: string) {
    const since30 = addDays(startOfDay(new Date()), -30);
    const since7 = addDays(startOfDay(new Date()), -7);

    // Otimização: contagem rápida de 7 dias via COUNT e somente campo createdAt para os últimos 30 dias
    const [attempts30, count7] = await Promise.all([
      prisma.questionAttempt.findMany({
        where: { userId, createdAt: { gte: since30 } },
        select: { createdAt: true },
      }),
      prisma.questionAttempt.count({
        where: { userId, createdAt: { gte: since7 } },
      }),
    ]);

    const activeDays = new Set(attempts30.map((a) => dateKey(a.createdAt))).size;
    const perActiveDay = activeDays > 0 ? Math.round(attempts30.length / activeDays) : 0;

    return {
      questionsLast30: attempts30.length,
      questionsLast7: count7,
      activeDaysLast30: activeDays,
      perActiveDay,
    };
  }
}
