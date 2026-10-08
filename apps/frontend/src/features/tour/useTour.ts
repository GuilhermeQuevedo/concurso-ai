import { createContext, useContext } from 'react';

export interface TourContextValue {
  active: boolean;
  start: () => void;
  stop: () => void;
}

export const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    return { active: false, start: () => {}, stop: () => {} };
  }
  return ctx;
}

export const TOUR_DONE_KEY = 'tour-done-v1';

export function isTourDone(): boolean {
  try {
    return localStorage.getItem(TOUR_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTourDone(): void {
  try {
    localStorage.setItem(TOUR_DONE_KEY, '1');
  } catch {
    // ignore storage errors
  }
}
