import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  type MotionDurationKey,
  type FrequencyLevel,
  type MotionBudget,
  getMotionBudget,
  isReducedMotionPreferred,
  resolveEffectiveDuration,
} from '../lib/motion';

export interface UseMotionPreferenceReturn {
  readonly prefersReducedMotion: boolean;
  readonly isMotionSafe: boolean;
  readonly getDuration: (key: MotionDurationKey) => number;
  readonly getBudget: (frequency: FrequencyLevel) => MotionBudget;
  readonly resolveMotionClass: (activeClass: string, reducedClass?: string) => string;
}

/**
 * Hook central para governança de acessibilidade de movimento e orçamentos de tempo.
 * Respeita preferências do sistema operacional (prefers-reduced-motion) com reatividade em tempo real.
 */
export function useMotionPreference(): UseMotionPreferenceReturn {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(isReducedMotionPreferred);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(mediaQueryList.matches);

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', updatePreference);
      return () => {
        mediaQueryList.removeEventListener('change', updatePreference);
      };
    }

    // Suporte a navegadores e runtimes mais antigos
    const legacyMql = mediaQueryList as unknown as {
      addListener?: (cb: (e: MediaQueryListEvent) => void) => void;
      removeListener?: (cb: (e: MediaQueryListEvent) => void) => void;
    };
    if (typeof legacyMql.addListener === 'function') {
      legacyMql.addListener(updatePreference);
      return () => {
        legacyMql.removeListener?.(updatePreference);
      };
    }
  }, []);

  const getDuration = useCallback(
    (key: MotionDurationKey): number => {
      return resolveEffectiveDuration(key, prefersReducedMotion);
    },
    [prefersReducedMotion],
  );

  const getBudget = useCallback((frequency: FrequencyLevel): MotionBudget => {
    return getMotionBudget(frequency);
  }, []);

  const resolveMotionClass = useCallback(
    (activeClass: string, reducedClass = ''): string => {
      return prefersReducedMotion ? reducedClass : activeClass;
    },
    [prefersReducedMotion],
  );

  return useMemo(
    () => ({
      prefersReducedMotion,
      isMotionSafe: !prefersReducedMotion,
      getDuration,
      getBudget,
      resolveMotionClass,
    }),
    [prefersReducedMotion, getDuration, getBudget, resolveMotionClass],
  );
}
