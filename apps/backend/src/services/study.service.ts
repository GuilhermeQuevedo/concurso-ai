import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { GamificationService } from './gamification.service.js';

interface CreateSessionDTO {
  subjectId?: string;
  mode: 'STUDY' | 'EXAM';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  examBoardId?: string;
  questionIds: string[];
}

interface SubmitAnswerDTO {
  questionId: string;
  answer: string;
  timeSpent: number;
}

export class StudyService {
  private readonly gamification = new GamificationService();

  async createSession(userId: string, dto: CreateSessionDTO) {
    const session = await prisma.studySession.create({
      data: {
        userId,
        subjectId: dto.subjectId ?? null,
        mode: dto.mode,
        difficulty: dto.difficulty ?? null,
        examBoardId: dto.examBoardId ?? null,
        questionsCount: dto.questionIds.length,
        correctCount: 0,
        totalTime: 0,
      },
    });

    return { session, questionIds: dto.questionIds };
  }

  async submitAnswer(userId: string, sessionId: string, dto: SubmitAnswerDTO) {
    const session = await prisma.studySession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Sessão não encontrada');
    }

    const question = await prisma.question.findUnique({ where: { id: dto.questionId } });
    if (!question) {
      throw new AppError(404, 'QUESTION_NOT_FOUND', 'Questão não encontrada');
    }

    const isCorrect = dto.answer === question.correctAnswer;

    const attempt = await prisma.questionAttempt.create({
      data: {
        userId,
        questionId: dto.questionId,
        answer: dto.answer,
        isCorrect,
        timeSpent: dto.timeSpent,
      },
    });

    return { attempt, isCorrect, correctAnswer: question.correctAnswer, explanation: question.explanation };
  }

  async finishSession(userId: string, sessionId: string) {
    const session = await prisma.studySession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Sessão não encontrada');
    }

    const attempts = await prisma.questionAttempt.findMany({
      where: { userId, createdAt: { gte: session.createdAt } },
      orderBy: { createdAt: 'desc' },
      take: session.questionsCount,
    });

    const correctCount = attempts.filter((a) => a.isCorrect).length;
    const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0);

    const updated = await prisma.studySession.update({
      where: { id: sessionId },
      data: { correctCount, totalTime },
    });

    await this.gamification.updateStreak(userId);
    const newAchievements = await this.gamification.checkAchievements(userId);

    return {
      session: updated,
      attempts,
      stats: {
        total: session.questionsCount,
        correct: correctCount,
        wrong: session.questionsCount - correctCount,
        accuracy: session.questionsCount > 0 ? Math.round((correctCount / session.questionsCount) * 100) : 0,
        totalTime,
      },
      newAchievements,
    };
  }

  async toggleFavorite(userId: string, questionId: string) {
    const existing = await prisma.favorite.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await prisma.favorite.create({ data: { userId, questionId } });
    return { favorited: true };
  }

  async getUserStats(userId: string) {
    const [totalAttempts, correctAttempts, totalSessions, totalTime] = await Promise.all([
      prisma.questionAttempt.count({ where: { userId } }),
      prisma.questionAttempt.count({ where: { userId, isCorrect: true } }),
      prisma.studySession.count({ where: { userId } }),
      prisma.studySession.aggregate({ where: { userId }, _sum: { totalTime: true } }),
    ]);

    return {
      questionsAnswered: totalAttempts,
      correctAnswers: correctAttempts,
      accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
      totalSessions,
      totalTimeSeconds: totalTime._sum.totalTime ?? 0,
    };
  }

  async getSessionHistory(userId: string) {
    return prisma.studySession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
