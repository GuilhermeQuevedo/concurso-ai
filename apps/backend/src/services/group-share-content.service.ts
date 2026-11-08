import type { Prisma } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';

import { GroupShareService } from './group-share.service.js';

const MAX_CARDS = 1000;
const COPY_SUFFIX = ' (do grupo)';

export type ShareDetail =
  | { type: 'DECK'; title: string; cards: { front: string; back: string }[] }
  | {
      type: 'CONTEST';
      title: string;
      organization: string | null;
      role: string | null;
      examBoard: string | null;
      examDate: Date | null;
      topics: { discipline: string; topic: string }[];
    }
  | { type: 'SCHEDULE'; title: string; examDate: string; dailyHours: number; subjects: unknown; schedule: unknown };

function withoutProgress(schedule: unknown): Prisma.InputJsonValue {
  const clone = JSON.parse(JSON.stringify(schedule ?? {})) as { weeks?: { days?: { completed?: boolean }[] }[] };
  for (const week of clone.weeks ?? []) {
    for (const day of week.days ?? []) {
      if (day.completed !== undefined) day.completed = false;
    }
  }
  return clone as Prisma.InputJsonValue;
}

// Leitura e cópia do que foi compartilhado: só dados do conteúdo, nunca progresso, notas ou documentos de quem compartilhou.
export class GroupShareContentService {
  constructor(private readonly shares = new GroupShareService()) {}

  async detail(userId: string, groupId: string, shareId: string): Promise<ShareDetail> {
    const share = await this.shares.findForMember(userId, groupId, shareId);
    const gone = new AppError(404, 'SHARE_SOURCE_NOT_FOUND', 'O dono removeu este item.');

    if (share.type === 'DECK') {
      const deck = await prisma.flashcardDeck.findUnique({
        where: { id: share.refId },
        select: { name: true, cards: { select: { front: true, back: true }, orderBy: { createdAt: 'asc' }, take: MAX_CARDS } },
      });
      if (!deck) throw gone;
      return { type: 'DECK', title: deck.name, cards: deck.cards };
    }
    if (share.type === 'CONTEST') {
      const contest = await prisma.contest.findUnique({
        where: { id: share.refId },
        select: {
          name: true,
          organization: true,
          role: true,
          examBoard: true,
          examDate: true,
          syllabus: { select: { discipline: true, topic: true }, orderBy: { order: 'asc' } },
        },
      });
      if (!contest) throw gone;
      const { syllabus, name, ...info } = contest;
      return { type: 'CONTEST', title: name, ...info, topics: syllabus };
    }
    const schedule = await prisma.studySchedule.findUnique({ where: { id: share.refId } });
    if (!schedule) throw gone;
    const title = (schedule.schedule as { title?: string } | null)?.title ?? share.title;
    return {
      type: 'SCHEDULE',
      title,
      examDate: schedule.examDate,
      dailyHours: schedule.dailyHours,
      subjects: schedule.subjects,
      schedule: withoutProgress(schedule.schedule),
    };
  }

  async copy(userId: string, groupId: string, shareId: string): Promise<{ type: string; id: string }> {
    const share = await this.shares.findForMember(userId, groupId, shareId);
    if (share.type === 'DECK') return { type: 'DECK', id: await this.copyDeck(userId, share.refId) };
    if (share.type === 'CONTEST') return { type: 'CONTEST', id: await this.copyContest(userId, share.refId) };
    return { type: 'SCHEDULE', id: await this.copySchedule(userId, share.refId) };
  }

  private async copyDeck(userId: string, deckId: string): Promise<string> {
    const deck = await prisma.flashcardDeck.findUnique({
      where: { id: deckId },
      include: { cards: { take: MAX_CARDS, orderBy: { createdAt: 'asc' } } },
    });
    if (!deck) throw new AppError(404, 'SHARE_SOURCE_NOT_FOUND', 'O dono removeu este item.');
    const created = await prisma.flashcardDeck.create({
      data: {
        userId,
        name: `${deck.name}${COPY_SUFFIX}`.slice(0, 190),
        subjectId: deck.subjectId,
        topic: deck.topic,
        color: deck.color,
        cards: {
          // Revisão espaçada recomeça do zero: cada pessoa tem o próprio progresso.
          create: deck.cards.map((c) => ({ userId, subjectId: c.subjectId, front: c.front, back: c.back, source: c.source })),
        },
      },
      select: { id: true },
    });
    return created.id;
  }

  private async copyContest(userId: string, contestId: string): Promise<string> {
    const contest = await prisma.contest.findUnique({ where: { id: contestId }, include: { syllabus: true } });
    if (!contest) throw new AppError(404, 'SHARE_SOURCE_NOT_FOUND', 'O dono removeu este item.');
    const created = await prisma.contest.create({
      data: {
        userId,
        name: `${contest.name}${COPY_SUFFIX}`.slice(0, 190),
        organization: contest.organization,
        examBoard: contest.examBoard,
        role: contest.role,
        focus: contest.focus,
        examDate: contest.examDate,
        syllabus: {
          create: contest.syllabus.map((item) => ({
            subjectId: item.subjectId,
            discipline: item.discipline,
            topic: item.topic,
            order: item.order,
            importance: item.importance,
            focus: item.focus,
          })),
        },
      },
      select: { id: true },
    });
    return created.id;
  }

  private async copySchedule(userId: string, scheduleId: string): Promise<string> {
    const schedule = await prisma.studySchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new AppError(404, 'SHARE_SOURCE_NOT_FOUND', 'O dono removeu este item.');
    const created = await prisma.studySchedule.create({
      data: {
        userId,
        examDate: schedule.examDate,
        dailyHours: schedule.dailyHours,
        subjects: schedule.subjects as Prisma.InputJsonValue,
        schedule: withoutProgress(schedule.schedule),
        hasPerformanceData: false,
      },
      select: { id: true },
    });
    return created.id;
  }
}
