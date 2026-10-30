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
  AdvancedGenerateFlashcardsParams,
  GenerateErrorRemediationParams,
  ErrorRemediationFlashcard,
  ExamSlicerParams,
  SlicedQuestion,
  TopicProbabilityAnalysis,
  EditalSyllabusEntry,
  GenerateSummaryParams,
  AnswerQuestionsParams,
  ExtractQuestionsParams,
} from '../interfaces/ai.interfaces.js';
import { AppError } from '../middlewares/error-handler.js';
import {
  buildQuestionsPrompt,
  buildExtractQuestionsPrompt,
  buildEssayPrompt,
  buildCaseStudyPrompt,
  buildEditalPrompt,
  buildTopicContentPrompt,
  buildFlashcardsPrompt,
  buildAdvancedFlashcardsPrompt,
  buildErrorRemediationPrompt,
  buildExamSlicerPrompt,
  buildTopicProbabilityPrompt,
  buildSummaryPrompt,
  buildAuditPrompt,
  auditResponseSchema,
  mapAuditAnswers,
  questionsResponseSchema,
  examSlicerResponseSchema,
  errorRemediationResponseSchema,
  topicProbabilityResponseSchema,
  essayResponseSchema,
  caseStudyResponseSchema,
  editalResponseSchema,
  flashcardsResponseSchema,
  truncateEdital,
  stripJsonMarkdown,
} from './ai-prompts.js';
import { CircuitBreaker } from './resilience/circuit-breaker.js';
import { ConcurrencyQueue } from './resilience/concurrency-queue.js';
import { RetryStrategy } from './resilience/retry-strategy.js';

export class GeminiProvider implements IAIProvider {
  private readonly apiKey: string;
  private readonly model = 'gemini-2.0-flash';
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly circuitBreaker: CircuitBreaker;
  private readonly queue: ConcurrencyQueue;
  private readonly retryStrategy: RetryStrategy;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.circuitBreaker = new CircuitBreaker('gemini-provider', { failureThreshold: 3, timeoutMs: 30000 });
    this.queue = new ConcurrencyQueue({ maxConcurrent: 4, timeoutMs: 60000 });
    this.retryStrategy = new RetryStrategy({ maxAttempts: 3, initialDelayMs: 1500 });
  }

  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const raw = await this.executeResilient(() => this.callApi(buildQuestionsPrompt(params)));
    const parsed = this.parseJson(raw, 'geração de questões');

    const result = questionsResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de resposta inválido: ${result.error.message}`);
    }

    return result.data.questions;
  }

  async extractQuestions(params: ExtractQuestionsParams): Promise<GeneratedQuestion[]> {
    const raw = await this.executeResilient(() =>
      this.callApi(buildExtractQuestionsPrompt(params.content, params.subject)),
    );
    const parsed = this.parseJson(raw, 'extração de questões');
    const result = questionsResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de resposta inválido: ${result.error.message}`);
    }
    return result.data.questions;
  }

  async gradeEssay(params: GradeEssayParams): Promise<EssayGradeResult> {
    const prompt = buildEssayPrompt(params);
    const { filePath, fileMimeType } = params;

    const raw =
      filePath && fileMimeType?.startsWith('image/')
        ? await this.executeResilient(() => this.callApiWithImage(prompt, filePath, fileMimeType))
        : await this.executeResilient(() => this.callApi(prompt));

    const parsed = this.parseJson(raw, 'correção de redação');
    const result = essayResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de correção inválido: ${result.error.message}`);
    }
    return result.data;
  }

  async gradeCaseStudy(params: GradeCaseStudyParams): Promise<CaseStudyResult> {
    const prompt = buildCaseStudyPrompt(params);
    const { filePath, fileMimeType } = params;

    const raw =
      filePath && fileMimeType?.startsWith('image/')
        ? await this.executeResilient(() => this.callApiWithImage(prompt, filePath, fileMimeType))
        : await this.executeResilient(() => this.callApi(prompt));

    const parsed = this.parseJson(raw, 'correção de estudo de caso');
    const result = caseStudyResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de estudo de caso inválido: ${result.error.message}`);
    }
    return result.data;
  }

  async parseEdital(params: ParseEditalParams): Promise<EditalParseResult> {
    const truncated = truncateEdital(params.content);
    const prompt = buildEditalPrompt(truncated, params.focus);
    const raw = await this.executeResilient(() => this.callApi(prompt));
    const parsed = this.parseJson(raw, 'análise de edital');

    const result = editalResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de edital inválido: ${result.error.message}`);
    }
    return result.data;
  }

  async generateTopicContent(params: TopicContentParams): Promise<string> {
    return this.executeResilient(() => this.callApi(buildTopicContentPrompt(params), false));
  }

  async generateSummary(params: GenerateSummaryParams): Promise<string> {
    return this.executeResilient(() => this.callApi(buildSummaryPrompt(params), false));
  }

  async answerQuestions(params: AnswerQuestionsParams): Promise<string[]> {
    if (params.questions.length === 0) return [];
    try {
      const raw = await this.executeResilient(() => this.callApi(buildAuditPrompt(params)));
      const parsed = auditResponseSchema.safeParse(JSON.parse(stripJsonMarkdown(raw)));
      if (!parsed.success) return [];
      return mapAuditAnswers(parsed.data, params.questions.length);
    } catch {
      return [];
    }
  }

  async generateFlashcards(params: GenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
    const raw = await this.executeResilient(() => this.callApi(buildFlashcardsPrompt(params)));
    const parsed = this.parseJson(raw, 'geração de flashcards');

    const result = flashcardsResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de flashcards inválido: ${result.error.message}`);
    }
    return result.data.flashcards;
  }

  async generateAdvancedFlashcards(params: AdvancedGenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
    const { prompt, temperature } = buildAdvancedFlashcardsPrompt(params);
    const raw = await this.executeResilient(() => this.callApi(prompt, true, temperature));
    const parsed = this.parseJson(raw, 'geração avançada de flashcards');

    const result = flashcardsResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de flashcards avançados inválido: ${result.error.message}`);
    }
    return result.data.flashcards;
  }

  async generateErrorRemediation(params: GenerateErrorRemediationParams): Promise<ErrorRemediationFlashcard[]> {
    const prompt = buildErrorRemediationPrompt(params);
    const raw = await this.executeResilient(() => this.callApi(prompt, true, 0.4));
    const parsed = this.parseJson(raw, 'geração de flashcards de remediação de erro');

    const result = errorRemediationResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de remediação inválido: ${result.error.message}`);
    }
    return result.data.flashcards;
  }

  async sliceExam(params: ExamSlicerParams): Promise<SlicedQuestion[]> {
    const prompt = buildExamSlicerPrompt(params);
    const raw = await this.executeResilient(() => this.callApi(prompt, true, 0.3));
    const parsed = this.parseJson(raw, 'fatiamento de prova real');

    const result = examSlicerResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de fatiamento de prova inválido: ${result.error.message}`);
    }
    return result.data.questions;
  }

  async analyzeTopicProbabilities(params: {
    syllabus: EditalSyllabusEntry[];
    examBoard: string;
  }): Promise<TopicProbabilityAnalysis[]> {
    const prompt = buildTopicProbabilityPrompt(params);
    const raw = await this.executeResilient(() => this.callApi(prompt, true, 0.3));
    const parsed = this.parseJson(raw, 'análise de probabilidades por banca');

    const result = topicProbabilityResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de probabilidade de tópicos inválido: ${result.error.message}`);
    }
    return result.data.analysis;
  }

  private async executeResilient<T>(action: () => Promise<T>): Promise<T> {
    return this.queue.enqueue(() =>
      this.circuitBreaker.execute(() =>
        this.retryStrategy.execute(action),
      ),
    );
  }

  private parseJson(raw: string, context: string): unknown {
    try {
      return JSON.parse(stripJsonMarkdown(raw));
    } catch {
      throw new AppError(502, 'AI_INVALID_JSON', `Gemini retornou JSON inválido na ${context}`);
    }
  }

  private async callApiWithImage(prompt: string, filePath: string, mimeType: string): Promise<string> {
    const fs = await import('node:fs');
    const base64 = fs.readFileSync(filePath).toString('base64');

    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new AppError(502, 'AI_API_ERROR', `Gemini API error: ${response.status} — ${errorBody}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new AppError(502, 'AI_EMPTY_RESPONSE', 'Gemini retornou resposta vazia');
    }
    return text;
  }

  private async callApi(prompt: string, json = true, temperature = 0.7): Promise<string> {
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          topP: 0.9,
          ...(json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new AppError(502, 'AI_API_ERROR', `Gemini API error: ${response.status} — ${errorBody}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new AppError(502, 'AI_EMPTY_RESPONSE', 'Gemini retornou resposta vazia');
    }
    return text;
  }
}
