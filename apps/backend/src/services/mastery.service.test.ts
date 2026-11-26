import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MasteryService,
  DEFAULT_MASTERY_PARAMS,
  type MasteryAttemptInput,
  type ChildMasteryInput,
} from './mastery.service.js';

describe('MasteryService — Funções Puras de Domínio (Fase 1)', () => {
  const now = new Date('2026-11-19T12:00:00Z');

  describe('calculatePureMastery', () => {
    it('deve retornar NOT_STARTED e score 0 quando não houver tentativas', () => {
      const result = MasteryService.calculatePureMastery([], 0, 1.0, now);

      assert.equal(result.masteryScore, 0.0);
      assert.equal(result.state, 'NOT_STARTED');
      assert.equal(result.humanState, 'Não estudado');
      assert.equal(result.attemptsCount, 0);
      assert.equal(result.correctCount, 0);
      assert.equal(result.accuracy, 0.0);
      // Prioridade máxima de lacuna = 1.0 * (100 - 0) = 100
      assert.equal(result.priorityScore, 100.0);
    });

    it('deve manter NOT_STARTED quando a amostra for inferior à mínima, mesmo com 100% de acerto', () => {
      const attempts: MasteryAttemptInput[] = [
        { isCorrect: true, createdAt: now },
        { isCorrect: true, createdAt: now },
      ]; // Apenas 2 tentativas (mínimo exigido = 3)

      const result = MasteryService.calculatePureMastery(attempts, 0, 1.0, now);

      assert.equal(result.attemptsCount, 2);
      assert.equal(result.correctCount, 2);
      assert.equal(result.state, 'NOT_STARTED');
      assert.equal(result.humanState, 'Não estudado');
      // Score é calculado com amortecedor Bayesiano, mas estado não avança
      assert.ok(result.masteryScore > 0);
    });

    it('deve transicionar para MASTERED quando houver amostra suficiente com alta acurácia', () => {
      const attempts: MasteryAttemptInput[] = [
        { isCorrect: true, createdAt: now },
        { isCorrect: true, createdAt: now },
        { isCorrect: true, createdAt: now },
        { isCorrect: true, createdAt: now },
        { isCorrect: true, createdAt: now },
        { isCorrect: true, createdAt: now },
      ]; // 6 acertos consecutivos recentes

      const result = MasteryService.calculatePureMastery(attempts, 0, 1.0, now);

      assert.equal(result.attemptsCount, 6);
      assert.equal(result.correctCount, 6);
      assert.ok(result.masteryScore >= DEFAULT_MASTERY_PARAMS.masteryThreshold);
      assert.equal(result.state, 'MASTERED');
      assert.equal(result.humanState, 'Dominado');
    });

    it('deve classificar como IN_PROGRESS quando o desempenho for mediano', () => {
      const attempts: MasteryAttemptInput[] = [
        { isCorrect: true, createdAt: now },
        { isCorrect: false, createdAt: now },
        { isCorrect: true, createdAt: now },
        { isCorrect: false, createdAt: now },
      ]; // 4 tentativas, 50% de acerto

      const result = MasteryService.calculatePureMastery(attempts, 0, 1.0, now);

      assert.equal(result.attemptsCount, 4);
      assert.equal(result.correctCount, 2);
      assert.equal(result.state, 'IN_PROGRESS');
      assert.equal(result.humanState, 'Em andamento');
      assert.ok(result.masteryScore < DEFAULT_MASTERY_PARAMS.masteryThreshold);
    });

    it('deve atribuir maior peso a tentativas recentes em relação a tentativas antigas (decaimento temporal)', () => {
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Cenário A: errou no passado, mas acertou recentemente
      const attemptsRecentSuccess: MasteryAttemptInput[] = [
        { isCorrect: false, createdAt: sixtyDaysAgo },
        { isCorrect: false, createdAt: sixtyDaysAgo },
        { isCorrect: true, createdAt: now },
        { isCorrect: true, createdAt: now },
      ];

      // Cenário B: acertou no passado, mas errou recentemente
      const attemptsOldSuccess: MasteryAttemptInput[] = [
        { isCorrect: true, createdAt: sixtyDaysAgo },
        { isCorrect: true, createdAt: sixtyDaysAgo },
        { isCorrect: false, createdAt: now },
        { isCorrect: false, createdAt: now },
      ];

      const resultRecent = MasteryService.calculatePureMastery(attemptsRecentSuccess, 0, 1.0, now);
      const resultOld = MasteryService.calculatePureMastery(attemptsOldSuccess, 0, 1.0, now);

      assert.ok(
        resultRecent.masteryScore > resultOld.masteryScore,
        `Score recente (${resultRecent.masteryScore}) deve superar score antigo (${resultOld.masteryScore})`,
      );
    });

    it('deve penalizar o score de domínio quando houver flashcards vencidos', () => {
      const attempts: MasteryAttemptInput[] = [
        { isCorrect: true, createdAt: now },
        { isCorrect: true, createdAt: now },
        { isCorrect: true, createdAt: now },
        { isCorrect: true, createdAt: now },
      ];

      const withoutDueCards = MasteryService.calculatePureMastery(attempts, 0, 1.0, now);
      const withDueCards = MasteryService.calculatePureMastery(attempts, 4, 1.0, now);

      const expectedDiff = 4 * DEFAULT_MASTERY_PARAMS.penaltyPerDueCard;
      assert.ok(
        withoutDueCards.masteryScore > withDueCards.masteryScore,
        'Presença de flashcards vencidos deve reduzir o score de domínio',
      );
      assert.equal(
        Number((withoutDueCards.masteryScore - withDueCards.masteryScore).toFixed(1)),
        Number(expectedDiff.toFixed(1)),
      );
    });

    it('deve calcular a prioridade como Incidência × Lacuna', () => {
      const attempts: MasteryAttemptInput[] = [
        { isCorrect: true, createdAt: now },
        { isCorrect: true, createdAt: now },
        { isCorrect: true, createdAt: now },
      ];

      const incidenceWeight = 1.8;
      const result = MasteryService.calculatePureMastery(attempts, 0, incidenceWeight, now);

      const expectedGap = 100 - result.masteryScore;
      const expectedPriority = Number((incidenceWeight * expectedGap).toFixed(2));
      assert.equal(result.priorityScore, expectedPriority);
    });

    it('deve dar maior peso a questões respondidas em modo simulado do que em modo estudo', () => {
      // 3 acertos em modo estudo regular
      const regularAttempts: MasteryAttemptInput[] = [
        { isCorrect: true, createdAt: now, isExamMode: false },
        { isCorrect: false, createdAt: now, isExamMode: false },
        { isCorrect: true, createdAt: now, isExamMode: false },
      ];

      // 3 acertos em modo simulado (mesmas respostas, mas acertos no simulado pesam mais)
      const examAttempts: MasteryAttemptInput[] = [
        { isCorrect: true, createdAt: now, isExamMode: true },
        { isCorrect: false, createdAt: now, isExamMode: false },
        { isCorrect: true, createdAt: now, isExamMode: true },
      ];

      const resRegular = MasteryService.calculatePureMastery(regularAttempts, 0, 1.0, now);
      const resExam = MasteryService.calculatePureMastery(examAttempts, 0, 1.0, now);

      assert.ok(
        resExam.accuracy >= resRegular.accuracy,
        'Acurácia ponderada em modo simulado deve ser maior ou igual',
      );
    });
  });

  describe('aggregateHierarchyPure', () => {
    it('deve retornar NOT_STARTED quando não houver filhos', () => {
      const result = MasteryService.aggregateHierarchyPure([], 1.0);
      assert.equal(result.masteryScore, 0.0);
      assert.equal(result.state, 'NOT_STARTED');
    });

    it('deve calcular a média ponderada dos scores dos filhos com base nas incidências', () => {
      const children: ChildMasteryInput[] = [
        { topicId: 'topic-1', masteryScore: 80.0, attemptsCount: 10, weight: 2.0 },
        { topicId: 'topic-2', masteryScore: 50.0, attemptsCount: 10, weight: 1.0 },
      ];

      // Média ponderada esperada: (80 * 2.0 + 50 * 1.0) / (2.0 + 1.0) = 210 / 3 = 70.0
      const result = MasteryService.aggregateHierarchyPure(children, 1.5);

      assert.equal(result.masteryScore, 70.0);
      assert.equal(result.attemptsCount, 20);
      assert.equal(result.state, 'IN_PROGRESS');
      // Prioridade: 1.5 * (100 - 70) = 1.5 * 30 = 45.0
      assert.equal(result.priorityScore, 45.0);
    });

    it('deve atingir MASTERED se a média ponderada dos filhos atingir o limiar de corte', () => {
      const children: ChildMasteryInput[] = [
        { topicId: 'topic-1', masteryScore: 90.0, attemptsCount: 10, weight: 1.0 },
        { topicId: 'topic-2', masteryScore: 80.0, attemptsCount: 10, weight: 1.0 },
      ];

      // Média esperada: 85.0 (>= 75.0)
      const result = MasteryService.aggregateHierarchyPure(children, 1.0);

      assert.equal(result.masteryScore, 85.0);
      assert.equal(result.state, 'MASTERED');
      assert.equal(result.humanState, 'Dominado');
    });
  });

  describe('toHumanLabel', () => {
    it('deve mapear todos os estados do enum para textos amigáveis em português', () => {
      assert.equal(MasteryService.toHumanLabel('NOT_STARTED'), 'Não estudado');
      assert.equal(MasteryService.toHumanLabel('IN_PROGRESS'), 'Em andamento');
      assert.equal(MasteryService.toHumanLabel('MASTERED'), 'Dominado');
    });
  });
});
