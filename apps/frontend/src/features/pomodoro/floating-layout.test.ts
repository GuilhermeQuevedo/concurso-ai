import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampPosition,
  clampDimension,
  MIN_WIDTH,
  MAX_WIDTH,
  MIN_HEIGHT,
  MAX_HEIGHT,
} from './floating-layout';

describe('FloatingLayout Logic (Draggable & Resizable Pomodoro)', () => {
  it('should clamp coordinates within viewport margins', () => {
    // Attempting to move offscreen to the top-left (-50, -50)
    const clampedTopLeft = clampPosition(-50, -50, 250, 52, 1000, 800);
    assert.strictEqual(clampedTopLeft.x, 12); // margin
    assert.strictEqual(clampedTopLeft.y, 12);

    // Attempting to move offscreen to the bottom-right (2000, 2000)
    const clampedBottomRight = clampPosition(2000, 2000, 250, 52, 1000, 800);
    assert.strictEqual(clampedBottomRight.x, 1000 - 250 - 12); // 738
    assert.strictEqual(clampedBottomRight.y, 800 - 52 - 12); // 736
  });

  it('should clamp dimensions between MIN and MAX bounds', () => {
    // Width below min
    assert.strictEqual(clampDimension(100, MIN_WIDTH, MAX_WIDTH), MIN_WIDTH);
    // Width above max
    assert.strictEqual(clampDimension(800, MIN_WIDTH, MAX_WIDTH), MAX_WIDTH);
    // Valid width
    assert.strictEqual(clampDimension(300, MIN_WIDTH, MAX_WIDTH), 300);

    // Height below min
    assert.strictEqual(clampDimension(20, MIN_HEIGHT, MAX_HEIGHT), MIN_HEIGHT);
    // Height above max
    assert.strictEqual(clampDimension(900, MIN_HEIGHT, MAX_HEIGHT), MAX_HEIGHT);
  });
});
