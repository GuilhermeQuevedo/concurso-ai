/**
 * Módulo Central de Tokens e Utilitários de Movimento — Engrama
 * Fase 1 do Plano de UX e Interação
 */

export type MotionDurationKey = 'instant' | 'fast' | 'base' | 'slow' | 'deliberate';

export const MOTION_DURATIONS: Record<MotionDurationKey, number> = {
  instant: 80,
  fast: 140,
  base: 220,
  slow: 320,
  deliberate: 450,
} as const;

export type MotionEasingKey = 'standard' | 'exit' | 'inOut' | 'overshoot';

export const MOTION_EASINGS: Record<MotionEasingKey, string> = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  exit: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  overshoot: 'cubic-bezier(0.34, 1.3, 0.64, 1)',
} as const;

export type FrequencyLevel = 'very_high' | 'high' | 'medium' | 'rare';

export interface MotionBudget {
  maxDurationMs: number;
  allowOvershoot: boolean;
  allowSquash: boolean;
  recommendedDuration: MotionDurationKey;
  recommendedEasing: MotionEasingKey;
  description: string;
}

export const FREQUENCY_BUDGETS: Record<FrequencyLevel, MotionBudget> = {
  very_high: {
    maxDurationMs: 150,
    allowOvershoot: false,
    allowSquash: true,
    recommendedDuration: 'fast',
    recommendedEasing: 'standard',
    description: 'Ações de repetição constante (questões, flashcards). Prioridade total para agilidade.',
  },
  high: {
    maxDurationMs: 220,
    allowOvershoot: false,
    allowSquash: false,
    recommendedDuration: 'base',
    recommendedEasing: 'inOut',
    description: 'Navegação diária, tabs e toggles. Movimento informativo e rápido.',
  },
  medium: {
    maxDurationMs: 320,
    allowOvershoot: true,
    allowSquash: false,
    recommendedDuration: 'slow',
    recommendedEasing: 'standard',
    description: 'Abertura de modais, drawers e toasts. Permite assentamento suave.',
  },
  rare: {
    maxDurationMs: 450,
    allowOvershoot: true,
    allowSquash: true,
    recommendedDuration: 'deliberate',
    recommendedEasing: 'overshoot',
    description: 'Ações de alto significado ou irreversíveis (finalizar prova, conquista). Expressividade controlada.',
  },
} as const;

/**
 * Retorna o orçamento de animação para um determinado nível de frequência de uso.
 */
export function getMotionBudget(frequency: FrequencyLevel): MotionBudget {
  return FREQUENCY_BUDGETS[frequency];
}

/**
 * Valida se uma duração em milissegundos cabe no orçamento da frequência informada.
 */
export function isWithinBudget(durationMs: number, frequency: FrequencyLevel): boolean {
  return durationMs <= FREQUENCY_BUDGETS[frequency].maxDurationMs;
}

/**
 * Verifica se o usuário prefere redução de movimento no ambiente atual.
 * Seguro para SSR e ambientes sem janela (testes).
 */
export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Resolve a duração efetiva em milissegundos respeitando a preferência de acessibilidade.
 */
export function resolveEffectiveDuration(
  key: MotionDurationKey,
  reducedMotion: boolean = isReducedMotionPreferred(),
): number {
  if (reducedMotion) {
    return 0;
  }
  return MOTION_DURATIONS[key];
}
