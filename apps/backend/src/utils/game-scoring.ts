export const GAMES = ['DUELO', 'MEMORIA', 'TRILHA', 'PONTA', 'RESGATE'] as const;
export type GameType = (typeof GAMES)[number];

export const DAILY_POINT_CAP = 300;
export const TRILHA_PASS_RATIO = 0.6;
const DUELO_LIMIT_MS = 20000;
const CUE_POINTS = [10, 7, 4, 2] as const;

export interface RoundItem {
  id: string;
  prompt: string;
  options: { key: string; text: string }[];
  answer: string;
  hints?: string[];
  retention?: number;
}

export interface GameAnswer {
  itemId?: string;
  choice?: string;
  ms?: number;
  cues?: number;
  a?: string;
  b?: string;
}

export interface ScoreResult {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
}

function byItem(items: RoundItem[]): Map<string, RoundItem> {
  return new Map(items.map((i) => [i.id, i]));
}

function scoreDuelo(items: RoundItem[], answers: GameAnswer[]): ScoreResult {
  const map = byItem(items);
  let score = 0;
  let correct = 0;
  let combo = 0;
  for (const ans of answers) {
    const item = ans.itemId ? map.get(ans.itemId) : undefined;
    if (!item) continue;
    if (ans.choice === item.answer) {
      const ms = Math.min(Math.max(ans.ms ?? DUELO_LIMIT_MS, 0), DUELO_LIMIT_MS);
      const speed = Math.floor(5 * (1 - ms / DUELO_LIMIT_MS));
      score += Math.round((10 + speed) * Math.min(2, 1 + combo * 0.1));
      correct += 1;
      combo += 1;
    } else {
      combo = 0;
    }
  }
  return { score, correct, total: items.length, passed: correct >= Math.ceil(items.length / 2) };
}

function scoreMemoria(items: RoundItem[], answers: GameAnswer[], elapsedSec: number): ScoreResult {
  const map = byItem(items);
  const matched = new Set<string>();
  let errors = 0;
  for (const ans of answers) {
    const item = ans.a ? map.get(ans.a) : undefined;
    if (!item || !ans.b) continue;
    if (ans.b === item.answer) matched.add(item.id);
    else errors += 1;
  }
  const pairs = matched.size;
  const base = Math.max(pairs * 2, pairs * 10 - errors * 2);
  const complete = pairs === items.length;
  const timeBonus = complete && elapsedSec <= items.length * 8 ? 5 : 0;
  return { score: base + timeBonus, correct: pairs, total: items.length, passed: complete };
}

function scoreChoices(
  items: RoundItem[],
  answers: GameAnswer[],
  pointsFor: (ans: GameAnswer, item: RoundItem) => number,
): { score: number; correct: number } {
  const map = byItem(items);
  const seen = new Set<string>();
  let score = 0;
  let correct = 0;
  for (const ans of answers) {
    const item = ans.itemId ? map.get(ans.itemId) : undefined;
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    if (ans.choice === item.answer) {
      score += pointsFor(ans, item);
      correct += 1;
    }
  }
  return { score, correct };
}

export function scoreRound(
  game: GameType,
  items: RoundItem[],
  answers: GameAnswer[],
  elapsedSec: number,
): ScoreResult {
  if (game === 'DUELO') return scoreDuelo(items, answers);
  if (game === 'MEMORIA') return scoreMemoria(items, answers, elapsedSec);

  const total = items.length;
  if (game === 'TRILHA') {
    const { score, correct } = scoreChoices(items, answers, () => 10);
    return { score, correct, total, passed: correct / total >= TRILHA_PASS_RATIO };
  }
  if (game === 'PONTA') {
    const { score, correct } = scoreChoices(items, answers, (a) => CUE_POINTS[Math.min(a.cues ?? 3, 3)]);
    return { score, correct, total, passed: correct >= Math.ceil(total / 2) };
  }
  const { score, correct } = scoreChoices(items, answers, (_a, item) =>
    6 + Math.round(4 * (1 - (item.retention ?? 1))),
  );
  return { score, correct, total, passed: correct >= Math.ceil(total / 2) };
}

export function applyDailyCap(score: number, earnedToday: number): number {
  return Math.max(0, Math.min(score, DAILY_POINT_CAP - earnedToday));
}

export function isPlausibleDuration(elapsedSec: number, total: number): boolean {
  return elapsedSec >= total;
}
