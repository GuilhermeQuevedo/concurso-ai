import {
  CAP_GROUP,
  DAILY_XP_CAP,
  ESSAY_WEEKLY_LIMIT,
  SOURCE_DAILY_CAP,
  appliesStreakMultiplier,
  grantableXp,
  levelFromXp,
  streakMultiplier,
  type CapState,
  type LevelInfo,
  type XpSource,
} from '@concurso-ai/shared';

import { prisma } from '../database/prisma.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { startOfDaySP, startOfWeekSP } from '../utils/time-sp.js';
import { MAX_SHIELDS, displayedStreak } from '../utils/streak-shield.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface XpAward {
  granted: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  tierName: string | null;
}

export interface XpSummary {
  totalXp: number;
  level: LevelInfo;
  multiplier: number;
  today: { total: number; cap: number; bySource: Record<string, { earned: number; cap: number }> };
  weekXp: number;
}

const NO_AWARD = (totalXp: number): XpAward => ({ granted: 0, totalXp, level: levelFromXp(totalXp).level, leveledUp: false, tierName: null });

// Livro-caixa de XP: cada evento pontua uma vez (índice único) e respeita os tetos do dia.
export class XpService {
  constructor(private readonly notifications = new NotificationRepository()) {}

  async award(userId: string, source: XpSource, refId: string, requested: number): Promise<XpAward> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true, tierRewarded: true } });
    if (!user) return NO_AWARD(0);

    const multiplied = appliesStreakMultiplier(source) ? Math.round(requested * (await this.multiplier(userId))) : requested;
    const granted = await this.capped(userId, source, multiplied);

    // Flashcard registra mesmo sem XP: é o que conta os 15 cartões do dia de estudo.
    if (granted === 0 && source !== 'FLASHCARD') return NO_AWARD(user.totalXp);

    const created = await this.record(userId, source, refId, granted);
    if (!created) return NO_AWARD(user.totalXp);
    if (granted === 0) return NO_AWARD(user.totalXp);

    const updated = await prisma.user.update({ where: { id: userId }, data: { totalXp: { increment: granted } }, select: { totalXp: true } });
    const before = levelFromXp(user.totalXp);
    const after = levelFromXp(updated.totalXp);
    const rewardedTier = after.tier.index > user.tierRewarded ? after.tier : null;
    if (rewardedTier) await this.rewardTier(userId, rewardedTier.index, rewardedTier.name);

    return {
      granted,
      totalXp: updated.totalXp,
      level: after.level,
      leveledUp: after.level > before.level,
      tierName: rewardedTier?.name ?? null,
    };
  }

  async summary(userId: string): Promise<XpSummary> {
    const [user, bySource, week] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true } }),
      this.todayBySource(userId),
      prisma.xpEvent.aggregate({ where: { userId, createdAt: { gte: startOfWeekSP() } }, _sum: { xp: true } }),
    ]);
    const totalXp = user?.totalXp ?? 0;
    const caps: Record<string, { earned: number; cap: number }> = {};
    for (const group of new Set(Object.values(CAP_GROUP))) {
      const cap = SOURCE_DAILY_CAP[group];
      if (Number.isFinite(cap)) caps[group] = { earned: bySource[group] ?? 0, cap };
    }
    const total = Object.entries(bySource).reduce((sum, [group, xp]) => sum + (group === 'ESSAY' ? 0 : xp), 0);
    return {
      totalXp,
      level: levelFromXp(totalXp),
      multiplier: await this.multiplier(userId),
      today: { total, cap: DAILY_XP_CAP, bySource: caps },
      weekXp: week._sum.xp ?? 0,
    };
  }

  async countToday(userId: string, source: XpSource): Promise<number> {
    return prisma.xpEvent.count({ where: { userId, source, createdAt: { gte: startOfDaySP() } } });
  }

  async hasRecentCorrect(userId: string, questionId: string, excludeAttemptId: string, days: number): Promise<boolean> {
    const since = new Date(Date.now() - days * MS_PER_DAY);
    const count = await prisma.questionAttempt.count({
      where: { userId, questionId, isCorrect: true, id: { not: excludeAttemptId }, createdAt: { gte: since } },
    });
    return count > 0;
  }

  private async multiplier(userId: string): Promise<number> {
    const streak = await prisma.streak.findUnique({ where: { userId } });
    if (!streak) return 1;
    const days = Math.round((startOfDaySP().getTime() - startOfDaySP(streak.lastDate).getTime()) / MS_PER_DAY);
    return streakMultiplier(displayedStreak(streak, days));
  }

  private async todayBySource(userId: string): Promise<Partial<Record<XpSource, number>>> {
    const rows = await prisma.xpEvent.groupBy({
      by: ['source'],
      where: { userId, createdAt: { gte: startOfDaySP() } },
      _sum: { xp: true },
    });
    const grouped: Partial<Record<XpSource, number>> = {};
    for (const row of rows) {
      const group = CAP_GROUP[row.source as XpSource];
      if (group) grouped[group] = (grouped[group] ?? 0) + (row._sum.xp ?? 0);
    }
    return grouped;
  }

  private async capped(userId: string, source: XpSource, requested: number): Promise<number> {
    if (requested <= 0) return 0;
    if (source === 'ESSAY') {
      const used = await prisma.xpEvent.count({ where: { userId, source: 'ESSAY', createdAt: { gte: startOfWeekSP() } } });
      if (used >= ESSAY_WEEKLY_LIMIT) return 0;
    }
    const bySource = await this.todayBySource(userId);
    const total = Object.entries(bySource).reduce((sum, [group, xp]) => sum + (group === 'ESSAY' ? 0 : xp), 0);
    const state: CapState = { bySource, total };
    return grantableXp(source, requested, state);
  }

  private async record(userId: string, source: XpSource, refId: string, xp: number): Promise<boolean> {
    try {
      await prisma.xpEvent.create({ data: { userId, source, refId: refId.slice(0, 100), xp } });
      return true;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') return false;
      throw error;
    }
  }

  // Entrar em uma faixa nova: +1 escudo (respeitando o máximo), aviso no sino e conquista da faixa.
  private async rewardTier(userId: string, tierIndex: number, tierName: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { tierRewarded: tierIndex } });
    if (tierIndex <= 0) return;
    const streak = await prisma.streak.findUnique({ where: { userId } });
    const gaveShield = !!streak && streak.shields < MAX_SHIELDS;
    if (gaveShield) await prisma.streak.update({ where: { userId }, data: { shields: { increment: 1 } } });
    await prisma.achievement.upsert({
      where: { userId_type: { userId, type: `TIER_${tierIndex}` } },
      create: { userId, type: `TIER_${tierIndex}` },
      update: {},
    });
    await this.notifications.create({
      userId,
      type: 'TIER_UP',
      message: `Você chegou à faixa ${tierName}!${gaveShield ? ' Ganhou +1 escudo de sequência.' : ''}`,
    });
  }
}


export const xpService = new XpService();
