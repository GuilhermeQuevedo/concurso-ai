export interface GeneratedQuestion {
  statement: string;
  alternatives: { letter: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface GenerateQuestionsParams {
  subject: string;
  topic?: string;
  examBoard?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  quantity: number;
  context?: string;
}

export interface IAIProvider {
  generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]>;
}
