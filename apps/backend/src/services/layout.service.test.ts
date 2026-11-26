import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LayoutService,
  createMulberry32,
  type LayoutNodeInput,
  type LayoutEdgeInput,
} from './layout.service.js';

describe('LayoutService — Simulação Headless e Layout Estável (Fase 3)', () => {
  const sampleNodes: LayoutNodeInput[] = [
    // Disciplina 1: Direito Administrativo
    { id: 'top-adm-1', disciplineId: 'disc-adm', level: 'DISCIPLINE' },
    { id: 'top-adm-2', disciplineId: 'disc-adm', level: 'TOPIC' },
    { id: 'top-adm-3', disciplineId: 'disc-adm', level: 'SUBTOPIC' },
    // Disciplina 2: Direito Constitucional
    { id: 'top-const-1', disciplineId: 'disc-const', level: 'DISCIPLINE' },
    { id: 'top-const-2', disciplineId: 'disc-const', level: 'TOPIC' },
    { id: 'top-const-3', disciplineId: 'disc-const', level: 'SUBTOPIC' },
  ];

  const sampleEdges: LayoutEdgeInput[] = [
    { id: 'e1', source: 'top-adm-1', target: 'top-adm-2' },
    { id: 'e2', source: 'top-adm-2', target: 'top-adm-3' },
    { id: 'e3', source: 'top-const-1', target: 'top-const-2' },
    { id: 'e4', source: 'top-const-2', target: 'top-const-3' },
    // Relação interdisciplinar
    { id: 'e5', source: 'top-const-1', target: 'top-adm-1' },
  ];

  describe('createMulberry32 (PRNG Determinístico)', () => {
    it('deve produzir exatamente a mesma sequência de números para a mesma semente', () => {
      const rng1 = createMulberry32(42);
      const rng2 = createMulberry32(42);

      const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

      assert.deepEqual(seq1, seq2);
    });

    it('deve produzir sequências distintas para sementes diferentes', () => {
      const rngA = createMulberry32(100);
      const rngB = createMulberry32(200);

      assert.notEqual(rngA(), rngB());
    });
  });

  describe('computePureLayout (Determinismo e Repouso)', () => {
    it('deve gerar exatamente as mesmas coordenadas para a mesma entrada (Determinismo Estrito)', () => {
      const layout1 = LayoutService.computePureLayout(sampleNodes, sampleEdges);
      const layout2 = LayoutService.computePureLayout(sampleNodes, sampleEdges);

      assert.equal(layout1.length, sampleNodes.length);
      assert.equal(layout2.length, sampleNodes.length);

      for (let i = 0; i < layout1.length; i++) {
        assert.equal(layout1[i].topicId, layout2[i].topicId);
        assert.equal(layout1[i].x, layout2[i].x, `Coordenada X divergente para nó ${layout1[i].topicId}`);
        assert.equal(layout1[i].y, layout2[i].y, `Coordenada Y divergente para nó ${layout1[i].topicId}`);
      }
    });

    it('deve retornar lista vazia sem erro para grafo vazio', () => {
      const emptyLayout = LayoutService.computePureLayout([], []);
      assert.deepEqual(emptyLayout, []);
    });

    it('deve agrupar espacialmente nós da mesma disciplina por proximidade euclidiana', () => {
      const layout = LayoutService.computePureLayout(sampleNodes, sampleEdges);
      const posMap = new Map(layout.map((n) => [n.topicId, n]));

      // Distância entre nós da mesma disciplina (Direito Administrativo)
      const pAdm1 = posMap.get('top-adm-1')!;
      const pAdm2 = posMap.get('top-adm-2')!;
      const intraDiscDist = Math.hypot(pAdm1.x - pAdm2.x, pAdm1.y - pAdm2.y);

      // Distância entre nós de disciplinas distintas (Adm 1 vs Const 1)
      const pConst1 = posMap.get('top-const-1')!;
      const interDiscDist = Math.hypot(pAdm1.x - pConst1.x, pAdm1.y - pConst1.y);

      assert.ok(
        interDiscDist > intraDiscDist,
        `Distância entre disciplinas distintas (${interDiscDist.toFixed(1)}) deve ser maior que a distância intra-disciplinar (${intraDiscDist.toFixed(1)})`,
      );
    });

    it('não deve mover os nós pré-existentes ao adicionar um novo nó de forma incremental', () => {
      // 1. Gera layout inicial
      const initialLayout = LayoutService.computePureLayout(sampleNodes, sampleEdges);
      const initialPosMap = new Map(initialLayout.map((n) => [n.topicId, n]));

      // 2. Prepara novo nó com nós existentes fixados com fixedX e fixedY
      const newNodesWithFixed: LayoutNodeInput[] = [
        ...sampleNodes.map((n) => {
          const pos = initialPosMap.get(n.id)!;
          return {
            ...n,
            fixedX: pos.x,
            fixedY: pos.y,
          };
        }),
        // Novo nó adicionado
        { id: 'top-adm-new-4', disciplineId: 'disc-adm', level: 'SUBTOPIC' },
      ];

      const newEdges: LayoutEdgeInput[] = [
        ...sampleEdges,
        { id: 'e6', source: 'top-adm-2', target: 'top-adm-new-4' },
      ];

      // 3. Executa layout incremental
      const updatedLayout = LayoutService.computePureLayout(newNodesWithFixed, newEdges, { iterations: 50 });
      const updatedPosMap = new Map(updatedLayout.map((n) => [n.topicId, n]));

      // 4. Verifica que TODOS os nós pré-existentes mantiveram rigorosamente suas posições originais
      for (const initialNode of sampleNodes) {
        const orig = initialPosMap.get(initialNode.id)!;
        const current = updatedPosMap.get(initialNode.id)!;

        assert.equal(
          current.x,
          orig.x,
          `Nó ${initialNode.id} teve coordenada X alterada indevidamente no layout incremental`,
        );
        assert.equal(
          current.y,
          orig.y,
          `Nó ${initialNode.id} teve coordenada Y alterada indevidamente no layout incremental`,
        );
      }

      // O novo nó deve ter recebido uma posição calculada
      const newNodePos = updatedPosMap.get('top-adm-new-4');
      assert.ok(newNodePos, 'Novo nó deve possuir posição calculada');
      assert.equal(typeof newNodePos.x, 'number');
      assert.equal(typeof newNodePos.y, 'number');
    });
  });
});
