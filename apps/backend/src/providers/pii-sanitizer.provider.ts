import type {
  IAIProvider,
  GenerateQuestionsParams,
  GeneratedQuestion,
  GradeEssayParams,
  EssayGradeResult,
  GradeCaseStudyParams,
  CaseStudyResult,
  ParseEditalParams,
  EditalParseResult,
  TopicContentParams,
  GenerateFlashcardsParams,
  GeneratedFlashcard,
  GenerateSummaryParams,
  AnswerQuestionsParams,
  ExtractQuestionsParams,
  AdvancedGenerateFlashcardsParams,
  GenerateErrorRemediationParams,
  ErrorRemediationFlashcard,
  ExamSlicerParams,
  SlicedQuestion,
  EditalSyllabusEntry,
  TopicProbabilityAnalysis,
  ZionEditalTree,
  ZionProbabilityItem,
  ZionScheduleWeek,
  ZionSchedulePromptParams,
} from '../interfaces/ai.interfaces.js';
import { redactPII } from '../utils/ai-pii-redactor.js';

/**
 * Decorator que intercepta chamadas a qualquer provedor de IA (OpenAI, Gemini, Claude, Ollama)
 * e aplica a camada de minimização de dados pessoais (PII) antes da transmissão externa.
 * Atende ao princípio da Minimização de Dados (Art. 6º, III da LGPD).
 */
export class PIISanitizerAIProvider implements IAIProvider {
  constructor(private readonly inner: IAIProvider) {}

  generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const sanitizedParams: GenerateQuestionsParams = {
      ...params,
      context: params.context ? redactPII(params.context) : undefined,
    };
    return this.inner.generateQuestions(sanitizedParams);
  }

  extractQuestions(params: ExtractQuestionsParams): Promise<GeneratedQuestion[]> {
    return this.inner.extractQuestions({
      ...params,
      content: redactPII(params.content),
    });
  }

  gradeEssay(params: GradeEssayParams): Promise<EssayGradeResult> {
    const sanitizedParams: GradeEssayParams = {
      ...params,
      content: params.content ? redactPII(params.content) : undefined,
    };
    return this.inner.gradeEssay(sanitizedParams);
  }

  gradeCaseStudy(params: GradeCaseStudyParams): Promise<CaseStudyResult> {
    const sanitizedParams: GradeCaseStudyParams = {
      ...params,
      content: params.content ? redactPII(params.content) : undefined,
      answerKey: params.answerKey ? redactPII(params.answerKey) : undefined,
      caseStatement: redactPII(params.caseStatement),
    };
    return this.inner.gradeCaseStudy(sanitizedParams);
  }

  parseEdital(params: ParseEditalParams): Promise<EditalParseResult> {
    return this.inner.parseEdital(params);
  }

  generateTopicContent(params: TopicContentParams): Promise<string> {
    return this.inner.generateTopicContent(params);
  }

  generateFlashcards(params: GenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
    return this.inner.generateFlashcards({
      ...params,
      content: redactPII(params.content),
    });
  }

  generateAdvancedFlashcards(params: AdvancedGenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
    if (!this.inner.generateAdvancedFlashcards) {
      throw new Error('generateAdvancedFlashcards não implementado');
    }
    return this.inner.generateAdvancedFlashcards({
      ...params,
      content: redactPII(params.content),
      customFocus: params.customFocus ? redactPII(params.customFocus) : undefined,
    });
  }

  generateErrorRemediation(params: GenerateErrorRemediationParams): Promise<ErrorRemediationFlashcard[]> {
    if (!this.inner.generateErrorRemediation) {
      throw new Error('generateErrorRemediation não implementado');
    }
    return this.inner.generateErrorRemediation({
      ...params,
      question: redactPII(params.question),
      userAnswer: params.userAnswer ? redactPII(params.userAnswer) : undefined,
      explanation: redactPII(params.explanation),
    });
  }

  sliceExam(params: ExamSlicerParams): Promise<SlicedQuestion[]> {
    if (!this.inner.sliceExam) {
      throw new Error('sliceExam não implementado');
    }
    return this.inner.sliceExam(params);
  }

  analyzeTopicProbabilities(params: {
    syllabus: EditalSyllabusEntry[];
    examBoard: string;
  }): Promise<TopicProbabilityAnalysis[]> {
    if (!this.inner.analyzeTopicProbabilities) {
      throw new Error('analyzeTopicProbabilities não implementado');
    }
    return this.inner.analyzeTopicProbabilities(params);
  }

  generateSummary(params: GenerateSummaryParams): Promise<string> {
    return this.inner.generateSummary({
      ...params,
      content: redactPII(params.content),
    });
  }

  answerQuestions(params: AnswerQuestionsParams): Promise<string[]> {
    return this.inner.answerQuestions(params);
  }

  mapEditalZion(editalText: string): Promise<ZionEditalTree> {
    if (!this.inner.mapEditalZion) {
      throw new Error('mapEditalZion não implementado');
    }
    return this.inner.mapEditalZion(editalText);
  }

  analyzeProbabilitiesZion(topicsTree: ZionEditalTree, banca: string): Promise<ZionProbabilityItem[]> {
    if (!this.inner.analyzeProbabilitiesZion) {
      throw new Error('analyzeProbabilitiesZion não implementado');
    }
    return this.inner.analyzeProbabilitiesZion(topicsTree, banca);
  }

  generateScheduleZion(input: ZionSchedulePromptParams): Promise<{ weeks: ZionScheduleWeek[] }> {
    if (!this.inner.generateScheduleZion) {
      throw new Error('generateScheduleZion não implementado');
    }
    return this.inner.generateScheduleZion(input);
  }
}
