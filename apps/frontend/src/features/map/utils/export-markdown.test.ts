import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSyllabusMarkdown } from './export-markdown';
import type { GraphNode, GraphEdge } from '../types/map.types';

describe('generateSyllabusMarkdown Utility (FASE 8 — Modos de Valor)', () => {
  const mockNodes: GraphNode[] = [
    {
      id: 'd1',
      name: 'Direito Constitucional',
      slug: 'direito-constitucional',
      level: 'DISCIPLINE',
      levelLabel: 'Disciplina',
      order: 1,
      description: null,
      parentId: null,
      subjectId: 'sub-1',
      incidenceWeight: 0,
      x: 0,
      y: 0,
    },
    {
      id: 'n1',
      name: 'Direitos Individuais',
      slug: 'direitos-individuais',
      level: 'TOPIC',
      levelLabel: 'Tópico',
      order: 2,
      description: null,
      parentId: 'd1',
      subjectId: 'sub-1',
      incidenceWeight: 10,
      x: 0,
      y: 10,
    },
    {
      id: 'n2',
      name: 'Remédios Constitucionais',
      slug: 'remedios-constitucionais',
      level: 'SUBTOPIC',
      levelLabel: 'Subtópico',
      order: 3,
      description: null,
      parentId: 'n1',
      subjectId: 'sub-1',
      incidenceWeight: 8,
      x: 5,
      y: 15,
    },
  ];

  const mockEdges: GraphEdge[] = [
    {
      id: 'e1',
      source: 'n1',
      target: 'n2',
      type: 'PREREQUISITE',
      typeLabel: 'Pré-requisito',
      evidence: 'Fundamento para remédios',
      sourceRef: null,
      confidence: 0.95,
    },
  ];

  it('deve gerar markdown estruturado com título, estatísticas e hierarquia', () => {
    const md = generateSyllabusMarkdown(mockNodes, mockEdges, {
      title: 'Edital de Teste',
      includeStats: true,
    });

    assert.ok(md.includes('# Edital de Teste'));
    assert.ok(md.includes('Total de Tópicos:'));
    assert.ok(md.includes('Relações Interdisciplinares:'));
    assert.ok(md.includes('### Direito Constitucional'));
    assert.ok(md.includes('- **Direitos Individuais** [Incidência: 10]'));
    assert.ok(md.includes('  - **Remédios Constitucionais** [Incidência: 8]'));
    assert.ok(md.includes('## Conexões e Relações entre Tópicos'));
    assert.ok(md.includes('- **Direitos Individuais** ➔ **Remédios Constitucionais** (Pré-requisito)'));
  });

  it('não deve conter nenhum dado pessoal de usuário no markdown gerado (LGPD)', () => {
    const md = generateSyllabusMarkdown(mockNodes, mockEdges);
    assert.ok(!md.includes('user'));
    assert.ok(!md.includes('masteryScore'));
    assert.ok(!md.includes('dueFlashcards'));
  });
});
