import { useSyncExternalStore } from 'react';

export type ToastKind = 'error' | 'success';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const AUTO_DISMISS_MS = 5000;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export function dismissToast(id: number): void {
  items = items.filter((item) => item.id !== id);
  emit();
}

function push(kind: ToastKind, message: string): void {
  const id = nextId++;
  items = [...items, { id, kind, message }];
  emit();
  setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
}

export const toast = {
  error: (message: string) => push('error', message),
  success: (message: string) => push('success', message),
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(subscribe, () => items);
}
