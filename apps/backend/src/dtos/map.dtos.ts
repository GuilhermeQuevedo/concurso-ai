import type { TopicLevel, RelationType, MasteryState } from '@prisma/client';

export const HUMAN_TOPIC_LEVEL_LABELS: Record<TopicLevel, string> = {
  DISCIPLINE: 'Disciplina',
  TOPIC: 'Tópico',
  SUBTOPIC: 'Subtópico',
};

export const HUMAN_RELATION_LABELS: Record<RelationType, string> = {
  PREREQUISITE: 'Pré-requisito',
  CONFUSED_WITH: 'Se confunde com',
  CO_OCCURRING: 'Cai junto com',
};

export interface GraphNodeDTO {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly level: TopicLevel;
  readonly levelLabel: string;
  readonly order: number;
  readonly description: string | null;
  readonly parentId: string | null;
  readonly subjectId: string | null;
  readonly incidenceWeight: number;
  readonly x: number;
  readonly y: number;
}

export interface GraphEdgeDTO {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly type: RelationType;
  readonly typeLabel: string;
  readonly evidence: string;
  readonly sourceRef: string | null;
  readonly confidence: number | null;
}

export interface GraphResponseDTO {
  readonly graphVersion: string;
  readonly nodes: readonly GraphNodeDTO[];
  readonly edges: readonly GraphEdgeDTO[];
  readonly totalNodes: number;
  readonly totalEdges: number;
}

export interface UserTopicMasteryDTO {
  readonly topicId: string;
  readonly masteryScore: number;
  readonly state: MasteryState;
  readonly stateLabel: string;
  readonly accuracy: number;
  readonly attemptsCount: number;
  readonly correctCount: number;
  readonly dueFlashcardsCount: number;
  readonly priorityScore: number;
  readonly lastAttemptAt: string | null;
  readonly calculatedAt: string;
}

export interface OverlaySummaryDTO {
  readonly totalTopics: number;
  readonly studiedTopics: number;
  readonly masteredTopics: number;
  readonly globalCoveragePercentage: number;
}

export interface OverlayResponseDTO {
  readonly masteries: Record<string, UserTopicMasteryDTO>;
  readonly summary: OverlaySummaryDTO;
}

export interface SatelliteFlashcardDTO {
  readonly id: string;
  readonly front: string;
  readonly back: string;
  readonly nextReview: string;
}

export interface SatelliteErrorQuestionDTO {
  readonly id: string;
  readonly statement: string;
  readonly userAnswer: string;
  readonly isCorrect: boolean;
  readonly attemptedAt: string;
}

export interface ConnectedTopicDTO {
  readonly id: string;
  readonly name: string;
  readonly level: TopicLevel;
  readonly levelLabel: string;
  readonly relationType: RelationType;
  readonly relationLabel: string;
  readonly direction: 'outgoing' | 'incoming';
  readonly evidence: string;
}

export interface TopicFocusDTO {
  readonly topic: GraphNodeDTO;
  readonly satellites: {
    readonly dueFlashcards: readonly SatelliteFlashcardDTO[];
    readonly errorQuestions: readonly SatelliteErrorQuestionDTO[];
    readonly connectedTopics: readonly ConnectedTopicDTO[];
    readonly dueFlashcardsTotal: number;
    readonly errorQuestionsTotal: number;
  };
}
