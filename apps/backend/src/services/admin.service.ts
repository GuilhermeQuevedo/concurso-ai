import { prisma } from '../database/prisma.js';

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export class AdminService {
  async getOverview() {
    const since7 = daysAgo(7);
    const since30 = daysAgo(30);

    const [
      totalUsers,
      activeSubscribers,
      newUsers7,
      newUsers30,
      questionsAnswered,
      essays,
      flashcards,
      sessions,
      contests,
      revenueAgg,
      paymentsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.entitlement.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { createdAt: { gte: since7 } } }),
      prisma.user.count({ where: { createdAt: { gte: since30 } } }),
      prisma.questionAttempt.count(),
      prisma.essay.count(),
      prisma.flashcard.count(),
      prisma.studySession.count(),
      prisma.contest.count(),
      prisma.payment.aggregate({ _sum: { amountCents: true }, where: { status: 'ACTIVE' } }),
      prisma.payment.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      users: { total: totalUsers, newLast7: newUsers7, newLast30: newUsers30 },
      subscriptions: { active: activeSubscribers },
      engagement: { questionsAnswered, essays, flashcards, sessions, contests },
      revenue: {
        receivedCents: revenueAgg._sum.amountCents ?? 0,
        paymentsCount,
      },
    };
  }

  async getUsers() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        streak: { select: { current: true, longest: true } },
        _count: { select: { attempts: true, essays: true, flashcards: true, studySessions: true } },
      },
    });

    const emails = users.map((u) => u.email.toLowerCase());
    const entitlements = await prisma.entitlement.findMany({ where: { email: { in: emails } } });
    const now = new Date();
    const entMap = new Map(
      entitlements.map((e) => [
        e.email,
        e.status === 'ACTIVE' && (!e.expiresAt || e.expiresAt > now),
      ]),
    );

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      activeSubscriber: entMap.get(u.email.toLowerCase()) ?? false,
      streak: u.streak?.current ?? 0,
      questionsAnswered: u._count.attempts,
      essays: u._count.essays,
      flashcards: u._count.flashcards,
      sessions: u._count.studySessions,
    }));
  }
}
