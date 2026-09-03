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

export interface CaseStudyAspect {
  aspect: string;
  situation: 'correto' | 'parcial' | 'incorreto' | 'ausente';
  points: number;
  maxPoints: number;
  justification: string;
}

export interface CaseStudyResult {
  score: number;
  maxScore: number;
  framing: string;
  aspects: CaseStudyAspect[];
  form: { strengths: string; issues: string; deduction: number };
  penalties: { reason: string; deduction: number }[];
  calculation: string;
  feedback: string[];
}

export interface GradeCaseStudyParams {
  role?: string;
  examBoard?: string;
  caseStatement: string;
  answerKey?: string;
  lineLimit?: number;
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
  focusDisciplines?: string[] | null;
}

export interface ParseEditalParams {
  content: string;
  focus?: string;
}

export interface TopicContentParams {
  discipline: string;
  topic: string;
  examBoard?: string | null;
  focus?: string | null;
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export interface GenerateFlashcardsParams {
  content: string;
  subject?: string;
  count: number;
}

export interface IAIProvider {
  generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]>;
  gradeEssay(params: GradeEssayParams): Promise<EssayGradeResult>;
  gradeCaseStudy(params: GradeCaseStudyParams): Promise<CaseStudyResult>;
  parseEdital(params: ParseEditalParams): Promise<EditalParseResult>;
  generateTopicContent(params: TopicContentParams): Promise<string>;
  generateFlashcards(params: GenerateFlashcardsParams): Promise<GeneratedFlashcard[]>;
}
