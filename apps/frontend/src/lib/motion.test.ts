import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  FREQUENCY_BUDGETS,
  getMotionBudget,
  isWithinBudget,
  isReducedMotionPreferred,
  resolveEffectiveDuration,
} from './motion';

describe('Motion Module — Tokens & Utilities (Phase 1)', () => {
  describe('Duration Tokens', () => {
    it('should define five standard semantic durations strictly ordered by duration', () => {
      assert.equal(MOTION_DURATIONS.instant, 80);
      assert.equal(MOTION_DURATIONS.fast, 140);
      assert.equal(MOTION_DURATIONS.base, 220);
      assert.equal(MOTION_DURATIONS.slow, 320);
      assert.equal(MOTION_DURATIONS.deliberate, 450);

      assert.ok(MOTION_DURATIONS.instant < MOTION_DURATIONS.fast);
      assert.ok(MOTION_DURATIONS.fast < MOTION_DURATIONS.base);
      assert.ok(MOTION_DURATIONS.base < MOTION_DURATIONS.slow);
      assert.ok(MOTION_DURATIONS.slow < MOTION_DURATIONS.deliberate);
    });
  });

  describe('Easing Curves', () => {
    it('should define four essential easing curves and disallow linear motion', () => {
      assert.equal(MOTION_EASINGS.standard, 'cubic-bezier(0.2, 0, 0, 1)');
      assert.equal(MOTION_EASINGS.exit, 'cubic-bezier(0.3, 0, 0.8, 0.15)');
      assert.equal(MOTION_EASINGS.inOut, 'cubic-bezier(0.4, 0, 0.2, 1)');
      assert.equal(MOTION_EASINGS.overshoot, 'cubic-bezier(0.34, 1.3, 0.64, 1)');

      Object.values(MOTION_EASINGS).forEach((easing) => {
        assert.notEqual(easing, 'linear', 'Linear easing is forbidden for UI transitions');
      });
    });
  });

  describe('Frequency Budgets', () => {
    it('should enforce duration ceiling per usage frequency', () => {
      assert.equal(getMotionBudget('very_high').maxDurationMs, 150);
      assert.equal(getMotionBudget('high').maxDurationMs, 220);
      assert.equal(getMotionBudget('medium').maxDurationMs, 320);
      assert.equal(getMotionBudget('rare').maxDurationMs, 450);
    });

    it('should restrict overshoot animation only to medium and rare interactions', () => {
      assert.equal(FREQUENCY_BUDGETS.very_high.allowOvershoot, false);
      assert.equal(FREQUENCY_BUDGETS.high.allowOvershoot, false);
      assert.equal(FREQUENCY_BUDGETS.medium.allowOvershoot, true);
      assert.equal(FREQUENCY_BUDGETS.rare.allowOvershoot, true);
    });

    it('should correctly validate if an animation duration is within budget', () => {
      assert.equal(isWithinBudget(80, 'very_high'), true);
      assert.equal(isWithinBudget(140, 'very_high'), true);
      assert.equal(isWithinBudget(150, 'very_high'), true);
      assert.equal(isWithinBudget(151, 'very_high'), false);
      assert.equal(isWithinBudget(300, 'very_high'), false);

      assert.equal(isWithinBudget(220, 'high'), true);
      assert.equal(isWithinBudget(221, 'high'), false);

      assert.equal(isWithinBudget(320, 'medium'), true);
      assert.equal(isWithinBudget(321, 'medium'), false);

      assert.equal(isWithinBudget(450, 'rare'), true);
      assert.equal(isWithinBudget(451, 'rare'), false);
    });
  });

  describe('Accessibility & Reduced Motion', () => {
    let originalWindow: typeof globalThis.window;

    beforeEach(() => {
      originalWindow = globalThis.window;
    });

    afterEach(() => {
      if (originalWindow !== undefined) {
        globalThis.window = originalWindow;
      } else {
        // @ts-expect-error cleanup window mock
        delete globalThis.window;
      }
    });

    it('should return false if window is not defined (SSR / Node)', () => {
      // @ts-expect-error simulate SSR
      delete globalThis.window;
      assert.equal(isReducedMotionPreferred(), false);
    });

    it('should return true when matchMedia indicates prefers-reduced-motion: reduce', () => {
      // @ts-expect-error mock window
      globalThis.window = {
        matchMedia: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      };

      assert.equal(isReducedMotionPreferred(), true);
    });

    it('should return 0 duration when reduced motion is preferred', () => {
      assert.equal(resolveEffectiveDuration('instant', true), 0);
      assert.equal(resolveEffectiveDuration('fast', true), 0);
      assert.equal(resolveEffectiveDuration('base', true), 0);
      assert.equal(resolveEffectiveDuration('slow', true), 0);
      assert.equal(resolveEffectiveDuration('deliberate', true), 0);
    });

    it('should return the standard duration when reduced motion is not preferred', () => {
      assert.equal(resolveEffectiveDuration('instant', false), 80);
      assert.equal(resolveEffectiveDuration('fast', false), 140);
      assert.equal(resolveEffectiveDuration('base', false), 220);
      assert.equal(resolveEffectiveDuration('slow', false), 320);
      assert.equal(resolveEffectiveDuration('deliberate', false), 450);
    });
  });
});
