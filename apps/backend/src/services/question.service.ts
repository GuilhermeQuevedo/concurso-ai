import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import type { GenerateQuestionsDTO } from '../validators/question.validators.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';

export class QuestionService {
  constructor(private readonly aiProvider: IAIProvider) {}

  async generate(dto: GenerateQuestionsDTO) {
    const subject = await prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Disciplina não encontrada');
    }

    let examBoardName: string | undefined;
    if (dto.examBoardId) {
      const board = await prisma.examBoard.findUnique({ where: { id: dto.examBoardId } });
      if (!board) {
        throw new AppError(404, 'EXAM_BOARD_NOT_FOUND', 'Banca não encontrada');
      }
      examBoardName = board.name;
    }

    const generated = await this.aiProvider.generateQuestions({
      subject: subject.name,
      topic: dto.topic,
      examBoard: examBoardName,
      difficulty: dto.difficulty,
      quantity: dto.quantity,
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
