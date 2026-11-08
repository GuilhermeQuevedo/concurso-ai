// Recalcula o XP de contas antigas a partir do histórico, pelas regras de docs/08-pontuacao.md.
// Roda uma vez depois do deploy (pnpm --filter @concurso-ai/backend exec tsx prisma/backfill-xp.ts); pode repetir sem duplicar.
// Sem tetos e sem multiplicador: o objetivo é que ninguém perca nível. Flashcards e dúvidas não têm histórico, então não entram.
import { ESSAY_WEEKLY_LIMIT, REVIEW_XP, essayXp, gameXp, levelFromXp, questionXp } from '@concurso-ai/shared';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface EventRow {
  userId: string;
  source: string;
  refId: string;
  xp: number;
  createdAt: Date;
}

async function questionEvents(userId: string): Promise<EventRow[]> {
  const attempts = await prisma.questionAttempt.findMany({
    where: { userId, isCorrect: true },
    select: { id: true, createdAt: true, question: { select: { difficulty: true } } },
  });
  return attempts.map((a) => ({ userId, source: 'QUESTION', refId: a.id, xp: questionXp(a.question.difficulty, true), createdAt: a.createdAt }));
}

async function gameEvents(userId: string): Promise<EventRow[]> {
  const sessions = await prisma.gameSession.findMany({ where: { userId, points: { gt: 0 } }, select: { id: true, points: true, createdAt: true } });
  return sessions.map((s) => ({ userId, source: 'GAME', refId: s.id, xp: gameXp(s.points), createdAt: s.createdAt }));
}

async function reviewEvents(userId: string): Promise<EventRow[]> {
  const reviews = await prisma.topicReview.findMany({ where: { userId, completedAt: { not: null } }, select: { id: true, completedAt: true } });
  return reviews.map((r) => ({ userId, source: 'REVIEW', refId: r.id, xp: REVIEW_XP, createdAt: r.completedAt as Date }));
}

async function essayEvents(userId: string): Promise<EventRow[]> {
  const essays = await prisma.essay.findMany({
    where: { userId, status: 'GRADED', score: { not: null } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, score: true, maxScore: true, createdAt: true },
  });
  const perWeek = new Map<number, number>();
  const rows: EventRow[] = [];
  for (const e of essays) {
    const week = Math.floor(e.createdAt.getTime() / WEEK_MS);
    if ((perWeek.get(week) ?? 0) >= ESSAY_WEEKLY_LIMIT) continue;
    perWeek.set(week, (perWeek.get(week) ?? 0) + 1);
    rows.push({ userId, source: 'ESSAY', refId: e.id, xp: essayXp(e.score ?? 0, e.maxScore ?? 0), createdAt: e.createdAt });
  }
  return rows;
}

async function backfillUser(userId: string): Promise<number> {
  const rows = (await Promise.all([questionEvents(userId), gameEvents(userId), reviewEvents(userId), essayEvents(userId)])).flat();
  const valid = rows.filter((r) => r.xp > 0);
  if (valid.length > 0) await prisma.xpEvent.createMany({ data: valid, skipDuplicates: true });
  const total = await prisma.xpEvent.aggregate({ where: { userId }, _sum: { xp: true } });
  const totalXp = total._sum.xp ?? 0;
  // Faixa já alcançada fica registrada sem dar escudo retroativo.
  await prisma.user.update({ where: { id: userId }, data: { totalXp, tierRewarded: levelFromXp(totalXp).tier.index } });
  return totalXp;
}

async function main(): Promise<void> {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  for (const user of users) {
    const totalXp = await backfillUser(user.id);
    console.log(`${user.email}: ${totalXp} XP (nível ${levelFromXp(totalXp).level})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
