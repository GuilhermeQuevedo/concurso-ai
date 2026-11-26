import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getNodeObsidianColors } from './graphColors';
import type { GraphNode } from '../types/map.types';

describe('getNodeObsidianColors', () => {
  const baseNode: GraphNode = {
    id: 't-1',
    name: 'Direito Constitucional',
    slug: 'direito-constitucional',
    level: 'DISCIPLINE',
    levelLabel: 'Disciplina',
    order: 1,
    description: null,
    parentId: null,
    subjectId: null,
    x: 0,
    y: 0,
    incidenceWeight: 1.2,
  };

  it('should return dark not-started style when topic is not started', () => {
    const colors = getNodeObsidianColors(baseNode, 0, true, true);
    assert.strictEqual(colors.isGlowVisible, false);
    assert.strictEqual(colors.hexNumber, 0x334155);
  });

  it('should return cyan neon for constitutional topics in dark mode', () => {
    const colors = getNodeObsidianColors(baseNode, 50, false, true);
    assert.strictEqual(colors.fill, '#00f0ff');
    assert.strictEqual(colors.isGlowVisible, true);
    assert.strictEqual(colors.hexNumber, 0x00f0ff);
  });

  it('should return purple neon for administrative topics', () => {
    const admNode: GraphNode = { ...baseNode, name: 'Poderes Administrativos', slug: 'adm-poderes' };
    const colors = getNodeObsidianColors(admNode, 60, false, true);
    assert.strictEqual(colors.fill, '#c084fc');
    assert.strictEqual(colors.hexNumber, 0xc084fc);
  });

  it('should return white stroke for mastered topics (score >= 75)', () => {
    const colors = getNodeObsidianColors(baseNode, 80, false, true);
    assert.strictEqual(colors.stroke, '#ffffff');
  });
});
