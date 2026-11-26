import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MapService } from './map.service.js';
import { RelationStatus, TopicLevel, RelationType, MasteryState } from '@prisma/client';
import { AppError } from '../middlewares/error-handler.js';
import type { prisma } from '../database/prisma.js';

interface TestTopic {
  id: string;
  name: string;
  slug: string;
  level: TopicLevel;
  order: number;
  description: string;
  parentId: string | null;
  subjectId: string;
  updatedAt: Date;
  incidences: Array<{ weight: number }>;
}

interface TestRelation {
  id: string;
  sourceTopicId: string;
  targetTopicId: string;
  type: RelationType;
  evidence: string;
  source?: string;
  status: RelationStatus;
  confidence?: number;
  weight?: number;
  updatedAt: Date;
}

interface TestIncidence {
  id?: string;
  topicId: string;
  examBoardId: string;
  weight: number;
}

interface TestMastery {
  id?: string;
  userId: string;
  topicId: string;
  masteryScore?: number;
  state: MasteryState;
  accuracy?: number;
  attemptsCount?: number;
  correctCount?: number;
  dueFlashcardsCount?: number;
  priorityScore?: number;
  lastAttemptAt?: Date | null;
  calculatedAt?: Date | null;
  score?: number;
  lastReviewedAt?: Date | null;
  nextReviewAt?: Date | null;
}

interface TestFlashcard {
  id: string;
  userId: string;
  topicId: string;
  front: string;
  back: string;
  nextReview: Date;
}

interface TestAttempt {
  id: string;
  userId: string;
  topicId?: string;
  isCorrect: boolean;
  answer?: string;
  userAnswer?: string;
  createdAt: Date;
  question: {
    statement: string;
    explanation?: string;
  };
}

describe('MapService — Contrato e Isolamento Multi-tenant (Fase 2)', () => {
  let mockTopics: TestTopic[];
  let mockRelations: TestRelation[];
  let mockIncidences: TestIncidence[];
  let mockMasteries: TestMastery[];
  let mockFlashcards: TestFlashcard[];
  let mockAttempts: TestAttempt[];
  let mockDb: unknown;
  let service: MapService;

  beforeEach(() => {
    mockTopics = [
      {
        id: 'topic-disc-1',
        name: 'Direito Administrativo',
        slug: 'direito-administrativo',
        level: TopicLevel.DISCIPLINE,
        order: 1,
        description: 'Ramo do direito público',
        parentId: null,
        subjectId: 'subject-1',
        updatedAt: new Date('2026-11-19T10:00:00Z'),
        incidences: [{ weight: 1.5 }],
      },
      {
        id: 'topic-top-1',
        name: 'Atos Administrativos',
        slug: 'atos-administrativos',
        level: TopicLevel.TOPIC,
        order: 2,
        description: 'Manifestação unilateral da Administração',
        parentId: 'topic-disc-1',
        subjectId: 'subject-1',
        updatedAt: new Date('2026-11-19T10:05:00Z'),
        incidences: [{ weight: 1.8 }],
      },
      {
        id: 'topic-sub-1',
        name: 'Atributos do Ato',
        slug: 'atributos-do-ato',
        level: TopicLevel.SUBTOPIC,
        order: 3,
        description: 'Presunção de legitimidade, autoexecutoriedade, tipicidade e imperatividade',
        parentId: 'topic-top-1',
        subjectId: 'subject-1',
        updatedAt: new Date('2026-11-19T10:10:00Z'),
        incidences: [{ weight: 1.2 }],
      },
      {
        id: 'topic-top-2',
        name: 'Poderes Administrativos',
        slug: 'poderes-administrativos',
        level: TopicLevel.TOPIC,
        order: 4,
        description: 'Poder de polícia, hierárquico, disciplinar',
        parentId: 'topic-disc-1',
        subjectId: 'subject-1',
        updatedAt: new Date('2026-11-19T10:15:00Z'),
        incidences: [{ weight: 1.4 }],
      },
    ];

    mockRelations = [
      {
        id: 'rel-1',
        sourceTopicId: 'topic-top-1',
        targetTopicId: 'topic-sub-1',
        type: RelationType.PREREQUISITE,
        evidence: 'A teoria geral dos atos é pré-requisito para o estudo dos atributos.',
        source: 'Doutrina Hely Lopes Meirelles',
        status: RelationStatus.APPROVED, // APROVADA: deve aparecer
        confidence: 0.95,
        updatedAt: new Date('2026-11-19T10:00:00Z'),
      },
      {
        id: 'rel-2',
        sourceTopicId: 'topic-sub-1',
        targetTopicId: 'topic-top-2',
        type: RelationType.CONFUSED_WITH,
        evidence: 'Autoexecutoriedade do ato confunde-se com a exigibilidade do poder de polícia.',
        source: 'Jurisprudência STF',
        status: RelationStatus.DRAFT, // RASCUNHO: NUNCA deve aparecer no grafo público
        confidence: 0.70,
        updatedAt: new Date('2026-11-19T10:00:00Z'),
      },
      {
        id: 'rel-3',
        sourceTopicId: 'topic-top-1',
        targetTopicId: 'topic-top-2',
        type: RelationType.CO_OCCURRING,
        evidence: 'Frequentemente cobrados em conjunto em provas do Cebraspe.',
        source: 'Estatística Cebraspe 2024',
        status: RelationStatus.REJECTED, // REJEITADA: NUNCA deve aparecer
        confidence: 0.40,
        updatedAt: new Date('2026-11-19T10:00:00Z'),
      },
    ];

    mockIncidences = [
      { topicId: 'topic-disc-1', examBoardId: 'board-1', weight: 1.5 },
      { topicId: 'topic-top-1', examBoardId: 'board-1', weight: 1.8 },
      { topicId: 'topic-sub-1', examBoardId: 'board-1', weight: 1.2 },
      { topicId: 'topic-top-2', examBoardId: 'board-1', weight: 1.4 },
    ];

    // Masteries com dados isolados para Usuário A e Usuário B
    mockMasteries = [
      {
        id: 'mast-1',
        userId: 'user-A',
        topicId: 'topic-top-1',
        masteryScore: 85.0,
        state: MasteryState.MASTERED,
        accuracy: 0.85,
        attemptsCount: 20,
        correctCount: 17,
        dueFlashcardsCount: 1,
        priorityScore: 27.0,
        lastAttemptAt: new Date('2026-11-19T09:00:00Z'),
        calculatedAt: new Date('2026-11-19T09:30:00Z'),
      },
      {
        id: 'mast-2',
        userId: 'user-B',
        topicId: 'topic-top-1',
        masteryScore: 20.0,
        state: MasteryState.IN_PROGRESS,
        accuracy: 0.30,
        attemptsCount: 5,
        correctCount: 1,
        dueFlashcardsCount: 4,
        priorityScore: 144.0,
        lastAttemptAt: new Date('2026-11-19T08:00:00Z'),
        calculatedAt: new Date('2026-11-19T08:30:00Z'),
      },
    ];

    mockFlashcards = [
      {
        id: 'card-user-A-1',
        userId: 'user-A',
        topicId: 'topic-top-1',
        front: 'O que é imperatividade?',
        back: 'Atributo pelo qual os atos se impõem a terceiros independentemente de concordância.',
        nextReview: new Date('2026-11-19T08:00:00Z'), // Vencido
      },
      {
        id: 'card-user-B-1',
        userId: 'user-B',
        topicId: 'topic-top-1',
        front: 'Card privado do Usuário B',
        back: 'Resposta do Usuário B',
        nextReview: new Date('2026-11-19T08:00:00Z'), // Vencido do Usuário B
      },
    ];

    mockAttempts = [
      {
        id: 'attempt-user-A-1',
        userId: 'user-A',
        isCorrect: false,
        answer: 'B',
        createdAt: new Date('2026-11-19T09:10:00Z'),
        question: { statement: 'A autoexecutoriedade está presente em todos os atos administrativos.' },
      },
      {
        id: 'attempt-user-B-1',
        userId: 'user-B',
        isCorrect: false,
        answer: 'D',
        createdAt: new Date('2026-11-19T08:10:00Z'),
        question: { statement: 'Enunciado de questão errada pelo Usuário B.' },
      },
    ];

    mockDb = {
      topic: {
        findMany: async () => mockTopics,
        findUnique: async ({ where }: { where: { id: string } }) => {
          const found = mockTopics.find((t) => t.id === where.id);
          return found ? { ...found, incidences: [{ weight: 1.8 }] } : null;
        },
      },
      topicRelation: {
        findMany: async ({
          where,
        }: {
          where?: {
            status?: RelationStatus;
            OR?: Array<{ sourceTopicId?: string; targetTopicId?: string }>;
          };
        } = {}) => {
          return mockRelations
            .filter((r) => {
              if (where?.status && r.status !== where.status) return false;
              if (where?.OR) {
                const matchesSource = where.OR.some((clause) => clause.sourceTopicId === r.sourceTopicId);
                const matchesTarget = where.OR.some((clause) => clause.targetTopicId === r.targetTopicId);
                if (!matchesSource && !matchesTarget) return false;
              }
              return true;
            })
            .map((r) => {
              const sourceTopic = mockTopics.find((t) => t.id === r.sourceTopicId);
              const targetTopic = mockTopics.find((t) => t.id === r.targetTopicId);
              return { ...r, sourceTopic, targetTopic };
            });
        },
      },
      topicIncidence: {
        findMany: async () => mockIncidences,
      },
      userTopicMastery: {
        findMany: async ({ where }: { where: { userId: string } }) => {
          return mockMasteries.filter((m) => m.userId === where.userId);
        },
      },
      flashcard: {
        findMany: async ({ where }: { where: { userId: string; topicId: string } }) => {
          return mockFlashcards.filter((f) => f.userId === where.userId && f.topicId === where.topicId);
        },
        count: async ({ where }: { where: { userId: string; topicId: string } }) => {
          return mockFlashcards.filter((f) => f.userId === where.userId && f.topicId === where.topicId).length;
        },
      },
      questionAttempt: {
        findMany: async ({ where }: { where: { userId: string } }) => {
          return mockAttempts.filter((a) => a.userId === where.userId);
        },
        count: async ({ where }: { where: { userId: string } }) => {
          return mockAttempts.filter((a) => a.userId === where.userId).length;
        },
      },
      topicLayoutPosition: {
        findMany: async () => [],
        findFirst: async () => ({ x: 100, y: 150 }),
        upsert: async () => ({}),
      },
    };

    service = new MapService(mockDb as unknown as typeof prisma);
  });

  describe('getGraph (Grafo Compartilhado)', () => {
    it('deve retornar apenas arestas APROVADAS, ocultando estritamente DRAFT e REJECTED', async () => {
      const { data, eTag } = await service.getGraph();

      assert.equal(data.totalNodes, 4);
      // Das 3 relações, apenas 1 é APPROVED
      assert.equal(data.totalEdges, 1);
      assert.equal(data.edges[0].id, 'rel-1');
      assert.equal(data.edges[0].type, RelationType.PREREQUISITE);
      assert.equal(data.edges[0].typeLabel, 'Pré-requisito');
      assert.ok(eTag.startsWith('W/"graph-'));
    });

    it('deve formatar DTOs com allowlist sem expor campos de sistema', async () => {
      const { data } = await service.getGraph();

      const node = data.nodes[0];
      assert.equal(node.id, 'topic-disc-1');
      assert.equal(node.name, 'Direito Administrativo');
      assert.equal(node.level, TopicLevel.DISCIPLINE);
      assert.equal(node.levelLabel, 'Disciplina');
      assert.equal(typeof node.incidenceWeight, 'number');
    });

    it('deve gerar graphVersion e eTag consistentes e utilizar cache interno', async () => {
      const firstCall = await service.getGraph();
      const secondCall = await service.getGraph();

      assert.equal(firstCall.eTag, secondCall.eTag);
      assert.equal(firstCall.data.graphVersion, secondCall.data.graphVersion);
    });
  });

  describe('getOverlay (Overlay Pessoal & Isolamento Multi-tenant)', () => {
    it('deve retornar dados exclusivos do Usuário A sem vazar dados do Usuário B', async () => {
      const overlayA = await service.getOverlay('user-A');

      assert.ok(overlayA.masteries['topic-top-1']);
      assert.equal(overlayA.masteries['topic-top-1'].masteryScore, 85.0);
      assert.equal(overlayA.masteries['topic-top-1'].state, MasteryState.MASTERED);
      assert.equal(overlayA.masteries['topic-top-1'].stateLabel, 'Dominado');
      assert.equal(overlayA.masteries['topic-top-1'].dueFlashcardsCount, 1);
      assert.equal(overlayA.summary.studiedTopics, 1);
      assert.equal(overlayA.summary.masteredTopics, 1);
    });

    it('deve retornar dados exclusivos do Usuário B sem contaminar com dados do Usuário A', async () => {
      const overlayB = await service.getOverlay('user-B');

      assert.ok(overlayB.masteries['topic-top-1']);
      assert.equal(overlayB.masteries['topic-top-1'].masteryScore, 20.0);
      assert.equal(overlayB.masteries['topic-top-1'].state, MasteryState.IN_PROGRESS);
      assert.equal(overlayB.masteries['topic-top-1'].stateLabel, 'Em andamento');
      assert.equal(overlayB.masteries['topic-top-1'].dueFlashcardsCount, 4);
      assert.equal(overlayB.summary.studiedTopics, 1);
      assert.equal(overlayB.summary.masteredTopics, 0);
    });

    it('deve rejeitar requisição sem userId', async () => {
      await assert.rejects(
        async () => service.getOverlay(''),
        (err: unknown) => err instanceof AppError && err.statusCode === 401 && err.code === 'UNAUTHORIZED',
      );
    });
  });

  describe('getFocus (Satélites em Foco & Isolamento)', () => {
    it('deve retornar satélites de flashcards e erros exclusivamente do Usuário A', async () => {
      const focusA = await service.getFocus('user-A', 'topic-top-1');

      assert.equal(focusA.topic.id, 'topic-top-1');
      assert.equal(focusA.topic.name, 'Atos Administrativos');

      // Satélites de Flashcards: Usuário A tem seu card, mas NÃO vê o do Usuário B
      assert.equal(focusA.satellites.dueFlashcards.length, 1);
      assert.equal(focusA.satellites.dueFlashcards[0].id, 'card-user-A-1');
      assert.equal(focusA.satellites.dueFlashcards[0].front, 'O que é imperatividade?');

      // Satélites de Erros: Usuário A vê apenas sua tentativa errada
      assert.equal(focusA.satellites.errorQuestions.length, 1);
      assert.equal(focusA.satellites.errorQuestions[0].id, 'attempt-user-A-1');
      assert.equal(focusA.satellites.errorQuestions[0].userAnswer, 'B');

      // Conexões aprovadas: deve incluir apenas conexões APPROVED
      assert.equal(focusA.satellites.connectedTopics.length, 1);
      assert.equal(focusA.satellites.connectedTopics[0].id, 'topic-sub-1');
      assert.equal(focusA.satellites.connectedTopics[0].relationLabel, 'Pré-requisito');
    });

    it('deve retornar satélites exclusivamente do Usuário B', async () => {
      const focusB = await service.getFocus('user-B', 'topic-top-1');

      assert.equal(focusB.satellites.dueFlashcards.length, 1);
      assert.equal(focusB.satellites.dueFlashcards[0].id, 'card-user-B-1');
      assert.equal(focusB.satellites.dueFlashcards[0].front, 'Card privado do Usuário B');

      assert.equal(focusB.satellites.errorQuestions.length, 1);
      assert.equal(focusB.satellites.errorQuestions[0].id, 'attempt-user-B-1');
      assert.equal(focusB.satellites.errorQuestions[0].userAnswer, 'D');
    });

    it('deve lançar 404 se o tópico não existir', async () => {
      await assert.rejects(
        async () => service.getFocus('user-A', 'topic-inexistente'),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.code === 'TOPIC_NOT_FOUND',
      );
    });
  });
});
