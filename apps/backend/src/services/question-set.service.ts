import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { QuestionService } from './question.service.js';

interface GenerateSetInput {
  name?: string;
  subjectId: string;
  quantity: number;
  examBoardId?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: string;
  documentId?: string;
  mode?: string;
}

interface ManualQuestion {
  statement: string;
  alternatives: { letter: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

interface CreateManualInput {
  name: string;
  subjectId: string;
  mode?: string;
  questions: ManualQuestion[];
}

export class QuestionSetService {
  private readonly questionService: QuestionService;

  constructor(aiProvider: IAIProvider) {
    this.questionService = new QuestionService(aiProvider);
  }

  async list(userId: string) {
    const sets = await prisma.questionSet.findMany({
      where: { userId },
      orderBy: [{ lastAttemptAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        subject: { select: { name: true } },
        items: { select: { questionId: true } },
      },
    });

    const result = [];
    for (const s of sets) {
      const qIds = s.items.map((i) => i.questionId);
      let answered = 0;
      if (qIds.length > 0) {
        const distinct = await prisma.questionAttempt.findMany({
          where: { userId, questionId: { in: qIds } },
          distinct: ['questionId'],
          select: { questionId: true },
        });
        answered = distinct.length;
      }
      result.push({
        id: s.id,
        name: s.name,
        mode: s.mode,
        subject: s.subject,
        createdAt: s.createdAt,
        lastAttemptAt: s.lastAttemptAt,
        total: qIds.length,
        answered,
      });
    }
    return result;
  }

  async generate(userId: string, dto: GenerateSetInput) {
    const questions = await this.questionService.generate(userId, {
      subjectId: dto.subjectId,
      quantity: dto.quantity,
      examBoardId: dto.examBoardId,
      difficulty: dto.difficulty,
      topic: dto.topic,
      documentId: dto.documentId,
    });
    if (questions.length === 0) {
      throw new AppError(400, 'NO_QUESTIONS', 'Não foi possível gerar questões para esta configuração.');
    }

    const subject = await prisma.subject.findUnique({
      where: { id: dto.subjectId },
      select: { name: true },
    });

    return prisma.questionSet.create({
      data: {
        userId,
        name: dto.name?.trim() || this.defaultName(subject?.name),
        subjectId: dto.subjectId,
        mode: dto.mode ?? 'STUDY',
        items: { create: questions.map((q, i) => ({ questionId: q.id, order: i })) },
      },
      select: { id: true, name: true },
    });
  }

  async createManual(userId: string, dto: CreateManualInput) {
    const subject = await prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Disciplina não encontrada');
    }

    const created = await prisma.$transaction(
      dto.questions.map((q) =>
        prisma.question.create({
          data: {
            statement: q.statement,
            alternatives: q.alternatives,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? '',
            difficulty: q.difficulty,
            comments: [],
            subjectId: dto.subjectId,
            source: 'MANUAL',
          },
          select: { id: true },
        }),
      ),
    );

    return prisma.questionSet.create({
      data: {
        userId,
        name: dto.name.trim(),
        subjectId: dto.subjectId,
        mode: dto.mode ?? 'STUDY',
        items: { create: created.map((c, i) => ({ questionId: c.id, order: i })) },
      },
      select: { id: true, name: true },
    });
  }

  async getById(userId: string, id: string) {
    const set = await prisma.questionSet.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: { question: { include: { subject: true, examBoard: true } } },
        },
      },
    });
    if (!set || set.userId !== userId) {
      throw new AppError(404, 'SET_NOT_FOUND', 'Simulado não encontrado');
    }

    await prisma.questionSet.update({ where: { id }, data: { lastAttemptAt: new Date() } });

    return {
      id: set.id,
      name: set.name,
      mode: set.mode,
      questions: set.items.map((i) => i.question),
    };
  }

  async delete(userId: string, id: string) {
    const set = await prisma.questionSet.findUnique({ where: { id }, select: { userId: true } });
    if (!set || set.userId !== userId) {
      throw new AppError(404, 'SET_NOT_FOUND', 'Simulado não encontrado');
    }
    await prisma.questionSet.delete({ where: { id } });
  }

  private defaultName(subjectName?: string | null): string {
    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${subjectName ?? 'Simulado'} - ${date}`;
  }
}
