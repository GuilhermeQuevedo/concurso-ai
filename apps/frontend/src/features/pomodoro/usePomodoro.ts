import { useEffect, useState } from 'react';

import { getRemainingMs, pomodoro, usePomodoroState } from './pomodoro-store';

const TICK_MS = 1000;

export function usePomodoro() {
  const state = usePomodoroState();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, [state.running]);

  return { ...state, secondsLeft: Math.ceil(getRemainingMs(state) / 1000), actions: pomodoro };
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const m = String(Math.floor(safe / 60)).padStart(2, '0');
  const s = String(safe % 60).padStart(2, '0');
  return `${m}:${s}`;
}
