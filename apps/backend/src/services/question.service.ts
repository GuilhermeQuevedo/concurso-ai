import type { IAIProvider, GeneratedQuestion } from '../interfaces/ai.interfaces.js';
import type { GenerateQuestionsDTO } from '../validators/question.validators.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { DocumentService } from './document.service.js';
import { htmlToPlainText } from '../utils/html.js';

export class QuestionService {
  private readonly documentService = new DocumentService();

  constructor(private readonly aiProvider: IAIProvider) {}

  async generate(userId: string, dto: GenerateQuestionsDTO) {
    const subject = await prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Disciplina não encontrada');
    }

    // Com documento escolhido, gera ancorado nas anotações do aluno (pula o banco)
    if (dto.documentId) {
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
    if (dto.documentId) {
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
    });

    const kept = await this.auditQuestions(generated, subjectName);

    const saved = await prisma.$transaction(
      kept.map((q) =>
        prisma.question.create({
          data: {
            statement: htmlToPlainText(q.statement),
            alternatives: q.alternatives.map((a) => ({ letter: a.letter, text: htmlToPlainText(a.text) })),
            correctAnswer: q.correctAnswer,
            explanation: htmlToPlainText(q.explanation),
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

  // Auditoria: um segundo "resolvedor" responde cada questão às cegas e
  // descartamos as que não batem com o gabarito. Se a auditoria falhar ou
  // reprovar demais (possível modelo instável), mantém todas por segurança.
  private async auditQuestions(generated: GeneratedQuestion[], subjectName: string): Promise<GeneratedQuestion[]> {
    if (generated.length === 0) return generated;
    try {
      const answers = await this.aiProvider.answerQuestions({
        subject: subjectName,
        questions: generated.map((q) => ({ statement: q.statement, alternatives: q.alternatives })),
      });
      if (answers.length !== generated.length) return generated;

      const agreed = generated.filter((q, i) => answers[i] && answers[i] === q.correctAnswer.trim().toUpperCase());
      return agreed.length >= Math.ceil(generated.length / 2) ? agreed : generated;
    } catch {
      return generated;
    }
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
