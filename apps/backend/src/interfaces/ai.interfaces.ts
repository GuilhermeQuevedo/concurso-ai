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

export interface EssayCriterion {
  score: number;
  maxScore: number;
  comments: string;
}

export interface EssayCriteria {
  cac: EssayCriterion;
  ot: EssayCriterion;
  dlp: EssayCriterion;
}

export interface EssayGradeResult {
  score: number;
  maxScore: number;
  feedback: string;
  criteria: EssayCriteria;
}

export interface GradeEssayParams {
  theme: string;
  content?: string;
  filePath?: string;
  fileMimeType?: string;
}

export interface EditalSyllabusEntry {
  discipline: string;
  topics: string[];
}

export interface EditalParseResult {
  name: string;
  organization: string | null;
  examBoard: string | null;
  role: string | null;
  examDate: string | null;
  syllabus: EditalSyllabusEntry[];
}

export interface ParseEditalParams {
  content: string;
}

export interface IAIProvider {
  generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]>;
  gradeEssay(params: GradeEssayParams): Promise<EssayGradeResult>;
  parseEdital(params: ParseEditalParams): Promise<EditalParseResult>;
}
