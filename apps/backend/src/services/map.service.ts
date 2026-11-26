import crypto from 'node:crypto';
import { LRUCache } from 'lru-cache';
import { prisma } from '../database/prisma.js';
import { RelationStatus } from '@prisma/client';
import { AppError } from '../middlewares/error-handler.js';
import { LayoutService } from './layout.service.js';
import {
  HUMAN_TOPIC_LEVEL_LABELS,
  HUMAN_RELATION_LABELS,
  type GraphNodeDTO,
  type GraphEdgeDTO,
  type GraphResponseDTO,
  type UserTopicMasteryDTO,
  type OverlayResponseDTO,
  type TopicFocusDTO,
  type SatelliteFlashcardDTO,
  type SatelliteErrorQuestionDTO,
  type ConnectedTopicDTO,
} from '../dtos/map.dtos.js';
import { HUMAN_MASTERY_LABELS } from './mastery.service.js';
import type { GetGraphQuery, GetOverlayQuery, GetFocusQuery } from '../validators/map.validators.js';

interface CachedGraph {
  readonly response: GraphResponseDTO;
  readonly eTag: string;
}

export class MapService {
  private readonly cache: LRUCache<string, CachedGraph>;
  private readonly layoutService: LayoutService;

  constructor(
    private readonly db: typeof prisma = prisma,
    layoutService?: LayoutService,
  ) {
    this.layoutService = layoutService ?? new LayoutService(db);
    // Cache em memória de subgrafos para latência sub-5ms (TTL de 5 minutos)
    this.cache = new LRUCache<string, CachedGraph>({
      max: 100,
      ttl: 1000 * 60 * 5,
    });
  }

  /**
   * Limpa o cache de grafos (usado quando novas relações ou tópicos são aprovados)
   */
  public invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Constrói o hash SHA-256 determinístico de versão do grafo a partir dos nós e arestas.
   */
  public static computeGraphVersion(
    nodes: readonly { id: string; updatedAt: Date }[],
    edges: readonly { id: string; updatedAt: Date }[],
  ): string {
    const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
    const sortedEdges = [...edges].sort((a, b) => a.id.localeCompare(b.id));

    const content = JSON.stringify({
      nodes: sortedNodes.map((n) => `${n.id}:${n.updatedAt.getTime()}`),
      edges: sortedEdges.map((e) => `${e.id}:${e.updatedAt.getTime()}`),
    });

    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Obtém o grafo canônico compartilhado (nós, arestas aprovadas e metadados de incidência).
   * Sem nenhum dado pessoal do usuário. Altamente cacheável via ETag.
   */
  public async getGraph(params: GetGraphQuery = {}): Promise<{ data: GraphResponseDTO; eTag: string }> {
    const cacheKey = JSON.stringify({
      root: params.rootTopicId || null,
      depth: params.depth || 3,
      disc: params.disciplineId || null,
      board: params.examBoardId || null,
    });

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { data: cached.response, eTag: cached.eTag };
    }

    // Busca todos os tópicos e arestas APROVADAS
    // Regra Inegociável: Apenas relações com status APPROVED entram no grafo público
    const [allTopics, allApprovedRelations, allIncidences] = await Promise.all([
      this.db.topic.findMany({
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        include: {
          incidences: params.examBoardId
            ? { where: { examBoardId: params.examBoardId } }
            : true,
        },
      }),
      this.db.topicRelation.findMany({
        where: {
          status: RelationStatus.APPROVED,
        },
      }),
      this.db.topicIncidence.findMany(),
    ]);

    // Mapeia incidências máximas por tópico
    const incidenceMap = new Map<string, number>();
    for (const inc of allIncidences) {
      if (!params.examBoardId || inc.examBoardId === params.examBoardId) {
        const current = incidenceMap.get(inc.topicId) ?? 0;
        if (inc.weight > current) {
          incidenceMap.set(inc.topicId, inc.weight);
        }
      }
    }

    let filteredTopics = allTopics;

    // Filtro por disciplina específica
    if (params.disciplineId) {
      const topicIdsInDiscipline = new Set<string>();
      const queue = allTopics.filter((t) => t.id === params.disciplineId || t.parentId === params.disciplineId);

      queue.forEach((t) => topicIdsInDiscipline.add(t.id));

      // Coleta transitiva de descendentes
      let addedMore = true;
      while (addedMore) {
        addedMore = false;
        for (const t of allTopics) {
          if (t.parentId && topicIdsInDiscipline.has(t.parentId) && !topicIdsInDiscipline.has(t.id)) {
            topicIdsInDiscipline.add(t.id);
            addedMore = true;
          }
        }
      }

      filteredTopics = allTopics.filter((t) => topicIdsInDiscipline.has(t.id));
    }

    // Filtro por subgrafo local (BFS por profundidade a partir de rootTopicId)
    if (params.rootTopicId) {
      const targetDepth = params.depth ?? 3;
      const visited = new Set<string>([params.rootTopicId]);
      let currentLevel = new Set<string>([params.rootTopicId]);

      // Mapeia adjacências bidirecionais entre tópicos aprovados
      const adjacency = new Map<string, Set<string>>();
      for (const edge of allApprovedRelations) {
        const srcNeighbors = adjacency.get(edge.sourceTopicId) ?? new Set<string>();
        srcNeighbors.add(edge.targetTopicId);
        adjacency.set(edge.sourceTopicId, srcNeighbors);

        const tgtNeighbors = adjacency.get(edge.targetTopicId) ?? new Set<string>();
        tgtNeighbors.add(edge.sourceTopicId);
        adjacency.set(edge.targetTopicId, tgtNeighbors);
      }

      // Adiciona também adjacências de hierarquia (pai/filho)
      for (const t of allTopics) {
        if (t.parentId) {
          const childNeighbors = adjacency.get(t.id) ?? new Set<string>();
          childNeighbors.add(t.parentId);
          adjacency.set(t.id, childNeighbors);

          const parentNeighbors = adjacency.get(t.parentId) ?? new Set<string>();
          parentNeighbors.add(t.id);
          adjacency.set(t.parentId, parentNeighbors);
        }
      }

      for (let d = 0; d < targetDepth; d++) {
        const nextLevel = new Set<string>();
        for (const nodeId of currentLevel) {
          const neighbors = adjacency.get(nodeId);
          if (neighbors) {
            for (const neighbor of neighbors) {
              if (!visited.has(neighbor)) {
                visited.add(neighbor);
                nextLevel.add(neighbor);
              }
            }
          }
        }
        currentLevel = nextLevel;
      }

      filteredTopics = filteredTopics.filter((t) => visited.has(t.id));
    }

    const visibleNodeIds = new Set(filteredTopics.map((t) => t.id));

    // Arestas cujos dois vértices estejam visíveis
    const filteredEdges = allApprovedRelations.filter(
      (e) => visibleNodeIds.has(e.sourceTopicId) && visibleNodeIds.has(e.targetTopicId),
    );

    const graphVersion = MapService.computeGraphVersion(filteredTopics, filteredEdges);

    // Obtém ou calcula posições determinísticas estáveis (Fase 3)
    const positions = await this.layoutService.getOrComputePositions(
      graphVersion,
      filteredTopics.map((t) => ({ id: t.id, parentId: t.parentId, level: t.level, subjectId: t.subjectId })),
      filteredEdges.map((e) => ({ id: e.id, source: e.sourceTopicId, target: e.targetTopicId })),
    );

    // DTOs estritos com allowlist e coordenadas prontas
    const nodes: GraphNodeDTO[] = filteredTopics.map((t) => {
      const pos = positions.get(t.id) ?? { x: 0, y: 0 };
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        level: t.level,
        levelLabel: HUMAN_TOPIC_LEVEL_LABELS[t.level] ?? 'Tópico',
        order: t.order,
        description: t.description,
        parentId: t.parentId,
        subjectId: t.subjectId,
        incidenceWeight: incidenceMap.get(t.id) ?? 1.0,
        x: pos.x,
        y: pos.y,
      };
    });

    const edges: GraphEdgeDTO[] = filteredEdges.map((e) => ({
      id: e.id,
      source: e.sourceTopicId,
      target: e.targetTopicId,
      type: e.type,
      typeLabel: HUMAN_RELATION_LABELS[e.type] ?? 'Conexão',
      evidence: e.evidence,
      sourceRef: e.source,
      confidence: e.confidence,
    }));

    const eTag = `W/"graph-${graphVersion}-${nodes.length}-${edges.length}"`;

    const response: GraphResponseDTO = {
      graphVersion,
      nodes,
      edges,
      totalNodes: nodes.length,
      totalEdges: edges.length,
    };

    this.cache.set(cacheKey, { response, eTag });
    return { data: response, eTag };
  }

  /**
   * Obtém o overlay privado do usuário autenticado (domínio, estado, prioridade e flashcards vencidos).
   * Estritamente isolado por userId.
   */
  public async getOverlay(userId: string, params: GetOverlayQuery = {}): Promise<OverlayResponseDTO> {
    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Usuário não autenticado.');
    }

    const [allTopics, userMasteries] = await Promise.all([
      this.db.topic.findMany({
        where: params.disciplineId ? { subjectId: params.disciplineId } : undefined,
        select: { id: true },
      }),
      this.db.userTopicMastery.findMany({
        where: {
          userId,
          topic: params.disciplineId ? { subjectId: params.disciplineId } : undefined,
        },
      }),
    ]);

    const masteriesRecord: Record<string, UserTopicMasteryDTO> = {};
    let studiedCount = 0;
    let masteredCount = 0;

    for (const m of userMasteries) {
      if (m.state !== 'NOT_STARTED') {
        studiedCount += 1;
      }
      if (m.state === 'MASTERED') {
        masteredCount += 1;
      }

      masteriesRecord[m.topicId] = {
        topicId: m.topicId,
        masteryScore: m.masteryScore,
        state: m.state,
        stateLabel: HUMAN_MASTERY_LABELS[m.state] ?? 'Não estudado',
        accuracy: m.accuracy,
        attemptsCount: m.attemptsCount,
        correctCount: m.correctCount,
        dueFlashcardsCount: m.dueFlashcardsCount,
        priorityScore: m.priorityScore,
        lastAttemptAt: m.lastAttemptAt ? m.lastAttemptAt.toISOString() : null,
        calculatedAt: m.calculatedAt.toISOString(),
      };
    }

    const totalTopics = allTopics.length;
    const globalCoverage = totalTopics > 0 ? Number(((studiedCount / totalTopics) * 100).toFixed(1)) : 0;

    return {
      masteries: masteriesRecord,
      summary: {
        totalTopics,
        studiedTopics: studiedCount,
        masteredTopics: masteredCount,
        globalCoveragePercentage: globalCoverage,
      },
    };
  }

  /**
   * Obtém o conteúdo e os satélites de um tópico específico em foco.
   * Retorna resumo do tópico, flashcards vencidos, histórico de questões erradas e conexões imediatas.
   * Satélites estritamente isolados pelo userId autenticado.
   */
  public async getFocus(userId: string, topicId: string, query: GetFocusQuery = {}): Promise<TopicFocusDTO> {
    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Usuário não autenticado.');
    }

    const cardsLimit = query.cardsLimit ?? 5;
    const errorsLimit = query.errorsLimit ?? 5;
    const relationsLimit = query.relationsLimit ?? 10;
    const now = new Date();

    const topic = await this.db.topic.findUnique({
      where: { id: topicId },
      include: {
        incidences: { take: 1 },
      },
    });

    if (!topic) {
      throw new AppError(404, 'TOPIC_NOT_FOUND', `Tópico com ID ${topicId} não encontrado.`);
    }

    // Busca concorrente dos satélites isolados por usuário
    const [dueCards, dueCardsCount, errorAttempts, errorAttemptsCount, approvedRelations] = await Promise.all([
      // Flashcards vencidos do aluno para este tópico
      this.db.flashcard.findMany({
        where: {
          userId,
          topicId,
          nextReview: { lte: now },
        },
        orderBy: { nextReview: 'asc' },
        take: cardsLimit,
        select: {
          id: true,
          front: true,
          back: true,
          nextReview: true,
        },
      }),
      this.db.flashcard.count({
        where: {
          userId,
          topicId,
          nextReview: { lte: now },
        },
      }),
      // Questões que o aluno errou neste tópico
      this.db.questionAttempt.findMany({
        where: {
          userId,
          isCorrect: false,
          question: { topicId },
        },
        orderBy: { createdAt: 'desc' },
        take: errorsLimit,
        select: {
          id: true,
          answer: true,
          isCorrect: true,
          createdAt: true,
          question: {
            select: {
              statement: true,
            },
          },
        },
      }),
      this.db.questionAttempt.count({
        where: {
          userId,
          isCorrect: false,
          question: { topicId },
        },
      }),
      // Conexões com outros tópicos (somente APPROVED)
      this.db.topicRelation.findMany({
        where: {
          status: RelationStatus.APPROVED,
          OR: [{ sourceTopicId: topicId }, { targetTopicId: topicId }],
        },
        take: relationsLimit,
        include: {
          sourceTopic: { select: { id: true, name: true, level: true } },
          targetTopic: { select: { id: true, name: true, level: true } },
        },
      }),
    ]);

    const connectedTopics: ConnectedTopicDTO[] = approvedRelations.map((rel) => {
      const isOutgoing = rel.sourceTopicId === topicId;
      const other = isOutgoing ? rel.targetTopic : rel.sourceTopic;
      return {
        id: other.id,
        name: other.name,
        level: other.level,
        levelLabel: HUMAN_TOPIC_LEVEL_LABELS[other.level] ?? 'Tópico',
        relationType: rel.type,
        relationLabel: HUMAN_RELATION_LABELS[rel.type] ?? 'Conexão',
        direction: isOutgoing ? 'outgoing' : 'incoming',
        evidence: rel.evidence,
      };
    });

    const topicPos = await this.db.topicLayoutPosition.findFirst({
      where: { topicId },
      select: { x: true, y: true },
    });

    const topicDTO: GraphNodeDTO = {
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
      level: topic.level,
      levelLabel: HUMAN_TOPIC_LEVEL_LABELS[topic.level] ?? 'Tópico',
      order: topic.order,
      description: topic.description,
      parentId: topic.parentId,
      subjectId: topic.subjectId,
      incidenceWeight: topic.incidences[0]?.weight ?? 1.0,
      x: topicPos?.x ?? 0,
      y: topicPos?.y ?? 0,
    };

    const dueFlashcardsDTO: SatelliteFlashcardDTO[] = dueCards.map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
      nextReview: c.nextReview.toISOString(),
    }));

    const errorQuestionsDTO: SatelliteErrorQuestionDTO[] = errorAttempts.map((a) => ({
      id: a.id,
      statement: a.question.statement,
      userAnswer: a.answer,
      isCorrect: a.isCorrect,
      attemptedAt: a.createdAt.toISOString(),
    }));

    return {
      topic: topicDTO,
      satellites: {
        dueFlashcards: dueFlashcardsDTO,
        errorQuestions: errorQuestionsDTO,
        connectedTopics,
        dueFlashcardsTotal: dueCardsCount,
        errorQuestionsTotal: errorAttemptsCount,
      },
    };
  }
}

export const mapService = new MapService();
