import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { startOfDay, addDays } from '../utils/spaced-repetition.js';

export class ContestReviewService {
  async complete(userId: string, reviewId: string, completed: boolean) {
    const review = await prisma.topicReview.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true },
    });

    if (!review || review.userId !== userId) {
      throw new AppError(404, 'REVIEW_NOT_FOUND', 'Revisão não encontrada');
    }

    return prisma.topicReview.update({
      where: { id: reviewId },
      data: { completedAt: completed ? new Date() : null },
    });
  }

  async listDue(userId: string) {
    const dueCutoff = addDays(startOfDay(new Date()), 1);
    const reviews = await prisma.topicReview.findMany({
      where: { userId, completedAt: null, scheduledFor: { lt: dueCutoff } },
      orderBy: { scheduledFor: 'asc' },
      include: {
        syllabusItem: {
          select: { id: true, topic: true, discipline: true, contest: { select: { id: true, name: true } } },
        },
      },
    });

    const today = startOfDay(new Date());
    return reviews.map((r) => ({
      id: r.id,
      index: r.index,
      intervalDays: r.intervalDays,
      scheduledFor: r.scheduledFor,
      overdue: startOfDay(r.scheduledFor) < today,
      syllabusItemId: r.syllabusItem.id,
      topic: r.syllabusItem.topic,
      discipline: r.syllabusItem.discipline,
      contestId: r.syllabusItem.contest.id,
      contestName: r.syllabusItem.contest.name,
    }));
  }
}
