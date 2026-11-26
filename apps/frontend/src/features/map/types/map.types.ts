export type TopicLevel = 'DISCIPLINE' | 'TOPIC' | 'SUBTOPIC';
export type RelationType = 'PREREQUISITE' | 'CONFUSED_WITH' | 'CO_OCCURRING';
export type MasteryState = 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';

export interface GraphNode {
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

export interface GraphEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly type: RelationType;
  readonly typeLabel: string;
  readonly evidence: string;
  readonly sourceRef: string | null;
  readonly confidence: number | null;
}

export interface GraphData {
  readonly graphVersion: string;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly totalNodes: number;
  readonly totalEdges: number;
}

export interface UserTopicMastery {
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

export interface OverlaySummary {
  readonly totalTopics: number;
  readonly studiedTopics: number;
  readonly masteredTopics: number;
  readonly globalCoveragePercentage: number;
}

export interface OverlayData {
  readonly masteries: Record<string, UserTopicMastery>;
  readonly summary: OverlaySummary;
}

export interface SatelliteFlashcard {
  readonly id: string;
  readonly front: string;
  readonly back: string;
  readonly nextReview: string;
}

export interface SatelliteErrorQuestion {
  readonly id: string;
  readonly statement: string;
  readonly userAnswer: string;
  readonly isCorrect: boolean;
  readonly attemptedAt: string;
}

export interface ConnectedTopic {
  readonly id: string;
  readonly name: string;
  readonly level: TopicLevel;
  readonly levelLabel: string;
  readonly relationType: RelationType;
  readonly relationLabel: string;
  readonly direction: 'outgoing' | 'incoming';
  readonly evidence: string;
}

export interface TopicFocusData {
  readonly topic: GraphNode;
  readonly satellites: {
    readonly dueFlashcards: readonly SatelliteFlashcard[];
    readonly errorQuestions: readonly SatelliteErrorQuestion[];
    readonly connectedTopics: readonly ConnectedTopic[];
    readonly dueFlashcardsTotal: number;
    readonly errorQuestionsTotal: number;
  };
}
