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
import { AppError } from '../middlewares/error-handler.js';
import {
  buildQuestionsPrompt,
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

export class GeminiProvider implements IAIProvider {
  private readonly apiKey: string;
  private readonly model = 'gemini-2.0-flash';
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const raw = await this.callApi(buildQuestionsPrompt(params));
    const parsed = this.parseJson(raw, 'geração de questões');

    const result = questionsResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de resposta inválido: ${result.error.message}`);
    }

    if (result.data.questions.length < params.quantity) {
      console.warn(`Gemini gerou ${result.data.questions.length} questões, esperava ${params.quantity}`);
    }
    return result.data.questions;
  }

  async gradeEssay(params: GradeEssayParams): Promise<EssayGradeResult> {
    const prompt = buildEssayPrompt(params);

    const raw =
      params.filePath && params.fileMimeType?.startsWith('image/')
        ? await this.callApiWithImage(prompt, params.filePath, params.fileMimeType)
        : await this.callApi(prompt);

    const parsed = this.parseJson(raw, 'correção de redação');
    const result = essayResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de correção inválido: ${result.error.message}`);
    }
    return result.data;
  }

  async gradeCaseStudy(params: GradeCaseStudyParams): Promise<CaseStudyResult> {
    const prompt = buildCaseStudyPrompt(params);

    const raw =
      params.filePath && params.fileMimeType?.startsWith('image/')
        ? await this.callApiWithImage(prompt, params.filePath, params.fileMimeType)
        : await this.callApi(prompt);

    const parsed = this.parseJson(raw, 'correção de estudo de caso');
    const result = caseStudyResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de correção inválido: ${result.error.message}`);
    }
    return result.data;
  }

  async parseEdital(params: ParseEditalParams): Promise<EditalParseResult> {
    const raw = await this.callApi(buildEditalPrompt(truncateEdital(params.content), params.focus));
    const parsed = this.parseJson(raw, 'análise de edital');

    const result = editalResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de análise de edital inválido: ${result.error.message}`);
    }
    return result.data;
  }

  async generateTopicContent(params: TopicContentParams): Promise<string> {
    return this.callApi(buildTopicContentPrompt(params), 2, false);
  }

  async generateSummary(params: GenerateSummaryParams): Promise<string> {
    return this.callApi(buildSummaryPrompt(params), 2, false);
  }

  async answerQuestions(params: AnswerQuestionsParams): Promise<string[]> {
    if (params.questions.length === 0) return [];
    try {
      const raw = await this.callApi(buildAuditPrompt(params));
      const parsed = auditResponseSchema.safeParse(JSON.parse(stripJsonMarkdown(raw)));
      if (!parsed.success) return [];
      return mapAuditAnswers(parsed.data, params.questions.length);
    } catch {
      return [];
    }
  }

  async generateFlashcards(params: GenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
    const raw = await this.callApi(buildFlashcardsPrompt(params));
    const parsed = this.parseJson(raw, 'geração de flashcards');

    const result = flashcardsResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de flashcards inválido: ${result.error.message}`);
    }
    return result.data.flashcards;
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
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64 } },
          ],
        }],
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

  private async callApi(prompt: string, retries = 2, json = true): Promise<string> {
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              ...(json ? { responseMimeType: 'application/json' } : {}),
            },
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          if (response.status === 429 && attempt < retries) {
            await this.delay(2000 * (attempt + 1));
            continue;
          }
          throw new AppError(502, 'AI_API_ERROR', `Gemini API error: ${response.status} — ${errorBody}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new AppError(502, 'AI_EMPTY_RESPONSE', 'Gemini retornou resposta vazia');
        }
        return text;
      } catch (error) {
        if (error instanceof AppError) throw error;
        if (attempt < retries) {
          await this.delay(1000 * (attempt + 1));
          continue;
        }
        throw new AppError(502, 'AI_CONNECTION_ERROR', 'Falha na conexão com a API do Gemini');
      }
    }

    throw new AppError(502, 'AI_MAX_RETRIES', 'Número máximo de tentativas excedido');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
