import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'engrama:pomodoro:floating';
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

let floating = read();

export function setPomodoroFloating(next: boolean): void {
  floating = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
  } catch {
    // sem armazenamento a escolha vale só até recarregar a página
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function usePomodoroFloating(): boolean {
  return useSyncExternalStore(subscribe, () => floating);
}
