import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { FlashcardService } from './flashcard.service.js';
import { QuestionService } from './question.service.js';
import type { GenerateStudyKitDTO } from '../validators/study-kit.validators.js';

interface StudyKitResult {
  summary: string | null;
  summaryDocumentId: string | null;
  flashcards: number;
  questions: number;
}

export class StudyKitService {
  private readonly flashcardService: FlashcardService;
  private readonly questionService: QuestionService;

  constructor(private readonly aiProvider: IAIProvider) {
    this.flashcardService = new FlashcardService(aiProvider);
    this.questionService = new QuestionService(aiProvider);
  }

  async generate(userId: string, dto: GenerateStudyKitDTO): Promise<StudyKitResult> {
    const document = await prisma.document.findUnique({ where: { id: dto.documentId } });
    if (!document || document.userId !== userId) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
    }
    if (document.content.trim().length < 50) {
      throw new AppError(400, 'CONTENT_TOO_SHORT', 'O documento não tem conteúdo suficiente para gerar material.');
    }

    const subject = await prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Disciplina não encontrada');
    }

    const result: StudyKitResult = { summary: null, summaryDocumentId: null, flashcards: 0, questions: 0 };

    if (dto.outputs.includes('summary')) {
      const summary = await this.aiProvider.generateSummary({ content: document.content, subject: subject.name });
      const saved = await prisma.document.create({
        data: {
          userId,
          name: `Resumo — ${document.name}`,
          type: 'MARKDOWN',
          content: summary,
          subjectId: dto.subjectId,
        },
        select: { id: true },
      });
      result.summary = summary;
      result.summaryDocumentId = saved.id;
    }

    if (dto.outputs.includes('flashcards')) {
      const cards = await this.flashcardService.generateFromContent(userId, {
        subjectId: dto.subjectId,
        count: dto.flashcardsCount ?? 10,
        documentId: dto.documentId,
      });
      result.flashcards = cards.length;
    }

    if (dto.outputs.includes('questions')) {
      const questions = await this.questionService.generate(userId, {
        subjectId: dto.subjectId,
        quantity: dto.questionsCount ?? 5,
        documentId: dto.documentId,
        examBoardId: dto.examBoardId,
        difficulty: dto.difficulty,
        topic: dto.topic,
      });
      result.questions = questions.length;
    }

    return result;
  }
}
