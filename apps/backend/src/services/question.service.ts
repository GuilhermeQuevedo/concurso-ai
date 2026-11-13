import type { IAIProvider, GeneratedQuestion } from '../interfaces/ai.interfaces.js';
import type { GenerateQuestionsDTO, SliceExamDTO } from '../validators/question.validators.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { DocumentService } from './document.service.js';
import { htmlToPlainText } from '../utils/html.js';
import { getSmartChunks } from '../providers/ai-prompts.js';

export const ESSAY_ANSWER = 'S';
const MIN_AUDIT_ALTERNATIVES = 2;

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
    let examBoardName: string | undefined = dto.examBoardName?.trim();
    let resolvedBoardId: string | undefined = dto.examBoardId;

    if (resolvedBoardId) {
      const board = await prisma.examBoard.findUnique({ where: { id: resolvedBoardId } });
      if (!board) {
        throw new AppError(404, 'EXAM_BOARD_NOT_FOUND', 'Banca não encontrada');
      }
      examBoardName = board.name;
    } else if (examBoardName) {
      const board = await prisma.examBoard.findFirst({
        where: {
          OR: [
            { name: { contains: examBoardName } },
            { slug: examBoardName.toLowerCase().replace(/[^a-z0-9]/g, '') },
          ],
        },
      });
      if (board) {
        resolvedBoardId = board.id;
        examBoardName = board.name;
      }
    }

    // Padrão Zion: se a banca for CESPE/CEBRASPE/QUADRIX e não foi especificado tipo de questão, auto-seleciona Certo ou Errado
    let effectiveQuestionType = dto.questionType;
    if (!effectiveQuestionType && examBoardName) {
      const upperBoard = examBoardName.toUpperCase();
      if (upperBoard.includes('CESPE') || upperBoard.includes('CEBRASPE') || upperBoard.includes('QUADRIX')) {
        effectiveQuestionType = 'TRUE_FALSE';
      }
    }

    let context: string;
    if (dto.content?.trim()) {
      context = dto.content.trim();
    } else if (dto.documentId) {
      const doc = await prisma.document.findUnique({ where: { id: dto.documentId } });
      if (!doc || doc.userId !== userId) {
        throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
      }
      context = doc.content;
    } else {
      context = await this.documentService.getContentBySubject(userId, dto.subjectId);
    }

    // Chunking inteligente (Padrão Zion): materiais extensos divididos em blocos sem truncamento
    let generated: GeneratedQuestion[];
    if (context && context.length > 25000 && dto.quantity >= 5) {
      const numChunks = dto.quantity <= 5 ? 1 : Math.min(4, Math.ceil(dto.quantity / 5));
      const chunks = getSmartChunks(context, numChunks, 35000);
      const targetPerChunk = Math.ceil(dto.quantity / chunks.length);

      const chunkResults = await Promise.all(
        chunks.map(async (chunk, index) => {
          return this.aiProvider.generateQuestions({
            subject: subjectName,
            topic: dto.topic,
            examBoard: examBoardName,
            difficulty: dto.difficulty,
            quantity: targetPerChunk,
            context: `[Parte ${index + 1} de ${chunks.length} do Material Fonte]\n${chunk}`,
            questionType: effectiveQuestionType,
            cloneStyle: dto.cloneStyle,
          });
        }),
      );
      generated = chunkResults.flat().slice(0, dto.quantity);
    } else {
      generated = await this.aiProvider.generateQuestions({
        subject: subjectName,
        topic: dto.topic,
        examBoard: examBoardName,
        difficulty: dto.difficulty,
        quantity: dto.quantity,
        context: context ? context.slice(0, 40000) : undefined,
        questionType: effectiveQuestionType,
        cloneStyle: dto.cloneStyle,
      });
    }

    // Embaralhamento das alternativas e remapeamento de gabarito para balanceamento (Padrão Zion)
    const balancedQuestions = this.balanceQuestionAlternatives(generated);
    const kept = await this.auditQuestions(balancedQuestions, subjectName);

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
            examBoardId: resolvedBoardId,
            source: 'AI_GENERATED',
          },
          include: { subject: true, examBoard: true },
        }),
      ),
    );
  }

  private balanceQuestionAlternatives(questions: GeneratedQuestion[]): GeneratedQuestion[] {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    return questions.map((q) => {
      if (!q.alternatives || q.alternatives.length < 2) return q;

      // Mantém Certo/Errado imutável
      const isTrueFalse =
        q.alternatives.length === 2 &&
        q.alternatives.some((a) => a.letter === 'C' || a.text.toLowerCase().includes('certo'));
      if (isTrueFalse) return q;

      const altsWithStatus = q.alternatives.map((a) => ({
        text: a.text,
        isCorrect: a.letter.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase(),
      }));

      const hasCorrect = altsWithStatus.some((a) => a.isCorrect);
      if (!hasCorrect) return q;

      const shuffled = [...altsWithStatus].sort(() => Math.random() - 0.5);
      const newAlternatives = shuffled.map((item, idx) => ({
        letter: letters[idx] ?? String.fromCharCode(65 + idx),
        text: item.text,
      }));
      const newCorrectIndex = shuffled.findIndex((item) => item.isCorrect);
      const newCorrectLetter = letters[newCorrectIndex] ?? 'A';

      return {
        ...q,
        alternatives: newAlternatives,
        correctAnswer: newCorrectLetter,
      };
    });
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
      subjectName: dto.subjectName,
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
