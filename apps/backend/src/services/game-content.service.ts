import { randomBytes } from 'node:crypto';

import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { htmlToPlainText } from '../utils/html.js';
import type { GameType, RoundItem } from '../utils/game-scoring.js';

const ROUND_SIZE = 6;
const QUIZ_SIZE = 8;
const TRILHA_SIZE = 5;
const MIN_CARDS = 4;
const MAX_OPTION_CHARS = 160;
const DAY_MS = 86400000;

interface CardRow {
  id: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  nextReview: Date;
  subject: { name: string };
}

export function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
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

// Curva do esquecimento: retenção estimada cai exponencialmente desde a última revisão
export function estimateRetention(card: CardRow, now = Date.now()): number {
  const lastReview = card.nextReview.getTime() - card.interval * DAY_MS;
  const elapsedDays = Math.max(0, (now - lastReview) / DAY_MS);
  const stability = Math.max(1, card.interval * card.easeFactor);
  return Math.min(1, Math.max(0, Math.exp(-elapsedDays / stability)));
}

export class GameContentService {
  async build(userId: string, game: GameType, subjectId?: string): Promise<RoundItem[]> {
    switch (game) {
      case 'DUELO':
        return this.quizItems(subjectId, QUIZ_SIZE, 5);
      case 'TRILHA':
        if (!subjectId) throw new AppError(400, 'SUBJECT_REQUIRED', 'Escolha uma disciplina.');
        return this.quizItems(subjectId, TRILHA_SIZE, TRILHA_SIZE);
      case 'MEMORIA':
        return this.pairItems(await this.cards(userId, subjectId));
      case 'PONTA':
        return this.cueItems(await this.cards(userId, subjectId));
      default:
        return this.rescueItems(await this.cards(userId, subjectId, true));
    }
  }

  private async cards(userId: string, subjectId?: string, all = false): Promise<CardRow[]> {
    const rows = await prisma.flashcard.findMany({
      where: { userId, ...(subjectId ? { subjectId } : {}) },
      select: {
        id: true, front: true, back: true, interval: true, easeFactor: true, nextReview: true,
        subject: { select: { name: true } },
      },
      take: all ? 300 : 200,
    });
    if (rows.length < MIN_CARDS) throw notEnough('flashcards', MIN_CARDS);
    return rows;
  }

  private async quizItems(subjectId: string | undefined, size: number, min: number): Promise<RoundItem[]> {
    const where = subjectId ? { subjectId } : {};
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
