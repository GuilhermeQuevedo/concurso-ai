export const MIN_QUESTIONS = 3;
export const MAX_QUESTIONS = 20;
export const MIN_SECONDS = 10;
export const MAX_SECONDS = 120;

export const COUNTDOWN_MS = 5000;
export const REVEAL_MS = 6000;
export const OWN_PACE_WINDOW_MS = 24 * 60 * 60 * 1000;

const BASE_POINTS = 10;
const SPEED_BONUS_MAX = 5;

export type RoomPhase = 'LOBBY' | 'COUNTDOWN' | 'ANSWERING' | 'REVEAL' | 'FINISHED';

export interface LiveTiming {
  phase: Exclude<RoomPhase, 'LOBBY'>;
  index: number;
  remainingMs: number;
  // Instante em que a pergunta atual abriu; base para medir o tempo de resposta no servidor.
  questionStartedAt: number;
}

const slotMs = (secondsPerQuestion: number) => secondsPerQuestion * 1000 + REVEAL_MS;

export function liveEndsAt(startsAt: number, total: number, secondsPerQuestion: number): number {
  return startsAt + total * slotMs(secondsPerQuestion);
}

// A sala ao vivo é uma linha do tempo fixa: cada pergunta tem uma janela de resposta e uma de gabarito.
export function liveTiming(startsAt: number, total: number, secondsPerQuestion: number, now: number): LiveTiming {
  if (now < startsAt) return { phase: 'COUNTDOWN', index: 0, remainingMs: startsAt - now, questionStartedAt: startsAt };

  const slot = slotMs(secondsPerQuestion);
  const elapsed = now - startsAt;
  const index = Math.floor(elapsed / slot);
  if (index >= total) return { phase: 'FINISHED', index: total - 1, remainingMs: 0, questionStartedAt: startsAt };

  const within = elapsed - index * slot;
  const answerMs = secondsPerQuestion * 1000;
  const questionStartedAt = startsAt + index * slot;
  if (within < answerMs) return { phase: 'ANSWERING', index, remainingMs: answerMs - within, questionStartedAt };
  return { phase: 'REVEAL', index, remainingMs: slot - within, questionStartedAt };
}

// Ao vivo: acertar vale 10, mais até 5 pela rapidez. No próprio ritmo: 10 fixos.
export function pointsFor(isCorrect: boolean, mode: 'LIVE' | 'OWN_PACE', elapsedMs: number, secondsPerQuestion: number): number {
  if (!isCorrect) return 0;
  if (mode === 'OWN_PACE') return BASE_POINTS;
  const answerMs = secondsPerQuestion * 1000;
  const ratio = Math.min(1, Math.max(0, 1 - elapsedMs / answerMs));
  return BASE_POINTS + Math.round(SPEED_BONUS_MAX * ratio);
}
