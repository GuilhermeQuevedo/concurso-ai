import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import {
  GAMES,
  DAILY_POINT_CAP,
  applyDailyCap,
  isPlausibleDuration,
  scoreRound,
  type GameAnswer,
  type GameType,
  type RoundItem,
} from '../utils/game-scoring.js';
import { FlashcardService } from './flashcard.service.js';
import { GamificationService } from './gamification.service.js';
import { GameContentService, type GameSource } from './game-content.service.js';
import { GroupService } from './group.service.js';

const ROUND_TTL_MS = 30 * 60 * 1000;
const TRILHA_MIN_QUESTIONS = 5;
const TRILHA_LOOKAHEAD = 3;
const RESCUED_QUALITY = 4;
const MISSED_QUALITY = 1;

interface RoundPayload {
  items: RoundItem[];
  subjectId: string | null;
}

const GAME_LABELS: Record<GameType, string> = {
  DUELO: 'Duelo Relâmpago',
  MEMORIA: 'Memória Pareada',
  TRILHA: 'Trilha do Saber',
  PONTA: 'Na Ponta da Língua',
  RESGATE: 'Resgate da Memória',
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export class GameService {
  private readonly content = new GameContentService();
  private readonly flashcards: FlashcardService;
  private readonly gamification = new GamificationService();
  private readonly groups = new GroupService();

  constructor(aiProvider: IAIProvider) {
    this.flashcards = new FlashcardService(aiProvider);
  }

  private async sourceSubjectId(userId: string, source: GameSource): Promise<string | null> {
    if (source.subjectId) return source.subjectId;
    if (source.deckId) {
      const deck = await prisma.flashcardDeck.findFirst({ where: { id: source.deckId, userId }, select: { subjectId: true } });
      return deck?.subjectId ?? null;
    }
    if (source.questionSetId) {
      const set = await prisma.questionSet.findFirst({ where: { id: source.questionSetId, userId }, select: { subjectId: true } });
      return set?.subjectId ?? null;
    }
    return null;
  }

  async start(userId: string, game: GameType, source: GameSource = {}) {
    const items = await this.content.build(userId, game, source);
    const payload: RoundPayload = { items, subjectId: await this.sourceSubjectId(userId, source) };
    const round = await prisma.gameRound.create({
      data: { userId, game, payload: JSON.parse(JSON.stringify(payload)) },
      select: { id: true },
    });
    return {
      roundId: round.id,
      game,
      items: items.map(({ answer: _answer, ...visible }) => visible),
    };
  }

  async check(userId: string, roundId: string, itemId: string, choice: string) {
    const { payload } = await this.openRound(userId, roundId);
    const item = payload.items.find((i) => i.id === itemId);
    if (!item) throw new AppError(404, 'ITEM_NOT_FOUND', 'Item não encontrado');
    const correct = item.answer === choice;
    return { correct, answer: correct ? choice : item.answer };
  }

  async finish(userId: string, roundId: string, answers: GameAnswer[]) {
    const { round, payload } = await this.openRound(userId, roundId);
    const game = round.game as GameType;
    const elapsedSec = Math.round((Date.now() - round.createdAt.getTime()) / 1000);
    const result = scoreRound(game, payload.items, answers, elapsedSec);

    const earnedToday = await this.earnedToday(userId);
    const valid = isPlausibleDuration(elapsedSec, payload.items.length);
    const points = valid ? applyDailyCap(result.score, earnedToday) : 0;

    await prisma.$transaction([
      prisma.gameRound.update({ where: { id: roundId }, data: { finishedAt: new Date() } }),
      prisma.gameSession.create({
        data: {
          userId, game, subjectId: payload.subjectId, score: result.score, points,
          correct: result.correct, total: result.total, passed: result.passed, durationSec: elapsedSec,
        },
      }),
    ]);

    await this.afterPlay(userId, game, points, payload, answers);
    return {
      ...result,
      points,
      earnedToday: earnedToday + points,
      dailyCap: DAILY_POINT_CAP,
      capReached: points < result.score,
      answers: payload.items.map((i) => ({ id: i.id, answer: i.answer })),
    };
  }

  async overview(userId: string) {
    const since = new Date(Date.now() - 30 * 86400000);
    const [earnedToday, sessions] = await Promise.all([
      this.earnedToday(userId),
      prisma.gameSession.groupBy({
        by: ['game'],
        where: { userId, createdAt: { gte: since } },
        _max: { score: true },
        _count: { _all: true },
      }),
    ]);
    return {
      earnedToday,
      dailyCap: DAILY_POINT_CAP,
      games: GAMES.map((g) => {
        const s = sessions.find((x) => x.game === g);
        return { game: g, label: GAME_LABELS[g], best: s?._max.score ?? 0, plays: s?._count._all ?? 0 };
      }),
    };
  }

  async trilhaMap(userId: string) {
    const counts = await prisma.question.groupBy({ by: ['subjectId'], _count: { _all: true } });
    const eligible = new Set(
      counts.filter((c) => c._count._all >= TRILHA_MIN_QUESTIONS).map((c) => c.subjectId),
    );
    const subjects = (
      await prisma.subject.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }], select: { id: true, name: true } })
    ).filter((s) => eligible.has(s.id));

    const passedRows = await prisma.gameSession.findMany({
      where: { userId, game: 'TRILHA', passed: true },
      select: { subjectId: true },
      distinct: ['subjectId'],
    });
    const passed = new Set(passedRows.map((r) => r.subjectId));

    const nodes = subjects.map((s, i) => ({
      id: s.id,
      name: s.name,
      conquered: passed.has(s.id),
      unlocked: i === 0 || passed.has(subjects[i - 1].id),
    }));
    // Névoa de guerra: mostra o que já foi conquistado, a fronteira atual e só os próximos passos
    const frontier = nodes.reduce((last, n, i) => (n.unlocked ? i : last), 0);
    const visible = nodes.slice(0, frontier + TRILHA_LOOKAHEAD + 1);
    return { nodes: visible, hidden: nodes.length - visible.length };
  }

  private async afterPlay(
    userId: string,
    game: GameType,
    points: number,
    payload: RoundPayload,
    answers: GameAnswer[],
  ) {
    await this.gamification.updateStreak(userId);
    if (points > 0) {
      await this.groups.recordActivity(userId, 'GAME', `${GAME_LABELS[game]}: +${points} pts`, points);
    }
    if (game === 'RESGATE') await this.scheduleReviews(userId, payload.items, answers);
  }

  // O resgate vira revisão espaçada de verdade: acertar reforça o cartão, errar o traz de volta
  private async scheduleReviews(userId: string, items: RoundItem[], answers: GameAnswer[]) {
    const answerOf = new Map(items.map((i) => [i.id, i.answer]));
    for (const ans of answers) {
      if (!ans.itemId || !answerOf.has(ans.itemId)) continue;
      const quality = ans.choice === answerOf.get(ans.itemId) ? RESCUED_QUALITY : MISSED_QUALITY;
      await this.flashcards.review(userId, ans.itemId, { quality }).catch(() => undefined);
    }
  }

  private async earnedToday(userId: string): Promise<number> {
    const agg = await prisma.gameSession.aggregate({
      where: { userId, createdAt: { gte: startOfToday() } },
      _sum: { points: true },
    });
    return agg._sum.points ?? 0;
  }

  private async openRound(userId: string, roundId: string) {
    const round = await prisma.gameRound.findUnique({ where: { id: roundId } });
    if (!round || round.userId !== userId) {
      throw new AppError(404, 'ROUND_NOT_FOUND', 'Rodada não encontrada');
    }
    if (round.finishedAt) throw new AppError(409, 'ROUND_FINISHED', 'Esta rodada já foi finalizada');
    if (Date.now() - round.createdAt.getTime() > ROUND_TTL_MS) {
      throw new AppError(410, 'ROUND_EXPIRED', 'Rodada expirada. Comece outra.');
    }
    return { round, payload: round.payload as unknown as RoundPayload };
  }
}
