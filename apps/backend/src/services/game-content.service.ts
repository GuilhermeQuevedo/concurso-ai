import { randomBytes } from 'node:crypto';

import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { htmlToPlainText } from '../utils/html.js';
import type { GameType, RoundItem } from '../utils/game-scoring.js';
import { estimateRetention } from '../utils/retention.js';
import { shuffle } from '../utils/shuffle.js';

const ROUND_SIZE = 6;
const QUIZ_SIZE = 8;
const TRILHA_SIZE = 5;
const MIN_CARDS = 4;
const MAX_OPTION_CHARS = 160;

interface CardRow {
  id: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  nextReview: Date;
  subject: { name: string };
}

function clip(text: string): string {
  const plain = text.replace(/\s+/g, ' ').trim();
  return plain.length > MAX_OPTION_CHARS ? `${plain.slice(0, MAX_OPTION_CHARS - 1)}…` : plain;
}

function notEnough(what: string, min: number): AppError {
  return new AppError(400, 'NOT_ENOUGH_CONTENT', `Você precisa de pelo menos ${min} ${what} para jogar.`);
}

// Dicas graduais: da mais genérica (categoria) à mais reveladora (metade da resposta)
function buildHints(card: CardRow): string[] {
  const words = clip(card.back).split(' ');
  const half = Math.max(2, Math.ceil(words.length / 2));
  return [
    `Disciplina: ${card.subject.name}`,
    `Começa com: ${words.slice(0, 3).join(' ')}…`,
    `Metade da resposta: ${words.slice(0, half).join(' ')}…`,
  ];
}

export interface GameSource {
  subjectId?: string;
  deckId?: string;
  questionSetId?: string;
}

const QUESTION_GAMES: GameType[] = ['DUELO', 'TRILHA'];

function assertSourceFits(game: GameType, source: GameSource): void {
  const isQuiz = QUESTION_GAMES.includes(game);
  if (isQuiz && source.deckId) {
    throw new AppError(400, 'SOURCE_MISMATCH', 'Este jogo usa questões. Escolha um simulado.');
  }
  if (!isQuiz && source.questionSetId) {
    throw new AppError(400, 'SOURCE_MISMATCH', 'Este jogo usa flashcards. Escolha um deck.');
  }
}

export class GameContentService {
  async build(userId: string, game: GameType, source: GameSource): Promise<RoundItem[]> {
    assertSourceFits(game, source);
    switch (game) {
      case 'DUELO':
        return this.quizItems(userId, source, QUIZ_SIZE, 5);
      case 'TRILHA':
        if (!source.subjectId && !source.questionSetId) {
          throw new AppError(400, 'SUBJECT_REQUIRED', 'Escolha uma disciplina ou um simulado.');
        }
        return this.quizItems(userId, source, TRILHA_SIZE, TRILHA_SIZE);
      case 'MEMORIA':
        return this.pairItems(await this.cards(userId, source));
      case 'PONTA':
        return this.cueItems(await this.cards(userId, source));
      default:
        return this.rescueItems(await this.cards(userId, source, true));
    }
  }

  private async cards(userId: string, source: GameSource, all = false): Promise<CardRow[]> {
    const rows = await prisma.flashcard.findMany({
      where: {
        userId,
        ...(source.deckId ? { deckId: source.deckId } : {}),
        ...(source.subjectId ? { subjectId: source.subjectId } : {}),
      },
      select: {
        id: true, front: true, back: true, interval: true, easeFactor: true, nextReview: true,
        subject: { select: { name: true } },
      },
      take: all ? 300 : 200,
    });
    if (rows.length < MIN_CARDS) throw notEnough('flashcards', MIN_CARDS);
    return rows;
  }

  private async quizItems(userId: string, source: GameSource, size: number, min: number): Promise<RoundItem[]> {
    const where = source.questionSetId
      ? { setItems: { some: { set: { id: source.questionSetId, userId } } } }
      : source.subjectId
        ? { subjectId: source.subjectId }
        : {};
    const ids = await prisma.question.findMany({ where, select: { id: true }, take: 300 });
    if (ids.length < min) throw notEnough('questões', min);

    const picked = shuffle(ids).slice(0, size).map((q) => q.id);
    const questions = await prisma.question.findMany({ where: { id: { in: picked } } });
    return shuffle(questions).map((q) => {
      const alternatives = q.alternatives as { letter: string; text: string }[];
      return {
        id: q.id,
        prompt: htmlToPlainText(q.statement),
        options: alternatives.map((a) => ({ key: a.letter, text: htmlToPlainText(a.text) })),
        answer: q.correctAnswer,
      };
    });
  }

  private optionsFor(card: CardRow, pool: CardRow[]): { options: RoundItem['options']; answer: string } {
    const distractors = shuffle(pool.filter((c) => c.id !== card.id)).slice(0, 3);
    const options = shuffle([card, ...distractors]).map((c) => ({ key: c.id, text: clip(c.back) }));
    return { options, answer: card.id };
  }

  private pairItems(cards: CardRow[]): RoundItem[] {
    return shuffle(cards).slice(0, ROUND_SIZE).map((c) => {
      const token = randomBytes(4).toString('hex');
      return { id: c.id, prompt: clip(c.front), options: [{ key: token, text: clip(c.back) }], answer: token };
    });
  }

  private cueItems(cards: CardRow[]): RoundItem[] {
    return shuffle(cards).slice(0, ROUND_SIZE).map((c) => ({
      id: c.id,
      prompt: clip(c.front),
      hints: buildHints(c),
      ...this.optionsFor(c, cards),
    }));
  }

  private rescueItems(cards: CardRow[]): RoundItem[] {
    const now = Date.now();
    return cards
      .map((c) => ({ c, retention: estimateRetention(c, now) }))
      .sort((x, y) => x.retention - y.retention)
      .slice(0, ROUND_SIZE)
      .map(({ c, retention }) => ({
        id: c.id,
        prompt: clip(c.front),
        retention: Math.round(retention * 100) / 100,
        ...this.optionsFor(c, cards),
      }));
  }
}
