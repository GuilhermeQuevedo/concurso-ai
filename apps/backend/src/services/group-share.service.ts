import type { ShareType } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';

export interface ShareView {
  id: string;
  type: ShareType;
  title: string;
  summary: string;
  sharedBy: { id: string; name: string; nickname: string | null };
  isMine: boolean;
  createdAt: Date;
}

interface SourceInfo {
  title: string;
  summary: string;
}

const MAX_TITLE = 200;

export async function assertGroupMember(groupId: string, userId: string): Promise<void> {
  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (!membership) throw new AppError(403, 'NOT_GROUP_MEMBER', 'Você não faz parte deste grupo.');
}

function scheduleTitle(schedule: unknown, examDate: string): string {
  const title = (schedule as { title?: unknown } | null)?.title;
  return typeof title === 'string' && title.trim() ? title.trim() : `Cronograma até ${examDate}`;
}

// Compartilhar é uma escolha explícita do dono: o grupo só enxerga o que foi publicado aqui.
export class GroupShareService {
  async list(userId: string, groupId: string): Promise<ShareView[]> {
    await assertGroupMember(groupId, userId);
    const shares = await prisma.groupShare.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: { sharedBy: { select: { id: true, name: true, nickname: true } } },
    });

    const sources = await this.loadSources(shares.map((s) => ({ type: s.type, refId: s.refId })));
    const orphans = shares.filter((s) => !sources.has(`${s.type}:${s.refId}`)).map((s) => s.id);
    if (orphans.length > 0) await prisma.groupShare.deleteMany({ where: { id: { in: orphans } } });

    return shares
      .filter((s) => sources.has(`${s.type}:${s.refId}`))
      .map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        summary: sources.get(`${s.type}:${s.refId}`)?.summary ?? '',
        sharedBy: s.sharedBy,
        isMine: s.sharedById === userId,
        createdAt: s.createdAt,
      }));
  }

  async create(userId: string, groupId: string, type: ShareType, refId: string): Promise<void> {
    await assertGroupMember(groupId, userId);
    const title = await this.ownedTitle(userId, type, refId);
    await prisma.groupShare.upsert({
      where: { groupId_type_refId: { groupId, type, refId } },
      create: { groupId, sharedById: userId, type, refId, title },
      update: { title },
    });
  }

  async remove(userId: string, groupId: string, shareId: string): Promise<void> {
    await assertGroupMember(groupId, userId);
    const { count } = await prisma.groupShare.deleteMany({ where: { id: shareId, groupId, sharedById: userId } });
    if (count === 0) throw new AppError(404, 'SHARE_NOT_FOUND', 'Só quem compartilhou pode retirar este item.');
  }

  async findForMember(userId: string, groupId: string, shareId: string) {
    await assertGroupMember(groupId, userId);
    const share = await prisma.groupShare.findFirst({ where: { id: shareId, groupId } });
    if (!share) throw new AppError(404, 'SHARE_NOT_FOUND', 'Item compartilhado não encontrado.');
    return share;
  }

  private async ownedTitle(userId: string, type: ShareType, refId: string): Promise<string> {
    const notFound = new AppError(404, 'SHARE_SOURCE_NOT_FOUND', 'Item não encontrado na sua conta.');
    if (type === 'DECK') {
      const deck = await prisma.flashcardDeck.findFirst({ where: { id: refId, userId }, select: { name: true } });
      if (!deck) throw notFound;
      return deck.name.slice(0, MAX_TITLE);
    }
    if (type === 'CONTEST') {
      const contest = await prisma.contest.findFirst({ where: { id: refId, userId }, select: { name: true } });
      if (!contest) throw notFound;
      return contest.name.slice(0, MAX_TITLE);
    }
    const schedule = await prisma.studySchedule.findFirst({
      where: { id: refId, userId },
      select: { schedule: true, examDate: true },
    });
    if (!schedule) throw notFound;
    return scheduleTitle(schedule.schedule, schedule.examDate).slice(0, MAX_TITLE);
  }

  private async loadSources(refs: { type: ShareType; refId: string }[]): Promise<Map<string, SourceInfo>> {
    const idsOf = (type: ShareType) => refs.filter((r) => r.type === type).map((r) => r.refId);
    const [decks, cardCounts, contests, topicCounts, schedules] = await Promise.all([
      prisma.flashcardDeck.findMany({ where: { id: { in: idsOf('DECK') } }, select: { id: true, name: true } }),
      prisma.flashcard.groupBy({ by: ['deckId'], where: { deckId: { in: idsOf('DECK') } }, _count: { _all: true } }),
      prisma.contest.findMany({ where: { id: { in: idsOf('CONTEST') } }, select: { id: true, name: true } }),
      prisma.contestSyllabusItem.groupBy({
        by: ['contestId'],
        where: { contestId: { in: idsOf('CONTEST') } },
        _count: { _all: true },
      }),
      prisma.studySchedule.findMany({
        where: { id: { in: idsOf('SCHEDULE') } },
        select: { id: true, examDate: true, dailyHours: true, schedule: true },
      }),
    ]);

    const map = new Map<string, SourceInfo>();
    const cards = new Map(cardCounts.map((c) => [c.deckId, c._count._all]));
    for (const d of decks) map.set(`DECK:${d.id}`, { title: d.name, summary: `${cards.get(d.id) ?? 0} cartões` });
    const topics = new Map(topicCounts.map((t) => [t.contestId, t._count._all]));
    for (const c of contests) map.set(`CONTEST:${c.id}`, { title: c.name, summary: `${topics.get(c.id) ?? 0} tópicos` });
    for (const s of schedules) {
      map.set(`SCHEDULE:${s.id}`, {
        title: scheduleTitle(s.schedule, s.examDate),
        summary: `Prova em ${s.examDate} · ${s.dailyHours}h por dia`,
      });
    }
    return map;
  }
}
