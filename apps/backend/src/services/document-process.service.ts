import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { ContestService } from './contest.service.js';
import { StudyKitService } from './study-kit.service.js';
import { QuestionService } from './question.service.js';

export type ProcessResult =
  | { pipeline: 'objetivo'; contestId: string; title: string }
  | { pipeline: 'kit'; subjectId: string; summary: boolean; flashcards: number; questions: number }
  | { pipeline: 'questoes'; subjectId: string; imported: number };

export class DocumentProcessService {
  private readonly contestService: ContestService;
  private readonly studyKitService: StudyKitService;
  private readonly questionService: QuestionService;

  constructor(aiProvider: IAIProvider) {
    this.contestService = new ContestService(aiProvider);
    this.studyKitService = new StudyKitService(aiProvider);
    this.questionService = new QuestionService(aiProvider);
  }

  async process(userId: string, documentId: string): Promise<ProcessResult> {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document || document.userId !== userId) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
    }

    switch (document.kind) {
      case 'EDITAL':
      case 'EMENTA':
      case 'CRONOGRAMA': {
        const contest = await this.contestService.createFromContent(userId, documentId);
        return { pipeline: 'objetivo', contestId: contest.id, title: contest.name };
      }

      case 'LISTA_QUESTOES': {
        const subject = await this.ensureSubject(document.subjectId, document.name);
        const imported = await this.questionService.importFromContent(
          subject.id,
          document.content,
          subject.name,
        );
        return { pipeline: 'questoes', subjectId: subject.id, imported: imported.length };
      }

      case 'MATERIAL':
      case 'OUTRO':
      default: {
        const subject = await this.ensureSubject(document.subjectId, document.name);
        const result = await this.studyKitService.generate(userId, {
          documentId,
          subjectId: subject.id,
          outputs: ['summary', 'flashcards', 'questions'] as ('summary' | 'flashcards' | 'questions')[],
          flashcardsCount: 10,
          questionsCount: 5,
        });
        return {
          pipeline: 'kit',
          subjectId: subject.id,
          summary: Boolean(result.summary),
          flashcards: result.flashcards,
          questions: result.questions,
        };
      }
    }
  }

  private async ensureSubject(subjectId: string | null, documentName: string) {
    if (subjectId) {
      const existing = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (existing) return existing;
    }
    const name = documentName.replace(/\.[a-z0-9]+$/i, '').trim().slice(0, 80) || 'Material importado';
    return prisma.subject.create({ data: { name } });
  }
}
