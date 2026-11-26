import { prisma } from '../database/prisma.js';
import type { Prisma, MasteryState } from '@prisma/client';
import { AppError } from '../middlewares/error-handler.js';

/**
 * Interface que representa uma tentativa de resolução para o cálculo puro de domínio.
 */
export interface MasteryAttemptInput {
  isCorrect: boolean;
  createdAt: Date;
  isExamMode?: boolean;
}

/**
 * Parâmetros de calibração matemática do modelo de domínio.
 */
export interface MasteryParameters {
  readonly minAttempts: number;
  readonly minSampleBuffer: number;
  readonly priorAccuracy: number;
  readonly halfLifeDays: number;
  readonly masteryThreshold: number;
  readonly penaltyPerDueCard: number;
  readonly weightRegular: number;
  readonly weightExam: number;
}

/**
 * Valores padrão recomendados para o cálculo de domínio.
 */
export const DEFAULT_MASTERY_PARAMS: MasteryParameters = {
  minAttempts: 3,
  minSampleBuffer: 5.0,
  priorAccuracy: 0.50,
  halfLifeDays: 21,
  masteryThreshold: 75.0,
  penaltyPerDueCard: 2.5,
  weightRegular: 1.0,
  weightExam: 1.4,
};

/**
 * Rótulos humanos amigáveis para apresentação (sem enums crus na UI).
 */
export const HUMAN_MASTERY_LABELS: Record<MasteryState, string> = {
  NOT_STARTED: 'Não estudado',
  IN_PROGRESS: 'Em andamento',
  MASTERED: 'Dominado',
};

/**
 * Resultado do cálculo de domínio puro para um tópico.
 */
export interface PureMasteryCalculationResult {
  readonly masteryScore: number;
  readonly state: MasteryState;
  readonly humanState: string;
  readonly accuracy: number;
  readonly attemptsCount: number;
  readonly correctCount: number;
  readonly dueFlashcardsCount: number;
  readonly priorityScore: number;
}

/**
 * Item filho para cálculo puro de agregação hierárquica.
 */
export interface ChildMasteryInput {
  readonly topicId: string;
  readonly masteryScore: number;
  readonly attemptsCount: number;
  readonly weight: number;
}

/**
 * Serviço de Domínio Puro e Orquestração do Overlay do Mapa de Revisão.
 * Aplica os princípios de Clean Architecture: funções matemáticas estritamente puras
 * sem I/O para o cálculo de score, associadas a métodos orquestradores idempotentes.
 */
export class MasteryService {
  constructor(private readonly db: typeof prisma = prisma) {}

  /**
   * Converte o enum interno de estado em rótulo legível em português.
   */
  public static toHumanLabel(state: MasteryState): string {
    return HUMAN_MASTERY_LABELS[state] ?? 'Não estudado';
  }

  /**
   * FUNÇÃO PURA: Calcula o domínio, estado, acurácia e prioridade de revisão.
   * Não realiza nenhuma chamada de banco de dados ou I/O.
   */
  public static calculatePureMastery(
    attempts: readonly MasteryAttemptInput[],
    dueFlashcardsCount = 0,
    incidenceWeight = 1.0,
    referenceDate = new Date(),
    params: MasteryParameters = DEFAULT_MASTERY_PARAMS,
  ): PureMasteryCalculationResult {
    const attemptsCount = attempts.length;
    const dueCount = Math.max(0, dueFlashcardsCount);
    const weight = Math.max(0.1, incidenceWeight);

    // Caso de borda: Sem tentativas
    if (attemptsCount === 0) {
      const priority = Number((weight * 100).toFixed(2));
      return {
        masteryScore: 0.0,
        state: 'NOT_STARTED',
        humanState: HUMAN_MASTERY_LABELS.NOT_STARTED,
        accuracy: 0.0,
        attemptsCount: 0,
        correctCount: 0,
        dueFlashcardsCount: dueCount,
        priorityScore: priority,
      };
    }

    const refTime = referenceDate.getTime();
    let correctCount = 0;
    let weightedCorrectSum = 0;
    let totalWeightSum = 0;

    for (const attempt of attempts) {
      if (attempt.isCorrect) {
        correctCount += 1;
      }

      // Decaimento temporal exponencial com meia-vida (Ebbinghaus)
      const diffMs = Math.max(0, refTime - attempt.createdAt.getTime());
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const timeWeight = Math.exp(-diffDays / params.halfLifeDays);

      // Ponderação pelo tipo de modo (Simulado vs Estudo Regular)
      const modeMultiplier = attempt.isExamMode ? params.weightExam : params.weightRegular;
      const finalWeight = timeWeight * modeMultiplier;

      totalWeightSum += finalWeight;
      if (attempt.isCorrect) {
        weightedCorrectSum += finalWeight;
      }
    }

    // Acurácia ponderada recente (0.0 a 1.0)
    const accuracy = totalWeightSum > 0 ? weightedCorrectSum / totalWeightSum : 0.0;

    // Amortecedor Bayesiano para pequenas amostras
    const bayesianAccuracy =
      (attemptsCount / (attemptsCount + params.minSampleBuffer)) * accuracy +
      (params.minSampleBuffer / (attemptsCount + params.minSampleBuffer)) * params.priorAccuracy;

    const baseScore = bayesianAccuracy * 100;

    // Penalidade por flashcards vencidos
    const penalty = dueCount * params.penaltyPerDueCard;
    const finalScore = Math.max(0, Math.min(100, Number((baseScore - penalty).toFixed(2))));

    // Amostra mínima para transição de estado
    let state: MasteryState;
    if (attemptsCount < params.minAttempts) {
      state = 'NOT_STARTED';
    } else if (finalScore >= params.masteryThreshold) {
      state = 'MASTERED';
    } else {
      state = 'IN_PROGRESS';
    }

    const gap = 100 - finalScore;
    const priorityScore = Number((weight * gap).toFixed(2));

    return {
      masteryScore: finalScore,
      state,
      humanState: HUMAN_MASTERY_LABELS[state],
      accuracy: Number(accuracy.toFixed(4)),
      attemptsCount,
      correctCount,
      dueFlashcardsCount: dueCount,
      priorityScore,
    };
  }

  /**
   * FUNÇÃO PURA: Agrega hierarquicamente os scores dos tópicos filhos para o tópico pai.
   * Não realiza I/O.
   */
  public static aggregateHierarchyPure(
    children: readonly ChildMasteryInput[],
    parentIncidenceWeight = 1.0,
    params: MasteryParameters = DEFAULT_MASTERY_PARAMS,
  ): PureMasteryCalculationResult {
    if (children.length === 0) {
      return {
        masteryScore: 0.0,
        state: 'NOT_STARTED',
        humanState: HUMAN_MASTERY_LABELS.NOT_STARTED,
        accuracy: 0.0,
        attemptsCount: 0,
        correctCount: 0,
        dueFlashcardsCount: 0,
        priorityScore: Number((parentIncidenceWeight * 100).toFixed(2)),
      };
    }

    let totalWeightedScore = 0;
    let totalChildWeight = 0;
    let totalAttempts = 0;

    for (const child of children) {
      const childWeight = Math.max(0.1, child.weight);
      totalWeightedScore += child.masteryScore * childWeight;
      totalChildWeight += childWeight;
      totalAttempts += child.attemptsCount;
    }

    const aggregatedScore =
      totalChildWeight > 0 ? Number((totalWeightedScore / totalChildWeight).toFixed(2)) : 0.0;

    let state: MasteryState;
    if (totalAttempts < params.minAttempts) {
      state = 'NOT_STARTED';
    } else if (aggregatedScore >= params.masteryThreshold) {
      state = 'MASTERED';
    } else {
      state = 'IN_PROGRESS';
    }

    const gap = 100 - aggregatedScore;
    const priorityScore = Number((parentIncidenceWeight * gap).toFixed(2));

    return {
      masteryScore: aggregatedScore,
      state,
      humanState: HUMAN_MASTERY_LABELS[state],
      accuracy: Number((aggregatedScore / 100).toFixed(4)),
      attemptsCount: totalAttempts,
      correctCount: 0,
      dueFlashcardsCount: 0,
      priorityScore,
    };
  }

  /**
   * Recalcula o domínio do usuário em um tópico específico e propaga a agregação
   * para todos os seus ancestrais hierárquicos. Idempotente.
   */
  public async recalculateUserTopic(
    userId: string,
    topicId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PureMasteryCalculationResult> {
    const client = tx ?? this.db;

    const topic = await client.topic.findUnique({
      where: { id: topicId },
      include: {
        children: { select: { id: true } },
        incidences: { select: { weight: true } },
      },
    });

    if (!topic) {
      throw new AppError(404, 'TOPIC_NOT_FOUND', `Tópico ${topicId} não encontrado.`);
    }

    const maxIncidence = topic.incidences.length > 0
      ? Math.max(...topic.incidences.map((i) => i.weight))
      : 1.0;

    let calculation: PureMasteryCalculationResult;

    // Se o tópico tem filhos (é disciplina ou agrupador), calcula por agregação hierárquica
    if (topic.children.length > 0) {
      const childrenIds = topic.children.map((c) => c.id);
      const childMasteries = await client.userTopicMastery.findMany({
        where: { userId, topicId: { in: childrenIds } },
        include: { topic: { include: { incidences: true } } },
      });

      const childInputs: ChildMasteryInput[] = childMasteries.map((cm) => {
        const weight = cm.topic.incidences.length > 0
          ? Math.max(...cm.topic.incidences.map((i) => i.weight))
          : 1.0;
        return {
          topicId: cm.topicId,
          masteryScore: cm.masteryScore,
          attemptsCount: cm.attemptsCount,
          weight,
        };
      });

      calculation = MasteryService.aggregateHierarchyPure(childInputs, maxIncidence);
    } else {
      // Tópico folha: busca tentativas de questões vinculadas
      const attempts = await client.questionAttempt.findMany({
        where: {
          userId,
          question: { topicId },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          isCorrect: true,
          createdAt: true,
        },
      });

      // Busca flashcards vencidos vinculados a este tópico
      const now = new Date();
      const dueFlashcardsCount = await client.flashcard.count({
        where: {
          userId,
          topicId,
          nextReview: { lte: now },
        },
      });

      calculation = MasteryService.calculatePureMastery(
        attempts,
        dueFlashcardsCount,
        maxIncidence,
        now,
      );
    }

    // Persistência idempotente via upsert
    await client.userTopicMastery.upsert({
      where: {
        userId_topicId: { userId, topicId },
      },
      create: {
        userId,
        topicId,
        masteryScore: calculation.masteryScore,
        state: calculation.state,
        attemptsCount: calculation.attemptsCount,
        correctCount: calculation.correctCount,
        accuracy: calculation.accuracy,
        dueFlashcardsCount: calculation.dueFlashcardsCount,
        priorityScore: calculation.priorityScore,
        calculatedAt: new Date(),
      },
      update: {
        masteryScore: calculation.masteryScore,
        state: calculation.state,
        attemptsCount: calculation.attemptsCount,
        correctCount: calculation.correctCount,
        accuracy: calculation.accuracy,
        dueFlashcardsCount: calculation.dueFlashcardsCount,
        priorityScore: calculation.priorityScore,
        calculatedAt: new Date(),
      },
    });

    // Propagação recursiva idempotente para o pai
    if (topic.parentId) {
      await this.recalculateUserTopic(userId, topic.parentId, client);
    }

    return calculation;
  }

  /**
   * Rotina completa de reconstrução histórica de domínio para um usuário.
   * Suporta modo --dry-run (apenas simula sem gravar no banco).
   */
  public async rebuildAllUserMastery(
    userId: string,
    options: { dryRun?: boolean } = {},
  ): Promise<{ processedTopics: number; updatedRecords: number; dryRun: boolean }> {
    const leafTopics = await this.db.topic.findMany({
      where: {
        children: { none: {} },
      },
      select: { id: true, parentId: true },
    });

    let updatedCount = 0;

    for (const leaf of leafTopics) {
      if (options.dryRun) {
        updatedCount += 1;
      } else {
        await this.recalculateUserTopic(userId, leaf.id);
        updatedCount += 1;
      }
    }

    return {
      processedTopics: leafTopics.length,
      updatedRecords: updatedCount,
      dryRun: Boolean(options.dryRun),
    };
  }
}

export const masteryService = new MasteryService();
