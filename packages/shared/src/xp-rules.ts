// Regras de pontuação (XP), níveis e faixas. Ver docs/08-pontuacao.md.
// Funções puras: o servidor aplica as regras e o app mostra exatamente os mesmos números.

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type XpSource = 'QUESTION' | 'SESSION' | 'FLASHCARD' | 'REVIEW' | 'GAME' | 'ESSAY' | 'DOUBT' | 'ROOM';

export const QUESTION_XP: Record<Difficulty, number> = { EASY: 3, MEDIUM: 5, HARD: 8 };
export const QUESTION_REPEAT_WINDOW_DAYS = 7;

export const SESSION_MIN_QUESTIONS = 10;
export const SESSION_BONUS = { GOOD: 10, GREAT: 25 } as const;
export const SESSION_GOOD_RATIO = 0.7;
export const SESSION_GREAT_RATIO = 0.9;

export const FLASHCARD_XP = { GOOD: 2, DOUBT: 1, MISS: 0 } as const;
export const REVIEW_XP = 6;
export const GAME_SCORE_DIVISOR = 5;
export const ESSAY_BASE_XP = 20;
export const ESSAY_MAX_BONUS_XP = 30;
export const DOUBT_CLEARED_XP = 8;
export const ROOM_CORRECT_XP = 3;

export const DAILY_XP_CAP = 250;
export const SOURCE_DAILY_CAP: Record<XpSource, number> = {
  QUESTION: 140,
  SESSION: 140,
  FLASHCARD: 40,
  REVIEW: 30,
  GAME: 60,
  DOUBT: 40,
  ROOM: 30,
  ESSAY: Number.POSITIVE_INFINITY,
};
// Fontes que dividem o mesmo teto (o bônus de sessão conta junto com as questões).
export const CAP_GROUP: Record<XpSource, XpSource> = {
  QUESTION: 'QUESTION',
  SESSION: 'QUESTION',
  FLASHCARD: 'FLASHCARD',
  REVIEW: 'REVIEW',
  GAME: 'GAME',
  ESSAY: 'ESSAY',
  DOUBT: 'DOUBT',
  ROOM: 'ROOM',
};
// Redação tem limite próprio (1 por semana) e não entra no teto diário.
export const SOURCES_OUTSIDE_DAILY_CAP: readonly XpSource[] = ['ESSAY'];
export const ESSAY_WEEKLY_LIMIT = 1;

export const DAY_QUALIFIES = { FLASHCARDS: 15 } as const;

export const MAX_LEVEL = 30;

export interface Tier {
  name: string;
  index: number;
  minLevel: number;
}

export const TIERS: readonly Tier[] = [
  { name: 'Calouro', index: 0, minLevel: 1 },
  { name: 'Aplicado', index: 1, minLevel: 5 },
  { name: 'Dedicado', index: 2, minLevel: 10 },
  { name: 'Veterano', index: 3, minLevel: 15 },
  { name: 'Mestre', index: 4, minLevel: 20 },
  { name: 'Lenda', index: 5, minLevel: 25 },
];

export function questionXp(difficulty: Difficulty, isCorrect: boolean): number {
  return isCorrect ? QUESTION_XP[difficulty] : 0;
}

export function sessionBonusXp(questionsCount: number, correctCount: number): number {
  if (questionsCount < SESSION_MIN_QUESTIONS) return 0;
  const ratio = correctCount / questionsCount;
  if (ratio >= SESSION_GREAT_RATIO) return SESSION_BONUS.GREAT;
  if (ratio >= SESSION_GOOD_RATIO) return SESSION_BONUS.GOOD;
  return 0;
}

// quality segue o app: 0-2 errou, 3-4 em dúvida, 5 acertou.
export function flashcardXp(quality: number): number {
  if (quality >= 5) return FLASHCARD_XP.GOOD;
  if (quality >= 3) return FLASHCARD_XP.DOUBT;
  return FLASHCARD_XP.MISS;
}

export function gameXp(gamePoints: number): number {
  return Math.max(0, Math.floor(gamePoints / GAME_SCORE_DIVISOR));
}

export function essayXp(score: number, maxScore: number): number {
  if (maxScore <= 0) return ESSAY_BASE_XP;
  return ESSAY_BASE_XP + Math.round(Math.min(1, Math.max(0, score / maxScore)) * ESSAY_MAX_BONUS_XP);
}

// Só XP de questões e flashcards recebe o multiplicador da ofensiva.
export function streakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 1.3;
  if (streakDays >= 14) return 1.2;
  if (streakDays >= 7) return 1.1;
  return 1;
}

export function appliesStreakMultiplier(source: XpSource): boolean {
  return source === 'QUESTION' || source === 'FLASHCARD';
}

export interface CapState {
  // XP já ganho hoje, por grupo de teto (ver CAP_GROUP).
  bySource: Partial<Record<XpSource, number>>;
  total: number;
}

// Quanto do XP pedido ainda cabe nos tetos de hoje.
export function grantableXp(source: XpSource, requested: number, today: CapState): number {
  if (requested <= 0) return 0;
  const group = CAP_GROUP[source];
  const groupLeft = SOURCE_DAILY_CAP[group] - (today.bySource[group] ?? 0);
  if (SOURCES_OUTSIDE_DAILY_CAP.includes(source)) return Math.max(0, Math.min(requested, groupLeft));
  const totalLeft = DAILY_XP_CAP - today.total;
  return Math.max(0, Math.min(requested, groupLeft, totalLeft));
}

export function costToNextLevel(level: number): number {
  return 100 + 25 * level;
}

export function xpForLevel(level: number): number {
  let total = 0;
  for (let n = 1; n < Math.min(level, MAX_LEVEL); n++) total += costToNextLevel(n);
  return total;
}

export interface LevelInfo {
  level: number;
  tier: Tier;
  xpIntoLevel: number;
  xpForNext: number;
  progress: number;
  maxed: boolean;
}

export function tierForLevel(level: number): Tier {
  return [...TIERS].reverse().find((tier) => level >= tier.minLevel) ?? (TIERS[0] as Tier);
}

export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  while (level < MAX_LEVEL && remaining >= costToNextLevel(level)) {
    remaining -= costToNextLevel(level);
    level += 1;
  }
  const maxed = level >= MAX_LEVEL;
  const xpForNext = maxed ? 0 : costToNextLevel(level);
  return {
    level,
    tier: tierForLevel(level),
    xpIntoLevel: maxed ? remaining : remaining,
    xpForNext,
    progress: maxed ? 1 : remaining / xpForNext,
    maxed,
  };
}
