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
  buildSummaryPrompt,
  buildAuditPrompt,
  auditResponseSchema,
  mapAuditAnswers,
  questionsResponseSchema,
  essayResponseSchema,
  caseStudyResponseSchema,
  editalResponseSchema,
  flashcardsResponseSchema,
  truncateEdital,
  stripJsonMarkdown,
} from './ai-prompts.js';

export class OpenAIProvider implements IAIProvider {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string = 'gpt-4o-mini',
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const raw = await this.callChat(buildQuestionsPrompt(params), { json: true });
    const parsedJson = this.parseJson(raw, 'geração de questões');
    const normalized = this.normalizeQuestions(parsedJson, params.difficulty);
    const parsed = questionsResponseSchema.safeParse(normalized);
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de resposta inválido da OpenAI: ${parsed.error.message}`);
    }
    return parsed.data.questions;
  }

  async extractQuestions(params: ExtractQuestionsParams): Promise<GeneratedQuestion[]> {
    const raw = await this.callChat(buildExtractQuestionsPrompt(params.content, params.subject), { json: true });
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
    const raw = await this.callChat(
      buildEssayPrompt(params),
      { json: true, filePath: params.filePath, mimeType: params.fileMimeType },
    );
    const parsed = essayResponseSchema.safeParse(this.parseJson(raw, 'correção de redação'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de correção inválido da OpenAI: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  async gradeCaseStudy(params: GradeCaseStudyParams): Promise<CaseStudyResult> {
    const raw = await this.callChat(
      buildCaseStudyPrompt(params),
      { json: true, filePath: params.filePath, mimeType: params.fileMimeType },
    );
    const parsed = caseStudyResponseSchema.safeParse(this.parseJson(raw, 'correção de estudo de caso'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de correção inválido da OpenAI: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  async parseEdital(params: ParseEditalParams): Promise<EditalParseResult> {
    const raw = await this.callChat(buildEditalPrompt(truncateEdital(params.content), params.focus), { json: true });
    const parsed = editalResponseSchema.safeParse(this.parseJson(raw, 'análise de edital'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de análise de edital inválido da OpenAI: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  async generateTopicContent(params: TopicContentParams): Promise<string> {
    return this.callChat(buildTopicContentPrompt(params), { json: false });
  }

  async generateSummary(params: GenerateSummaryParams): Promise<string> {
    return this.callChat(buildSummaryPrompt(params), { json: false });
  }

  async answerQuestions(params: AnswerQuestionsParams): Promise<string[]> {
    if (params.questions.length === 0) return [];
    try {
      const raw = await this.callChat(buildAuditPrompt(params), { json: true });
      const parsed = auditResponseSchema.safeParse(JSON.parse(stripJsonMarkdown(raw)));
      if (!parsed.success) return [];
      return mapAuditAnswers(parsed.data, params.questions.length);
    } catch {
      return [];
    }
  }

  async generateFlashcards(params: GenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
    const raw = await this.callChat(buildFlashcardsPrompt(params), { json: true });
    const parsed = flashcardsResponseSchema.safeParse(this.parseJson(raw, 'geração de flashcards'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de flashcards inválido da OpenAI: ${parsed.error.message}`);
    }
    return parsed.data.flashcards;
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
    options: { json?: boolean; filePath?: string; mimeType?: string } = {},
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
        temperature: 0.7,
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
