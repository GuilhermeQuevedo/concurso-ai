import { useSyncExternalStore } from 'react';

import { toast } from '@/components/ui/toast-store';

export type PomodoroMode = 'foco' | 'curta' | 'longa';

export const POMODORO_MODES: Record<PomodoroMode, { label: string; minutes: number }> = {
  foco: { label: 'Foco', minutes: 25 },
  curta: { label: 'Pausa curta', minutes: 5 },
  longa: { label: 'Pausa longa', minutes: 15 },
};

export interface PomodoroState {
  mode: PomodoroMode;
  running: boolean;
  // Instante em que o ciclo termina (só com o relógio rodando); evita desvio quando a aba é pausada pelo navegador.
  endsAt: number | null;
  remainingMs: number;
  cycles: number;
}

const STORAGE_KEY = 'engrama:pomodoro:v1';

const fullMs = (mode: PomodoroMode) => POMODORO_MODES[mode].minutes * 60_000;
const cyclesKey = () => `pomodoro-cycles-${new Date().toISOString().slice(0, 10)}`;

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // sem armazenamento o cronômetro só deixa de sobreviver ao recarregar a página
  }
}

function isMode(value: unknown): value is PomodoroMode {
  return value === 'foco' || value === 'curta' || value === 'longa';
}

function load(): PomodoroState {
  const cycles = Number(readStorage(cyclesKey()) ?? '0') || 0;
  const base: PomodoroState = { mode: 'foco', running: false, endsAt: null, remainingMs: fullMs('foco'), cycles };
  const raw = readStorage(STORAGE_KEY);
  if (!raw) return base;
  try {
    const saved: unknown = JSON.parse(raw);
    if (typeof saved !== 'object' || saved === null) return base;
    const { mode, endsAt, remainingMs } = saved as Record<string, unknown>;
    if (!isMode(mode) || typeof remainingMs !== 'number') return base;
    if (typeof endsAt === 'number') return { mode, running: true, endsAt, remainingMs, cycles };
    return { mode, running: false, endsAt: null, remainingMs, cycles };
  } catch {
    return base;
  }
}

let state: PomodoroState = load();
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function commit(next: PomodoroState): void {
  state = next;
  writeStorage(STORAGE_KEY, JSON.stringify({ mode: next.mode, endsAt: next.endsAt, remainingMs: next.remainingMs }));
  listeners.forEach((listener) => listener());
}

function clearTimer(): void {
  if (timer) clearTimeout(timer);
  timer = null;
}

function finish(): void {
  clearTimer();
  const finished = state.mode;
  const cycles = finished === 'foco' ? state.cycles + 1 : state.cycles;
  if (finished === 'foco') writeStorage(cyclesKey(), String(cycles));
  commit({ mode: finished, running: false, endsAt: null, remainingMs: fullMs(finished), cycles });
  toast.success(finished === 'foco' ? 'Ciclo de foco concluído. Hora da pausa!' : 'Pausa concluída. Pronto para o próximo foco?');
}

function schedule(): void {
  clearTimer();
  if (!state.running || state.endsAt === null) return;
  const wait = state.endsAt - Date.now();
  if (wait <= 0) {
    finish();
    return;
  }
  timer = setTimeout(finish, wait);
}

export const pomodoro = {
  start(): void {
    if (state.running) return;
    commit({ ...state, running: true, endsAt: Date.now() + state.remainingMs });
    schedule();
  },
  pause(): void {
    if (!state.running || state.endsAt === null) return;
    clearTimer();
    commit({ ...state, running: false, endsAt: null, remainingMs: Math.max(0, state.endsAt - Date.now()) });
  },
  reset(mode: PomodoroMode = state.mode): void {
    clearTimer();
    commit({ ...state, mode, running: false, endsAt: null, remainingMs: fullMs(mode) });
  },
};

export const getRemainingMs = (s: PomodoroState): number =>
  s.running && s.endsAt !== null ? Math.max(0, s.endsAt - Date.now()) : s.remainingMs;

// Ciclo em andamento ou pausado no meio: é quando vale mostrar o mini cronômetro em outras telas.
export const isInProgress = (s: PomodoroState): boolean => s.running || s.remainingMs < fullMs(s.mode);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function usePomodoroState(): PomodoroState {
  return useSyncExternalStore(subscribe, () => state);
}

schedule();
