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

  private async buildGoal(userId: string) {
    const today = startOfDay(new Date());
    const [user, attempts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { dailyGoal: true } }),
      prisma.questionAttempt.findMany({
        where: { userId, createdAt: { gte: today } },
        select: { timeSpent: true },
      }),
    ]);

    const studyMinutes = Math.round(attempts.reduce((sum, a) => sum + a.timeSpent, 0) / 60);
    return {
      dailyQuestions: user?.dailyGoal ?? 30,
      todayQuestions: attempts.length,
      todayStudyMinutes: studyMinutes,
    };
  }

  private async buildAverages(userId: string) {
    const since30 = addDays(startOfDay(new Date()), -30);
    const since7 = addDays(startOfDay(new Date()), -7);
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId, createdAt: { gte: since30 } },
      select: { createdAt: true },
    });

    const last7 = attempts.filter((a) => a.createdAt >= since7).length;
    const activeDays = new Set(attempts.map((a) => dateKey(a.createdAt))).size;
    const perActiveDay = activeDays > 0 ? Math.round(attempts.length / activeDays) : 0;

    return {
      questionsLast30: attempts.length,
      questionsLast7: last7,
      activeDaysLast30: activeDays,
      perActiveDay,
    };
  }
}
