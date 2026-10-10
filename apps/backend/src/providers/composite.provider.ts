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
} from '../interfaces/ai.interfaces.js';

export class CompositeAIProvider implements IAIProvider {
  constructor(
    private readonly bulk: IAIProvider,
    private readonly essay: IAIProvider,
  ) {}

  generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    return this.bulk.generateQuestions(params);
  }

  parseEdital(params: ParseEditalParams): Promise<EditalParseResult> {
    return this.bulk.parseEdital(params);
  }

  generateTopicContent(params: TopicContentParams): Promise<string> {
    return this.bulk.generateTopicContent(params);
  }

  generateFlashcards(params: GenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
    return this.bulk.generateFlashcards(params);
  }

  generateSummary(params: GenerateSummaryParams): Promise<string> {
    return this.bulk.generateSummary(params);
  }

  answerQuestions(params: AnswerQuestionsParams): Promise<string[]> {
    return this.bulk.answerQuestions(params);
  }

  gradeEssay(params: GradeEssayParams): Promise<EssayGradeResult> {
    return this.essay.gradeEssay(params);
  }

  gradeCaseStudy(params: GradeCaseStudyParams): Promise<CaseStudyResult> {
    return this.essay.gradeCaseStudy(params);
  }
}
