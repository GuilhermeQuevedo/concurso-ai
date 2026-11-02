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
  ZionEditalTree,
  ZionProbabilityItem,
  ZionScheduleWeek,
  ZionSchedulePromptParams,
} from '../interfaces/ai.interfaces.js';

export class CompositeAIProvider implements IAIProvider {
  constructor(
    private readonly bulk: IAIProvider,
    private readonly essay: IAIProvider,
  ) {}

  generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    return this.bulk.generateQuestions(params);
  }

  extractQuestions(params: ExtractQuestionsParams): Promise<GeneratedQuestion[]> {
    return this.bulk.extractQuestions(params);
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
  mapEditalZion(editalText: string): Promise<ZionEditalTree> {
    if (this.bulk.mapEditalZion) {
      return this.bulk.mapEditalZion(editalText);
    }
    throw new Error('mapEditalZion não implementado pelo provedor configurado');
  }

  analyzeProbabilitiesZion(topicsTree: ZionEditalTree, banca: string): Promise<ZionProbabilityItem[]> {
    if (this.bulk.analyzeProbabilitiesZion) {
      return this.bulk.analyzeProbabilitiesZion(topicsTree, banca);
    }
    throw new Error('analyzeProbabilitiesZion não implementado pelo provedor configurado');
  }

  generateScheduleZion(input: ZionSchedulePromptParams): Promise<{ weeks: ZionScheduleWeek[] }> {
    if (this.bulk.generateScheduleZion) {
      return this.bulk.generateScheduleZion(input);
    }
    throw new Error('generateScheduleZion não implementado pelo provedor configurado');
  }

}
