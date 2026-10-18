import type { IAIProvider, QuestionType } from '../interfaces/ai.interfaces.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { ESSAY_ANSWER, QuestionService } from './question.service.js';

const FALLBACK_SUBJECT = 'Geral';

interface GenerateSetInput {
  name?: string;
  subjectId?: string;
  quantity: number;
  examBoardId?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: string;
  documentId?: string;
  content?: string;
  questionType?: QuestionType;
  cloneStyle?: boolean;
  mode?: string;
}

interface ManualQuestion {
  statement: string;
  alternatives: { letter: string; text: string }[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

interface CreateManualInput {
  name: string;
  subjectId?: string;
  mode?: string;
  questionType?: QuestionType;
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
        subject: { select: { id: true, name: true } },
        items: { select: { questionId: true } },
      },
    });

    return Promise.all(
      sets.map(async (s) => {
        const qIds = s.items.map((i) => i.questionId);
        const answered = qIds.length ? await this.countAnswered(userId, qIds) : 0;
        return {
          id: s.id,
          name: s.name,
          mode: s.mode,
          questionType: s.questionType,
          subject: s.subject,
          createdAt: s.createdAt,
          lastAttemptAt: s.lastAttemptAt,
          total: qIds.length,
          answered,
        };
      }),
    );
  }

  async generate(userId: string, dto: GenerateSetInput) {
    const subject = await this.resolveSubject(dto.subjectId);
    const questions = await this.questionService.generate(userId, {
      subjectId: subject.id,
      quantity: dto.quantity,
      examBoardId: dto.examBoardId,
      difficulty: dto.difficulty,
      topic: dto.topic,
      documentId: dto.documentId,
      content: dto.content,
      questionType: dto.questionType,
      cloneStyle: dto.cloneStyle,
    });
    if (questions.length === 0) {
      throw new AppError(400, 'NO_QUESTIONS', 'Não foi possível gerar questões para esta configuração.');
    }

    return prisma.questionSet.create({
      data: {
        userId,
        name: dto.name?.trim() || this.defaultName(subject.name),
        subjectId: subject.id,
        mode: dto.mode ?? 'STUDY',
        questionType: dto.questionType ?? 'MULTIPLE_5',
        items: { create: questions.map((q, i) => ({ questionId: q.id, order: i })) },
      },
      select: { id: true, name: true },
    });
  }

  async createManual(userId: string, dto: CreateManualInput) {
    const subject = await this.resolveSubject(dto.subjectId);

    const created = await prisma.$transaction(
      dto.questions.map((q) =>
        prisma.question.create({
          data: {
            statement: q.statement,
            alternatives: q.alternatives,
            correctAnswer: q.alternatives.length === 0 ? ESSAY_ANSWER : (q.correctAnswer ?? ''),
            explanation: q.explanation ?? '',
            difficulty: q.difficulty,
            comments: [],
            subjectId: subject.id,
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
        subjectId: subject.id,
        mode: dto.mode ?? 'STUDY',
        questionType: dto.questionType ?? 'MULTIPLE_5',
        items: { create: created.map((c, i) => ({ questionId: c.id, order: i })) },
      },
      select: { id: true, name: true },
    });
  }

  async rename(userId: string, id: string, name: string) {
    await this.ownedSet(userId, id);
    return prisma.questionSet.update({ where: { id }, data: { name: name.trim() }, select: { id: true, name: true } });
  }

  async getById(userId: string, id: string) {
    await this.ownedSet(userId, id);
    const set = await prisma.questionSet.update({
      where: { id },
      data: { lastAttemptAt: new Date() },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: { question: { include: { subject: true, examBoard: true } } },
        },
      },
    });

    return {
      id: set.id,
      name: set.name,
      mode: set.mode,
      questions: set.items.map((i) => i.question),
    };
  }

  async delete(userId: string, id: string) {
    await this.ownedSet(userId, id);
    await prisma.questionSet.delete({ where: { id } });
  }

  private async ownedSet(userId: string, id: string) {
    const set = await prisma.questionSet.findUnique({ where: { id }, select: { userId: true } });
    if (!set || set.userId !== userId) {
      throw new AppError(404, 'SET_NOT_FOUND', 'Simulado não encontrado');
    }
  }

  private async countAnswered(userId: string, questionIds: string[]): Promise<number> {
    const distinct = await prisma.questionAttempt.findMany({
      where: { userId, questionId: { in: questionIds } },
      distinct: ['questionId'],
      select: { questionId: true },
    });
    return distinct.length;
  }

  // Matéria é opcional: sem ela, usa (ou cria) uma matéria "Geral"
  private async resolveSubject(subjectId?: string) {
    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Disciplina não encontrada');
      return subject;
    }
    const existing = await prisma.subject.findFirst({ where: { name: FALLBACK_SUBJECT, parentId: null } });
    return existing ?? prisma.subject.create({ data: { name: FALLBACK_SUBJECT } });
  }

  private defaultName(subjectName: string): string {
    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${subjectName} - ${date}`;
  }
}
