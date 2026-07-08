import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import type { GenerateQuestionsDTO } from '../validators/question.validators.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { DocumentService } from './document.service.js';

export class QuestionService {
  private readonly documentService = new DocumentService();

  constructor(private readonly aiProvider: IAIProvider) {}

  async generate(dto: GenerateQuestionsDTO) {
    const subject = await prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Disciplina não encontrada');
    }

    const imported = await this.findImportedQuestions(dto);
    if (imported.length > 0) {
      return imported;
    }

    return this.generateWithAI(dto, subject.name);
  }

  private async findImportedQuestions(dto: GenerateQuestionsDTO) {
    const subjectIds = await this.getSubjectTreeIds(dto.subjectId);

    const where: Record<string, unknown> = {
      subjectId: { in: subjectIds },
      source: 'IMPORTED',
    };
    if (dto.examBoardId) where.examBoardId = dto.examBoardId;
    if (dto.difficulty) where.difficulty = dto.difficulty;

    const total = await prisma.question.count({ where });
    if (total === 0) return [];

    const skip = Math.max(0, Math.floor(Math.random() * (total - dto.quantity)));
    return prisma.question.findMany({
      where,
      skip,
      take: dto.quantity,
      include: { subject: true, examBoard: true },
    });
  }

  private async getSubjectTreeIds(subjectId: string): Promise<string[]> {
    const children = await prisma.subject.findMany({
      where: { parentId: subjectId },
      select: { id: true },
    });
    if (children.length === 0) return [subjectId];
    return [subjectId, ...children.map((c) => c.id)];
  }

  private async generateWithAI(dto: GenerateQuestionsDTO, subjectName: string) {
    let examBoardName: string | undefined;
    if (dto.examBoardId) {
      const board = await prisma.examBoard.findUnique({ where: { id: dto.examBoardId } });
      if (!board) {
        throw new AppError(404, 'EXAM_BOARD_NOT_FOUND', 'Banca não encontrada');
      }
      examBoardName = board.name;
    }

    const context = await this.documentService.getContentBySubject(dto.subjectId);

    const generated = await this.aiProvider.generateQuestions({
      subject: subjectName,
      topic: dto.topic,
      examBoard: examBoardName,
      difficulty: dto.difficulty,
      quantity: dto.quantity,
      context: context || undefined,
    });

    const saved = await prisma.$transaction(
      generated.map((q) =>
        prisma.question.create({
          data: {
            statement: q.statement,
            alternatives: q.alternatives,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            comments: [],
            subjectId: dto.subjectId,
            examBoardId: dto.examBoardId ?? null,
            source: 'AI_GENERATED',
            aiModel: 'gemini-2.0-flash',
          },
        }),
      ),
    );

    return saved;
  }

  async getBySubject(subjectId: string) {
    return prisma.question.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'desc' },
      include: { subject: true, examBoard: true },
    });
  }

  async getById(id: string) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { subject: true, examBoard: true },
    });
    if (!question) {
      throw new AppError(404, 'QUESTION_NOT_FOUND', 'Questão não encontrada');
    }
    return question;
  }
}
