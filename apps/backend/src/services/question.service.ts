import type { IAIProvider, GeneratedQuestion } from '../interfaces/ai.interfaces.js';
import type { GenerateQuestionsDTO } from '../validators/question.validators.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { DocumentService } from './document.service.js';
import { htmlToPlainText } from '../utils/html.js';

export const ESSAY_ANSWER = 'S';
const MIN_AUDIT_ALTERNATIVES = 2;

export interface SliceExamDTO {
  examContent: string;
  answerKeyContent?: string;
  quantity?: number;
  subjectId?: string;
  subjectName?: string;
  examBoardId?: string;
}

export class QuestionService {
  private readonly documentService = new DocumentService();

  constructor(private readonly aiProvider: IAIProvider) {}

  async generate(userId: string, dto: GenerateQuestionsDTO) {
    const subject = await prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Disciplina não encontrada');
    }

    // Com documento escolhido, gera ancorado nas anotações do aluno (pula o banco)
    if (dto.documentId || dto.content) {
      return this.generateWithAI(userId, dto, subject.name);
    }

    const imported = await this.findImportedQuestions(dto);
    if (imported.length > 0) {
      return imported;
    }

    return this.generateWithAI(userId, dto, subject.name);
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

  private async generateWithAI(userId: string, dto: GenerateQuestionsDTO, subjectName: string) {
    let examBoardName: string | undefined;
    if (dto.examBoardId) {
      const board = await prisma.examBoard.findUnique({ where: { id: dto.examBoardId } });
      if (!board) {
        throw new AppError(404, 'EXAM_BOARD_NOT_FOUND', 'Banca não encontrada');
      }
      examBoardName = board.name;
    }

    let context: string;
    if (dto.content?.trim()) {
      context = dto.content;
    } else if (dto.documentId) {
      const doc = await prisma.document.findUnique({ where: { id: dto.documentId } });
      if (!doc || doc.userId !== userId) {
        throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
      }
      context = doc.content;
    } else {
      context = await this.documentService.getContentBySubject(dto.subjectId);
    }

    const generated = await this.aiProvider.generateQuestions({
      subject: subjectName,
      topic: dto.topic,
      examBoard: examBoardName,
      difficulty: dto.difficulty,
      quantity: dto.quantity,
      context: context || undefined,
      questionType: dto.questionType,
      cloneStyle: dto.cloneStyle,
    });

    const kept = await this.auditQuestions(generated, subjectName);

    return prisma.$transaction(
      kept.map((q) =>
        prisma.question.create({
          data: {
            statement: q.statement,
            alternatives: q.alternatives,
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
            explanation: q.explanation,
            comments: [],
            subjectId: dto.subjectId,
            examBoardId: dto.examBoardId,
            source: 'AI_GENERATED',
          },
          include: { subject: true, examBoard: true },
        }),
      ),
    );
  }

  private async auditQuestions(
    generated: GeneratedQuestion[],
    subjectName: string,
  ): Promise<GeneratedQuestion[]> {
    const objective = generated
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => q.alternatives.length >= MIN_AUDIT_ALTERNATIVES);
    if (objective.length === 0) return generated;

    const answers = await this.aiProvider.answerQuestions({
      questions: objective.map(({ q }) => ({ statement: q.statement, alternatives: q.alternatives })),
      subject: subjectName,
    });

    const discardedIndexes = new Set<number>();
    objective.forEach(({ q, idx }, i) => {
      const solverAns = answers[i]?.trim().toUpperCase();
      const expectedAns = q.correctAnswer.trim().toUpperCase();
      if (solverAns && solverAns !== expectedAns) {
        discardedIndexes.add(idx);
      }
    });

    if (discardedIndexes.size > 0) {
      console.warn(`Auditoria da IA descartou ${discardedIndexes.size} questão(ões) inconsistente(s).`);
    }

    const kept = generated.filter((_, idx) => !discardedIndexes.has(idx));
    return kept.length > 0 ? kept : generated;
  }

  async importFromContent(subjectId: string, content: string, subjectName?: string) {
    const plain = htmlToPlainText(content).trim();
    if (plain.length < 50) {
      throw new AppError(400, 'CONTENT_TOO_SHORT', 'Conteúdo muito curto para extrair questões');
    }

    const extracted = await this.aiProvider.extractQuestions({
      content: plain,
      subject: subjectName,
    });

    if (extracted.length === 0) {
      throw new AppError(422, 'NO_QUESTIONS_FOUND', 'Nenhuma questão identificada no conteúdo');
    }

    return prisma.$transaction(
      extracted.map((q) =>
        prisma.question.create({
          data: {
            statement: q.statement,
            alternatives: q.alternatives,
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
            explanation: q.explanation,
            comments: [],
            subjectId,
            source: 'IMPORTED',
            aiModel: null,
          },
        }),
      ),
    );
  }

  async sliceExam(_userId: string, dto: SliceExamDTO) {
    if (!this.aiProvider.sliceExam) {
      throw new AppError(500, 'AI_PROVIDER_ERROR', 'Provedor de IA não suporta fatiamento de prova.');
    }

    const sliced = await this.aiProvider.sliceExam({
      examContent: dto.examContent,
      answerKeyContent: dto.answerKeyContent,
      quantity: dto.quantity ?? 10,
    });

    let subjectId = dto.subjectId;
    if (!subjectId) {
      const subjectName = dto.subjectName?.trim() || 'Provas Comentadas';
      const existing = await prisma.subject.findFirst({ where: { name: subjectName } });
      const subject = existing ?? (await prisma.subject.create({ data: { name: subjectName } }));
      subjectId = subject.id;
    }

    return prisma.$transaction(
      sliced.map((q) =>
        prisma.question.create({
          data: {
            statement: q.referenceText ? `${q.referenceText}\n\n${q.statement}` : q.statement,
            alternatives: q.alternatives,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: 'MEDIUM',
            comments: [],
            subjectId,
            examBoardId: dto.examBoardId,
            source: 'IMPORTED',
          },
          include: { subject: true, examBoard: true },
        }),
      ),
    );
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
