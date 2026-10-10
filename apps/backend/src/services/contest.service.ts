import fs from 'node:fs/promises';
import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import { extractPdf } from '../utils/pdf.js';
import { decodeTextBuffer } from '../utils/text-encoding.js';
import { env } from '../config/env.js';
import type { CreateContestDTO, UpdateContestDTO } from '../validators/contest.validators.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { buildReviewSchedule, startOfDay, addDays } from '../utils/spaced-repetition.js';
import { computeDisciplinePriority } from '../utils/priority.js';

interface UploadedFile {
  originalname: string;
  mimetype: string;
  path: string;
}

export class ContestService {
  constructor(private readonly aiProvider: IAIProvider) {}

  async create(userId: string, dto: CreateContestDTO) {
    return prisma.contest.create({
      data: {
        userId,
        name: dto.name,
        organization: dto.organization ?? null,
        examBoard: dto.examBoard ?? null,
        role: dto.role ?? null,
        examDate: dto.examDate ? new Date(dto.examDate) : null,
      },
      include: { syllabus: true },
    });
  }

  async createFromEdital(userId: string, file: UploadedFile, focus?: string) {
    let content: string;
    if (file.mimetype === 'application/pdf') {
      const pdf = await extractPdf(file.path);
      if (pdf.pages > env.EDITAL_MAX_PAGES) {
        await fs.unlink(file.path).catch(() => {});
        throw new AppError(
          400,
          'EDITAL_TOO_LONG',
          `O edital tem ${pdf.pages} páginas. O limite é ${env.EDITAL_MAX_PAGES}. Envie apenas as páginas do conteúdo programático.`,
        );
      }
      content = pdf.text;
    } else {
      content = decodeTextBuffer(await fs.readFile(file.path)).trim();
    }
    await fs.unlink(file.path).catch(() => {});

    if (content.length < 200) {
      throw new AppError(400, 'EDITAL_TOO_SHORT', 'Não foi possível extrair texto suficiente do edital. Verifique se o PDF contém texto (não apenas imagens).');
    }

    const trimmedFocus = focus?.trim() || undefined;
    const parsed = await this.aiProvider.parseEdital({ content, focus: trimmedFocus });

    const focusSet =
      parsed.focusDisciplines && parsed.focusDisciplines.length > 0
        ? new Set(parsed.focusDisciplines.map((d) => d.toLowerCase().trim()))
        : null;

    const document = await prisma.document.create({
      data: {
        userId,
        name: file.originalname,
        type: 'PDF',
        content,
      },
    });

    return prisma.contest.create({
      data: {
        userId,
        name: parsed.name,
        organization: parsed.organization,
        examBoard: parsed.examBoard,
        role: parsed.role,
        focus: trimmedFocus ?? null,
        examDate: parsed.examDate ? new Date(parsed.examDate) : null,
        editalDocumentId: document.id,
        syllabus: {
          create: parsed.syllabus.flatMap((entry, disciplineIndex) =>
            entry.topics.map((topic, topicIndex) => ({
              discipline: entry.discipline,
              topic,
              order: disciplineIndex * 1000 + topicIndex,
              focus: focusSet ? focusSet.has(entry.discipline.toLowerCase().trim()) : true,
            })),
          ),
        },
      },
      include: { syllabus: { orderBy: { order: 'asc' } } },
    });
  }

  async getTopicContent(userId: string, itemId: string) {
    const item = await prisma.contestSyllabusItem.findUnique({
      where: { id: itemId },
      include: { contest: { select: { userId: true, examBoard: true, focus: true } } },
    });

    if (!item || item.contest.userId !== userId) {
      throw new AppError(404, 'SYLLABUS_ITEM_NOT_FOUND', 'Item do conteúdo programático não encontrado');
    }

    if (item.content) {
      return { id: item.id, content: item.content };
    }

    const content = await this.aiProvider.generateTopicContent({
      discipline: item.discipline,
      topic: item.topic,
      examBoard: item.contest.examBoard,
      focus: item.contest.focus,
    });

    await prisma.contestSyllabusItem.update({
      where: { id: itemId },
      data: { content },
    });

    return { id: item.id, content };
  }

  async listByUser(userId: string) {
    const contests = await prisma.contest.findMany({
      where: { userId, status: { not: 'ARCHIVED' } },
      orderBy: [{ examDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { syllabus: true } },
        syllabus: { where: { studied: true }, select: { id: true } },
      },
    });

    return contests.map(({ syllabus, _count, ...contest }) => ({
      ...contest,
      totalTopics: _count.syllabus,
      studiedTopics: syllabus.length,
    }));
  }

  async getById(userId: string, contestId: string) {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        syllabus: {
          orderBy: { order: 'asc' },
          include: { reviews: { orderBy: { index: 'asc' } } },
        },
      },
    });

    if (!contest || contest.userId !== userId) {
      throw new AppError(404, 'CONTEST_NOT_FOUND', 'Concurso não encontrado');
    }

    return { ...contest, disciplines: this.buildDisciplineStats(contest.syllabus) };
  }

  private buildDisciplineStats(
    syllabus: { discipline: string; studied: boolean; focus: boolean; importance: number; reviews: { completedAt: Date | null; scheduledFor: Date }[] }[],
  ) {
    const dueCutoff = addDays(startOfDay(new Date()), 1);
    const groups = new Map<string, typeof syllabus>();
    for (const item of syllabus) {
      const list = groups.get(item.discipline) ?? [];
      list.push(item);
      groups.set(item.discipline, list);
    }

    return Array.from(groups.entries())
      .map(([discipline, items]) => {
        const studied = items.filter((i) => i.studied).length;
        const dueReviews = items.reduce(
          (acc, i) => acc + i.reviews.filter((r) => !r.completedAt && r.scheduledFor < dueCutoff).length,
          0,
        );
        const importance = items[0]?.importance ?? 5;
        return {
          discipline,
          inFocus: items.some((i) => i.focus),
          total: items.length,
          studied,
          dueReviews,
          importance,
          priority: computeDisciplinePriority({ importance, totalTopics: items.length, studiedTopics: studied, dueReviews }),
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }

  async setImportance(userId: string, contestId: string, discipline: string, importance: number) {
    await this.getById(userId, contestId);
    await prisma.contestSyllabusItem.updateMany({
      where: { contestId, discipline },
      data: { importance },
    });
    return this.getById(userId, contestId);
  }

  async update(userId: string, contestId: string, dto: UpdateContestDTO) {
    await this.getById(userId, contestId);

    return prisma.contest.update({
      where: { id: contestId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.organization !== undefined ? { organization: dto.organization } : {}),
        ...(dto.examBoard !== undefined ? { examBoard: dto.examBoard } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.examDate !== undefined
          ? { examDate: dto.examDate ? new Date(dto.examDate) : null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: { syllabus: { orderBy: { order: 'asc' } } },
    });
  }

  async delete(userId: string, contestId: string) {
    await this.getById(userId, contestId);
    await prisma.contest.delete({ where: { id: contestId } });
  }

  async updateSyllabusItem(userId: string, itemId: string, studied: boolean) {
    const item = await prisma.contestSyllabusItem.findUnique({
      where: { id: itemId },
      include: { contest: { select: { userId: true } }, reviews: { select: { id: true } } },
    });

    if (!item || item.contest.userId !== userId) {
      throw new AppError(404, 'SYLLABUS_ITEM_NOT_FOUND', 'Item do conteúdo programático não encontrado');
    }

    if (studied && item.reviews.length === 0) {
      const schedule = buildReviewSchedule(new Date());
      await prisma.topicReview.createMany({
        data: schedule.map((r) => ({ ...r, userId, syllabusItemId: itemId })),
      });
    }

    if (!studied) {
      await prisma.topicReview.deleteMany({ where: { syllabusItemId: itemId } });
    }

    return prisma.contestSyllabusItem.update({
      where: { id: itemId },
      data: { studied, firstStudiedAt: studied ? (item.firstStudiedAt ?? new Date()) : null },
      include: { reviews: { orderBy: { index: 'asc' } } },
    });
  }
}
