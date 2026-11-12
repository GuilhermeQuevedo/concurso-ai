import { QUESTION_REPEAT_WINDOW_DAYS, questionXp, sessionBonusXp } from '@concurso-ai/shared';
import { xpService, type XpAward } from './xp.service.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { GamificationService } from './gamification.service.js';
import { GroupService } from './group.service.js';

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
  private readonly groups = new GroupService();

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

    // Acertar de novo a mesma questão em menos de 7 dias não pontua (evita ganhar repetindo).
    const repeated = isCorrect && (await xpService.hasRecentCorrect(userId, question.id, attempt.id, QUESTION_REPEAT_WINDOW_DAYS));
    const xp = await xpService.award(userId, 'QUESTION', attempt.id, repeated ? 0 : questionXp(question.difficulty, isCorrect));

    return { attempt, isCorrect, correctAnswer: question.correctAnswer, explanation: question.explanation, xp };
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

    // Update condicional atômico: garante que apenas a primeira requisição concorrente processe a finalização
    const updateResult = await prisma.studySession.updateMany({
      where: {
        id: sessionId,
        userId,
        finishedAt: null,
      },
      data: {
        correctCount,
        totalTime,
        finishedAt: new Date(),
      },
    });

    const isFirstFinalizer = updateResult.count > 0;
    let newAchievements: string[] = [];
    let sessionBonus: XpAward | null = null;

    if (isFirstFinalizer) {
      await this.gamification.updateStreak(userId);
      newAchievements = await this.gamification.checkAchievements(userId);

      const isPerfect = correctCount === session.questionsCount && session.questionsCount > 0;
      const bonus = await xpService.award(userId, 'SESSION', sessionId, sessionBonusXp(session.questionsCount, correctCount));
      const answeredXp = await prisma.xpEvent.aggregate({
        where: { userId, source: 'QUESTION', refId: { in: attempts.map((a) => a.id) } },
        _sum: { xp: true },
      });
      const sessionXp = (answeredXp._sum.xp ?? 0) + bonus.granted;
      if (sessionXp > 0) {
        await this.groups.recordActivity(
          userId,
          isPerfect ? 'PERFECT_SESSION' : 'SESSION_COMPLETED',
          `Completou sessão: ${correctCount}/${session.questionsCount} acertos`,
          sessionXp,
        );
      }
      sessionBonus = bonus;
    }

    const currentSession = await prisma.studySession.findUnique({ where: { id: sessionId } });

    return {
      session: currentSession ?? session,
      attempts,
      stats: {
        total: session.questionsCount,
        correct: currentSession?.correctCount ?? correctCount,
        wrong: session.questionsCount - (currentSession?.correctCount ?? correctCount),
        accuracy: session.questionsCount > 0 ? Math.round(((currentSession?.correctCount ?? correctCount) / session.questionsCount) * 100) : 0,
        totalTime: currentSession?.totalTime ?? totalTime,
      },
      newAchievements,
      xp: sessionBonus,
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
