export interface GeneratedQuestion {
  statement: string;
  alternatives: { letter: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export type QuestionType = 'MULTIPLE_4' | 'MULTIPLE_5' | 'TRUE_FALSE' | 'ESSAY' | 'MIXED';

export interface GenerateQuestionsParams {
  subject: string;
  topic?: string;
  examBoard?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  quantity: number;
  context?: string;
  questionType?: QuestionType;
  cloneStyle?: boolean;
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

export type FlashcardStudyMode = 'standard' | 'cloze';

export interface AdvancedGenerateFlashcardsParams {
  content: string;
  subject?: string;
  count: number;
  mode?: FlashcardStudyMode;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  customFocus?: string;
  previousQuestions?: string[];
}

export interface ErrorRemediationFlashcard {
  front: string;
  back: string;
  type: 'direct' | 'cloze' | 'true_false';
  explanation: string;
}

export interface GenerateErrorRemediationParams {
  question: string;
  userAnswer?: string;
  correctAnswer: string;
  explanation: string;
}

export interface ExamSlicerParams {
  examContent: string;
  answerKeyContent?: string;
  quantity?: number;
}

export interface SlicedQuestion {
  statement: string;
  referenceText?: string | null;
  alternatives: { letter: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface TopicProbabilityAnalysis {
  discipline: string;
  topic: string;
  probability: 'alta' | 'media' | 'baixa';
  justification: string;
}

export interface GenerateFlashcardsParams {
  content: string;
  subject?: string;
  count: number;
}

export interface GenerateSummaryParams {
  content: string;
  subject?: string;
}

export interface AuditQuestion {
  statement: string;
  alternatives: { letter: string; text: string }[];
}

export interface AnswerQuestionsParams {
  questions: AuditQuestion[];
  subject?: string;
}

export interface ExtractQuestionsParams {
  content: string;
  subject?: string;
}

export interface IAIProvider {
  generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]>;
  extractQuestions(params: ExtractQuestionsParams): Promise<GeneratedQuestion[]>;
  gradeEssay(params: GradeEssayParams): Promise<EssayGradeResult>;
  gradeCaseStudy(params: GradeCaseStudyParams): Promise<CaseStudyResult>;
  parseEdital(params: ParseEditalParams): Promise<EditalParseResult>;
  generateTopicContent(params: TopicContentParams): Promise<string>;
  generateFlashcards(params: GenerateFlashcardsParams): Promise<GeneratedFlashcard[]>;
  generateAdvancedFlashcards?(params: AdvancedGenerateFlashcardsParams): Promise<GeneratedFlashcard[]>;
  generateErrorRemediation?(params: GenerateErrorRemediationParams): Promise<ErrorRemediationFlashcard[]>;
  sliceExam?(params: ExamSlicerParams): Promise<SlicedQuestion[]>;
  analyzeTopicProbabilities?(params: { syllabus: EditalSyllabusEntry[]; examBoard: string }): Promise<TopicProbabilityAnalysis[]>;
  generateSummary(params: GenerateSummaryParams): Promise<string>;
  answerQuestions(params: AnswerQuestionsParams): Promise<string[]>;
  mapEditalZion?(editalText: string): Promise<ZionEditalTree>;
  analyzeProbabilitiesZion?(topicsTree: ZionEditalTree, banca: string): Promise<ZionProbabilityItem[]>;
  generateScheduleZion?(input: ZionSchedulePromptParams): Promise<{ weeks: ZionScheduleWeek[] }>;
}


export interface ZionEditalSubject {
  name: string;
  weight: 'alta' | 'media' | 'baixa';
  topics: Array<{
    name: string;
    subtopics: string[];
  }>;
}

export interface ZionEditalTree {
  banca: string;
  cargo: string;
  subjects: ZionEditalSubject[];
}

export interface ZionProbabilityItem {
  subjectName: string;
  topicName: string;
  probability: 'alta' | 'media' | 'baixa';
  justification: string;
}

export interface ZionScheduleDayBlock {
  order?: number;
  subject: string;
  type: 'estudo' | 'revisao' | 'questoes' | 'descanso';
  hours: number;
  priority: 'alta' | 'normal' | 'baixa';
  revision?: string | null;
  revisionNumber?: string | null;
  cardTarget?: number;
  notes?: string | null;
}

export interface ZionScheduleDay {
  date: string;
  dayOfWeek: string;
  type: 'estudo' | 'revisao' | 'simulado' | 'descanso' | 'questoes';
  totalHours: number;
  blocks: ZionScheduleDayBlock[];
  completed?: boolean;
}

export interface ZionScheduleWeek {
  weekNumber: number;
  phase: 'base' | 'intensification' | 'revision';
  theme?: string;
  days: ZionScheduleDay[];
}

export interface ZionSchedulePromptParams {
  subjects: string[];
  examDate: string;
  dailyHours: number;
  performanceData?: Record<string, number> | null;
  probabilityData?: Record<string, string> | null;
  editalFileText?: string | null;
  banca?: string | null;
  userObservations?: string | null;
}
