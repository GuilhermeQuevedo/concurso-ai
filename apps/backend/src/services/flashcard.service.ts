import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { parseFlashcardText } from '../utils/flashcard-parser.js';
import { shuffle } from '../utils/shuffle.js';

interface CreateFlashcardDTO {
  subjectId: string;
  front: string;
  back: string;
}

interface ReviewDTO {
  quality: number; // 0-5 SM-2 scale
}

interface GenerateFlashcardsDTO {
  subjectId: string;
  count: number;
  text?: string;
  documentId?: string;
}

interface ImportFlashcardsDTO {
  subjectId: string;
  text: string;
}

const MAX_GENERATED_CARDS = 30;

export class FlashcardService {
  constructor(private readonly aiProvider: IAIProvider) {}

  async create(userId: string, dto: CreateFlashcardDTO) {
    return prisma.flashcard.create({
      data: { userId, subjectId: dto.subjectId, front: dto.front, back: dto.back },
    });
  }

  async generateFromContent(userId: string, dto: GenerateFlashcardsDTO) {
    const subject = await prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Disciplina não encontrada');
    }

    let content = dto.text?.trim() ?? '';
    let source: string | null = null;
    if (!content && dto.documentId) {
      const doc = await prisma.document.findUnique({ where: { id: dto.documentId } });
      if (!doc || doc.userId !== userId) {
        throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
      }
      content = doc.content;
      source = doc.name;
    }

    if (content.length < 50) {
      throw new AppError(400, 'CONTENT_TOO_SHORT', 'Envie um texto ou documento com conteúdo suficiente para gerar flashcards.');
    }

    const count = Math.min(Math.max(dto.count, 1), MAX_GENERATED_CARDS);
    const generated = await this.aiProvider.generateFlashcards({
      content,
      subject: subject.name,
      count,
    });

    return prisma.$transaction(
      generated.map((card) =>
        prisma.flashcard.create({
          data: { userId, subjectId: dto.subjectId, front: card.front, back: card.back, source },
        }),
      ),
    );
  }

  async importCards(userId: string, dto: ImportFlashcardsDTO) {
    const subject = await prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Disciplina não encontrada');
    }

    const { cards, skipped } = parseFlashcardText(dto.text ?? '');
    if (cards.length === 0) {
      throw new AppError(
        400,
        'NO_CARDS_FOUND',
        'Nenhum flashcard reconhecido. Use um arquivo com "frente" e "verso" separados por tab, ponto e vírgula ou vírgula (uma linha por cartão).',
      );
    }

    await prisma.flashcard.createMany({
      data: cards.map((card) => ({
        userId,
        subjectId: dto.subjectId,
        front: card.front,
        back: card.back,
      })),
    });

    return { imported: cards.length, skipped };
  }

  async getDueCards(userId: string, subjectId?: string) {
    const cards = await prisma.flashcard.findMany({
      where: {
        userId,
        nextReview: { lte: new Date() },
        ...(subjectId ? { subjectId } : {}),
      },
      orderBy: { nextReview: 'asc' },
      take: 20,
      include: { subject: true },
    });
    return shuffle(cards);
  }

  async saveElaboration(userId: string, cardId: string, elaboration: string) {
    const card = await prisma.flashcard.findUnique({ where: { id: cardId } });
    if (!card || card.userId !== userId) {
      throw new AppError(404, 'CARD_NOT_FOUND', 'Flashcard não encontrado');
    }
    return prisma.flashcard.update({
      where: { id: cardId },
      data: { elaboration: elaboration.trim() || null },
    });
  }

  async review(userId: string, cardId: string, dto: ReviewDTO) {
    const card = await prisma.flashcard.findUnique({
      where: { id: cardId },
      include: { deck: true },
    });
    if (!card || card.userId !== userId) {
      throw new AppError(404, 'CARD_NOT_FOUND', 'Flashcard não encontrado');
    }

    const { interval, easeFactor, repetition } = this.sm2(
      dto.quality,
      card.repetition,
      card.easeFactor,
      card.interval,
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const updatedCard = await prisma.flashcard.update({
      where: { id: cardId },
      data: { interval, easeFactor, repetition, nextReview },
    });

    if (dto.quality < 4) {
      await this.recordFlashcardError(userId, card, dto.quality);
    } else {
      await this.resolveFlashcardErrorIfAny(userId, card);
    }

    return updatedCard;
  }

  private async recordFlashcardError(
    userId: string,
    card: {
      id: string;
      front: string;
      back: string;
      elaboration: string | null;
      subjectId: string;
      deck?: { name: string } | null;
    },
    quality: number,
  ): Promise<void> {
    const deckName = card.deck?.name ?? 'Flashcards';
    const qualityLabel = quality === 0 ? 'Errei no Flashcard' : 'Em dúvida no Flashcard';

    let question = await prisma.question.findFirst({
      where: {
        statement: card.front,
        subjectId: card.subjectId,
      },
    });

    if (!question) {
      question = await prisma.question.create({
        data: {
          statement: card.front,
          alternatives: [],
          correctAnswer: card.back,
          difficulty: 'MEDIUM',
          explanation: card.elaboration || card.back,
          comments: [
            {
              originType: 'FLASHCARD',
              originTitle: `Deck: ${deckName}`,
              flashcardId: card.id,
            },
          ],
          subjectId: card.subjectId,
          source: 'MANUAL',
        },
      });
    }

    await prisma.questionAttempt.create({
      data: {
        userId,
        questionId: question.id,
        answer: qualityLabel,
        isCorrect: false,
        timeSpent: 0,
      },
    });
  }

  private async resolveFlashcardErrorIfAny(
    userId: string,
    card: { front: string; subjectId: string },
  ): Promise<void> {
    const question = await prisma.question.findFirst({
      where: {
        statement: card.front,
        subjectId: card.subjectId,
      },
    });

    if (question) {
      await prisma.questionAttempt.create({
        data: {
          userId,
          questionId: question.id,
          answer: 'Acertei no Flashcard',
          isCorrect: true,
          timeSpent: 0,
        },
      });
    }
  }

  async list(userId: string, subjectId?: string) {
    return prisma.flashcard.findMany({
      where: { userId, ...(subjectId ? { subjectId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { subject: true },
    });
  }

  async delete(userId: string, cardId: string) {
    const card = await prisma.flashcard.findUnique({ where: { id: cardId } });
    if (!card || card.userId !== userId) {
      throw new AppError(404, 'CARD_NOT_FOUND', 'Flashcard não encontrado');
    }
    await prisma.flashcard.delete({ where: { id: cardId } });
  }

  async getStats(userId: string) {
    const [total, due] = await Promise.all([
      prisma.flashcard.count({ where: { userId } }),
      prisma.flashcard.count({ where: { userId, nextReview: { lte: new Date() } } }),
    ]);
    return { total, due };
  }

  private sm2(
    quality: number,
    repetition: number,
    easeFactor: number,
    interval: number,
  ): { interval: number; easeFactor: number; repetition: number } {
    const q = Math.max(0, Math.min(5, quality));

    if (q < 3) {
      return { interval: 1, easeFactor, repetition: 0 };
    }

    let newInterval: number;
    if (repetition === 0) {
      newInterval = 1;
    } else if (repetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }

    const newEF = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
    );

    return { interval: newInterval, easeFactor: newEF, repetition: repetition + 1 };
  }
}
