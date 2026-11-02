export interface TopicCoverage {
  status: 'covered' | 'partial' | 'uncovered';
  matchedDecks: string[];
}

export interface TopicProbability {
  probability: 'alta' | 'media' | 'baixa';
  justification: string;
}

export interface EditalTopic {
  name: string;
  subtopics: string[];
}

export interface EditalSubject {
  name: string;
  weight: 'alta' | 'media' | 'baixa';
  topics: EditalTopic[];
}

export interface EditalTree {
  banca: string;
  cargo: string;
  subjects: EditalSubject[];
}

export interface EditalMap {
  id?: string;
  userId?: string;
  user_id?: string;
  editalName?: string;
  edital_name?: string;
  banca?: string | null;
  cargo?: string | null;
  topicsTree?: EditalTree;
  topics_tree?: EditalTree;
  coverageStatus?: Record<string, TopicCoverage>;
  coverage_status?: Record<string, TopicCoverage>;
  probabilityAnalysis?: Record<string, TopicProbability>;
  probability_analysis?: Record<string, TopicProbability>;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}
