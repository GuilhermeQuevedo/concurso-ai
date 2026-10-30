import { readFileSync } from 'node:fs';
import OpenAI from 'openai';
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

export class OpenAIProvider implements IAIProvider {
  private readonly client: OpenAI;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly queue: ConcurrencyQueue;
  private readonly retryStrategy: RetryStrategy;

  constructor(
    apiKey: string,
    private readonly model: string = 'gpt-4o-mini',
  ) {
    this.client = new OpenAI({ apiKey });
    this.circuitBreaker = new CircuitBreaker('openai-provider', { failureThreshold: 3, timeoutMs: 30000 });
    this.queue = new ConcurrencyQueue({ maxConcurrent: 4, timeoutMs: 60000 });
    this.retryStrategy = new RetryStrategy({ maxAttempts: 3, initialDelayMs: 1500 });
  }

  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const raw = await this.executeResilient(() => this.callChat(buildQuestionsPrompt(params), { json: true }));
    const parsedJson = this.parseJson(raw, 'geração de questões');
    const normalized = this.normalizeQuestions(parsedJson, params.difficulty);
    const parsed = questionsResponseSchema.safeParse(normalized);
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de resposta inválido da OpenAI: ${parsed.error.message}`);
    }
    return parsed.data.questions;
  }

  async extractQuestions(params: ExtractQuestionsParams): Promise<GeneratedQuestion[]> {
    const raw = await this.executeResilient(() =>
      this.callChat(buildExtractQuestionsPrompt(params.content, params.subject), { json: true }),
    );
    const parsedJson = this.parseJson(raw, 'extração de questões');
    const parsed = questionsResponseSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de resposta inválido da OpenAI: ${parsed.error.message}`);
    }
    return parsed.data.questions;
  }

  private normalizeQuestions(data: unknown, fallbackDifficulty?: 'EASY' | 'MEDIUM' | 'HARD'): unknown {
    if (!data || typeof data !== 'object') return data;
    const record = data as { questions?: unknown[] };
    if (!Array.isArray(record.questions)) return data;

    return {
      ...record,
      questions: record.questions.map((q) => {
        if (!q || typeof q !== 'object') return q;
        const item = q as Record<string, unknown>;
        return {
          difficulty: fallbackDifficulty ?? 'MEDIUM',
          ...item,
        };
      }),
    };
  }

  async gradeEssay(params: GradeEssayParams): Promise<EssayGradeResult> {
    const raw = await this.executeResilient(() =>
      this.callChat(buildEssayPrompt(params), {
        json: true,
        filePath: params.filePath,
        mimeType: params.fileMimeType,
      }),
    );
    const parsed = essayResponseSchema.safeParse(this.parseJson(raw, 'correção de redação'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de correção inválido da OpenAI: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  async gradeCaseStudy(params: GradeCaseStudyParams): Promise<CaseStudyResult> {
    const raw = await this.executeResilient(() =>
      this.callChat(buildCaseStudyPrompt(params), {
        json: true,
        filePath: params.filePath,
        mimeType: params.fileMimeType,
      }),
    );
    const parsed = caseStudyResponseSchema.safeParse(this.parseJson(raw, 'correção de estudo de caso'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de estudo de caso inválido da OpenAI: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  async parseEdital(params: ParseEditalParams): Promise<EditalParseResult> {
    const truncated = truncateEdital(params.content);
    const raw = await this.executeResilient(() =>
      this.callChat(buildEditalPrompt(truncated, params.focus), { json: true }),
    );
    const parsed = editalResponseSchema.safeParse(this.parseJson(raw, 'análise de edital'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de edital inválido da OpenAI: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  async generateTopicContent(params: TopicContentParams): Promise<string> {
    return this.executeResilient(() => this.callChat(buildTopicContentPrompt(params), { json: false }));
  }

  async generateSummary(params: GenerateSummaryParams): Promise<string> {
    return this.executeResilient(() => this.callChat(buildSummaryPrompt(params), { json: false }));
  }

  async answerQuestions(params: AnswerQuestionsParams): Promise<string[]> {
    if (params.questions.length === 0) return [];
    try {
      const raw = await this.executeResilient(() => this.callChat(buildAuditPrompt(params), { json: true }));
      const parsed = auditResponseSchema.safeParse(JSON.parse(stripJsonMarkdown(raw)));
      if (!parsed.success) return [];
      return mapAuditAnswers(parsed.data, params.questions.length);
    } catch {
      return [];
    }
  }

  async generateFlashcards(params: GenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
    const raw = await this.executeResilient(() => this.callChat(buildFlashcardsPrompt(params), { json: true }));
    const parsed = flashcardsResponseSchema.safeParse(this.parseJson(raw, 'geração de flashcards'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de flashcards inválido da OpenAI: ${parsed.error.message}`);
    }
    return parsed.data.flashcards;
  }

  async generateAdvancedFlashcards(params: AdvancedGenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
    const { prompt, temperature } = buildAdvancedFlashcardsPrompt(params);
    const raw = await this.executeResilient(() => this.callChat(prompt, { json: true, temperature }));
    const parsed = flashcardsResponseSchema.safeParse(this.parseJson(raw, 'geração avançada de flashcards'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de flashcards avançados inválido: ${parsed.error.message}`);
    }
    return parsed.data.flashcards;
  }

  async generateErrorRemediation(params: GenerateErrorRemediationParams): Promise<ErrorRemediationFlashcard[]> {
    const prompt = buildErrorRemediationPrompt(params);
    const raw = await this.executeResilient(() => this.callChat(prompt, { json: true, temperature: 0.4 }));
    const parsed = errorRemediationResponseSchema.safeParse(this.parseJson(raw, 'remediação de erro'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de remediação de erro inválido: ${parsed.error.message}`);
    }
    return parsed.data.flashcards;
  }

  async sliceExam(params: ExamSlicerParams): Promise<SlicedQuestion[]> {
    const prompt = buildExamSlicerPrompt(params);
    const raw = await this.executeResilient(() => this.callChat(prompt, { json: true, temperature: 0.3 }));
    const parsed = examSlicerResponseSchema.safeParse(this.parseJson(raw, 'fatiamento de prova'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de fatiamento de prova inválido: ${parsed.error.message}`);
    }
    return parsed.data.questions;
  }

  async analyzeTopicProbabilities(params: {
    syllabus: EditalSyllabusEntry[];
    examBoard: string;
  }): Promise<TopicProbabilityAnalysis[]> {
    const prompt = buildTopicProbabilityPrompt(params);
    const raw = await this.executeResilient(() => this.callChat(prompt, { json: true, temperature: 0.3 }));
    const parsed = topicProbabilityResponseSchema.safeParse(this.parseJson(raw, 'análise de probabilidades'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de probabilidade inválido: ${parsed.error.message}`);
    }
    return parsed.data.analysis;
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
      throw new AppError(502, 'AI_INVALID_JSON', `OpenAI retornou JSON inválido na ${context}`);
    }
  }

  private buildUserMessageContent(
    prompt: string,
    filePath?: string,
    mimeType?: string,
  ): OpenAI.Chat.ChatCompletionContentPart[] | string {
    if (filePath && mimeType?.startsWith('image/')) {
      const base64Data = readFileSync(filePath).toString('base64');
      return [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64Data}`,
            detail: 'high',
          },
        },
      ];
    }
    return prompt;
  }

  private async callChat(
    prompt: string,
    options: { json?: boolean; filePath?: string; mimeType?: string; temperature?: number } = {},
  ): Promise<string> {
    try {
      const content = this.buildUserMessageContent(prompt, options.filePath, options.mimeType);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
        response_format: options.json ? { type: 'json_object' } : undefined,
        temperature: options.temperature ?? 0.7,
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (!text) {
        throw new AppError(502, 'AI_EMPTY_RESPONSE', 'OpenAI retornou resposta vazia');
      }

      return text;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : 'erro desconhecido';
      throw new AppError(502, 'AI_API_ERROR', `Falha na API da OpenAI: ${message}`);
    }
  }
}
