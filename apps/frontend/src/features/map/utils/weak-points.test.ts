import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateWeakPoints } from './weak-points';
import type { GraphNode, UserTopicMastery } from '../types/map.types';

describe('calculateWeakPoints Utility (FASE 8 — Modos de Valor)', () => {
  const mockNodes: GraphNode[] = [
    {
      id: 'node-1',
      name: 'Controle de Constitucionalidade',
      slug: 'controle-constitucionalidade',
      level: 'TOPIC',
      levelLabel: 'Tópico',
      order: 1,
      description: null,
      parentId: null,
      subjectId: 'sub-1',
      incidenceWeight: 10,
      x: 0,
      y: 0,
    },
    {
      id: 'node-2',
      name: 'Atos Administrativos',
      slug: 'atos-administrativos',
      level: 'TOPIC',
      levelLabel: 'Tópico',
      order: 2,
      description: null,
      parentId: null,
      subjectId: 'sub-2',
      incidenceWeight: 8,
      x: 10,
      y: 10,
    },
    {
      id: 'node-3',
      name: 'Poder Constituinte',
      slug: 'poder-constituinte',
      level: 'TOPIC',
      levelLabel: 'Tópico',
      order: 3,
      description: null,
      parentId: null,
      subjectId: 'sub-1',
      incidenceWeight: 5,
      x: 20,
      y: 20,
    },
  ];

  it('deve priorizar tópicos com alta incidência e baixa taxa de acertos', () => {
    const mockOverlay: Record<string, UserTopicMastery> = {
      'node-1': {
        topicId: 'node-1',
        masteryScore: 20, // lacuna = 80
        state: 'IN_PROGRESS',
        stateLabel: 'Em andamento',
        accuracy: 20,
        attemptsCount: 10,
        correctCount: 2,
        dueFlashcardsCount: 3,
        priorityScore: 0.8,
        lastAttemptAt: null,
        calculatedAt: '2026-11-19T00:00:00Z',
      },
      'node-2': {
        topicId: 'node-2',
        masteryScore: 90, // lacuna = 10
        state: 'MASTERED',
        stateLabel: 'Dominado',
        accuracy: 90,
        attemptsCount: 20,
        correctCount: 18,
        dueFlashcardsCount: 0,
        priorityScore: 0.1,
        lastAttemptAt: null,
        calculatedAt: '2026-11-19T00:00:00Z',
      },
      'node-3': {
        topicId: 'node-3',
        masteryScore: 0, // lacuna = 100
        state: 'NOT_STARTED',
        stateLabel: 'Não iniciado',
        accuracy: 0,
        attemptsCount: 0,
        correctCount: 0,
        dueFlashcardsCount: 0,
        priorityScore: 0.5,
        lastAttemptAt: null,
        calculatedAt: '2026-11-19T00:00:00Z',
      },
    };

    const weakPoints = calculateWeakPoints(mockNodes, mockOverlay, 2);

    assert.equal(weakPoints.length, 2);
    // node-1: peso 10 * lacuna 80 = 800 (maior prioridade)
    assert.equal(weakPoints[0].node.id, 'node-1');
    assert.equal(weakPoints[0].masteryScore, 20);
    // node-3: peso 5 * lacuna 100 = 500
    assert.equal(weakPoints[1].node.id, 'node-3');
    assert.equal(weakPoints[1].masteryScore, 0);
  });

  it('deve retornar lista vazia se não houver nós', () => {
    const result = calculateWeakPoints([], {}, 5);
    assert.deepEqual(result, []);
  });
});
