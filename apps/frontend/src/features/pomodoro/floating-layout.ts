export interface FloatingLayout {
  x: number | null;
  y: number | null;
  width: number;
  height: number;
  isExpanded: boolean;
}

export const MIN_WIDTH = 220;
export const MAX_WIDTH = 460;
export const MIN_HEIGHT = 48;
export const MAX_HEIGHT = 320;

export const DEFAULT_COMPACT_WIDTH = 250;
export const DEFAULT_COMPACT_HEIGHT = 52;
export const DEFAULT_EXPANDED_WIDTH = 290;
export const DEFAULT_EXPANDED_HEIGHT = 185;

const STORAGE_KEY = 'engrama:pomodoro:floating-layout:v2';
const listeners = new Set<() => void>();

export function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
): { x: number; y: number } {
  const margin = 12;
  const maxX = Math.max(margin, viewportWidth - width - margin);
  const maxY = Math.max(margin, viewportHeight - height - margin);
  return {
    x: Math.round(Math.min(Math.max(margin, x), maxX)),
    y: Math.round(Math.min(Math.max(margin, y), maxY)),
  };
}

export function clampDimension(
  val: number,
  min: number,
  max: number,
  viewportMax = typeof window !== 'undefined' ? window.innerWidth - 24 : max
): number {
  return Math.round(Math.min(Math.max(min, val), Math.min(max, viewportMax)));
}

function loadLayout(): FloatingLayout {
  const defaultLayout: FloatingLayout = {
    x: null,
    y: null,
    width: DEFAULT_COMPACT_WIDTH,
    height: DEFAULT_COMPACT_HEIGHT,
    isExpanded: false,
  };

  if (typeof window === 'undefined') return defaultLayout;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLayout;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaultLayout;

    const width = clampDimension(
      typeof parsed.width === 'number' ? parsed.width : DEFAULT_COMPACT_WIDTH,
      MIN_WIDTH,
      MAX_WIDTH
    );
    const height = clampDimension(
      typeof parsed.height === 'number' ? parsed.height : DEFAULT_COMPACT_HEIGHT,
      MIN_HEIGHT,
      MAX_HEIGHT,
      window.innerHeight - 24
    );

    const isExpanded = typeof parsed.isExpanded === 'boolean' ? parsed.isExpanded : height >= 90;

    let x: number | null = null;
    let y: number | null = null;

    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      const clamped = clampPosition(parsed.x, parsed.y, width, height);
      x = clamped.x;
      y = clamped.y;
    }

    return { x, y, width, height, isExpanded };
  } catch {
    return defaultLayout;
  }
}

let currentLayout: FloatingLayout = loadLayout();

export function saveFloatingLayout(next: Partial<FloatingLayout>): void {
  currentLayout = { ...currentLayout, ...next };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLayout));
    } catch {
      // ignore storage failure
    }
  }
  listeners.forEach((l) => l());
}

export function resetFloatingLayout(): void {
  saveFloatingLayout({
    x: null,
    y: null,
    width: DEFAULT_COMPACT_WIDTH,
    height: DEFAULT_COMPACT_HEIGHT,
    isExpanded: false,
  });
}

export function subscribeFloatingLayout(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFloatingLayoutSnapshot(): FloatingLayout {
  return currentLayout;
}
