import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useMotionPreference, type UseMotionPreferenceReturn } from './useMotionPreference';

describe('useMotionPreference Hook (Phase 1)', () => {
  let capturedHook: UseMotionPreferenceReturn | null = null;

  function TestConsumer(): React.ReactElement {
    capturedHook = useMotionPreference();
    return React.createElement('div', {
      'data-motion-safe': capturedHook.isMotionSafe,
      'data-reduced': capturedHook.prefersReducedMotion,
    });
  }

  beforeEach(() => {
    capturedHook = null;
  });

  afterEach(() => {
    // @ts-expect-error cleanup window mock
    delete globalThis.window;
  });

  it('should initialize with standard motion enabled when window is undefined (SSR)', () => {
    // @ts-expect-error simulate SSR
    delete globalThis.window;

    renderToString(React.createElement(TestConsumer));

    assert.ok(capturedHook !== null);
    assert.equal(capturedHook.prefersReducedMotion, false);
    assert.equal(capturedHook.isMotionSafe, true);
    assert.equal(capturedHook.getDuration('base'), 220);
    assert.equal(capturedHook.resolveMotionClass('animate-fade-in', 'opacity-100'), 'animate-fade-in');
  });

  it('should detect prefers-reduced-motion when window.matchMedia matches', () => {
    // @ts-expect-error mock window with reduced motion
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

    renderToString(React.createElement(TestConsumer));

    assert.ok(capturedHook !== null);
    assert.equal(capturedHook.prefersReducedMotion, true);
    assert.equal(capturedHook.isMotionSafe, false);
    // When reduced motion is preferred, duration should collapse to 0
    assert.equal(capturedHook.getDuration('base'), 0);
    assert.equal(capturedHook.getDuration('instant'), 0);
    assert.equal(capturedHook.getDuration('deliberate'), 0);
    // resolveMotionClass should return fallback class
    assert.equal(
      capturedHook.resolveMotionClass('animate-slide-up', 'opacity-100'),
      'opacity-100',
    );
  });

  it('should provide frequency budget information correctly', () => {
    renderToString(React.createElement(TestConsumer));

    assert.ok(capturedHook !== null);
    const budgetVeryHigh = capturedHook.getBudget('very_high');
    assert.equal(budgetVeryHigh.maxDurationMs, 150);
    assert.equal(budgetVeryHigh.recommendedDuration, 'fast');

    const budgetRare = capturedHook.getBudget('rare');
    assert.equal(budgetRare.maxDurationMs, 450);
    assert.equal(budgetRare.recommendedDuration, 'deliberate');
  });
});
