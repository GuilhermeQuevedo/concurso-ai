import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';

interface CreateFlashcardDTO {
  subjectId: string;
  front: string;
  back: string;
}

interface ReviewDTO {
  quality: number; // 0-5 SM-2 scale
}

export class FlashcardService {
  async create(userId: string, dto: CreateFlashcardDTO) {
    return prisma.flashcard.create({
      data: { userId, subjectId: dto.subjectId, front: dto.front, back: dto.back },
    });
  }

  async getDueCards(userId: string, subjectId?: string) {
    return prisma.flashcard.findMany({
      where: {
        userId,
        nextReview: { lte: new Date() },
        ...(subjectId ? { subjectId } : {}),
      },
      orderBy: { nextReview: 'asc' },
      take: 20,
      include: { subject: true },
    });
  }

  async review(userId: string, cardId: string, dto: ReviewDTO) {
    const card = await prisma.flashcard.findUnique({ where: { id: cardId } });
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

    return prisma.flashcard.update({
      where: { id: cardId },
      data: { interval, easeFactor, repetition, nextReview },
    });
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
