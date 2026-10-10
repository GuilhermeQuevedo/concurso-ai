import { readFileSync } from 'node:fs';

import Anthropic from '@anthropic-ai/sdk';

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
} from '../interfaces/ai.interfaces.js';
import { AppError } from '../middlewares/error-handler.js';
import {
  buildQuestionsPrompt,
  buildEssayPrompt,
  buildCaseStudyPrompt,
  buildEditalPrompt,
  buildTopicContentPrompt,
  buildFlashcardsPrompt,
  questionsResponseSchema,
  essayResponseSchema,
  caseStudyResponseSchema,
  editalResponseSchema,
  flashcardsResponseSchema,
  truncateEdital,
  stripJsonMarkdown,
} from './ai-prompts.js';

const IMAGE_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type ImageMediaType = (typeof IMAGE_MEDIA_TYPES)[number];

function asImageMediaType(mime?: string): ImageMediaType | null {
  return IMAGE_MEDIA_TYPES.includes(mime as ImageMediaType) ? (mime as ImageMediaType) : null;
}

export class ClaudeProvider implements IAIProvider {
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const raw = await this.callText(buildQuestionsPrompt(params));
    const parsed = questionsResponseSchema.safeParse(this.parseJson(raw, 'geração de questões'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de resposta inválido: ${parsed.error.message}`);
    }
    return parsed.data.questions;
  }

  async gradeEssay(params: GradeEssayParams): Promise<EssayGradeResult> {
    const raw = await this.callText(buildEssayPrompt(params), params.filePath, params.fileMimeType);
    const parsed = essayResponseSchema.safeParse(this.parseJson(raw, 'correção de redação'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de correção inválido: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  async gradeCaseStudy(params: GradeCaseStudyParams): Promise<CaseStudyResult> {
    const raw = await this.callText(buildCaseStudyPrompt(params), params.filePath, params.fileMimeType);
    const parsed = caseStudyResponseSchema.safeParse(this.parseJson(raw, 'correção de estudo de caso'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de correção inválido: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  async parseEdital(params: ParseEditalParams): Promise<EditalParseResult> {
    const raw = await this.callText(buildEditalPrompt(truncateEdital(params.content), params.focus));
    const parsed = editalResponseSchema.safeParse(this.parseJson(raw, 'análise de edital'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de análise de edital inválido: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  async generateTopicContent(params: TopicContentParams): Promise<string> {
    return this.callText(buildTopicContentPrompt(params));
  }

  async generateFlashcards(params: GenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
    const raw = await this.callText(buildFlashcardsPrompt(params));
    const parsed = flashcardsResponseSchema.safeParse(this.parseJson(raw, 'geração de flashcards'));
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de flashcards inválido: ${parsed.error.message}`);
    }
    return parsed.data.flashcards;
  }

  private parseJson(raw: string, context: string): unknown {
    try {
      return JSON.parse(stripJsonMarkdown(raw));
    } catch {
      throw new AppError(502, 'AI_INVALID_JSON', `Claude retornou JSON inválido na ${context}`);
    }
  }

  private buildContent(prompt: string, filePath?: string, mimeType?: string): Anthropic.ContentBlockParam[] {
    const imageType = filePath ? asImageMediaType(mimeType) : null;
    if (filePath && imageType) {
      const data = readFileSync(filePath).toString('base64');
      return [
        { type: 'image', source: { type: 'base64', media_type: imageType, data } },
        { type: 'text', text: prompt },
      ];
    }
    return [{ type: 'text', text: prompt }];
  }

  private async callText(prompt: string, filePath?: string, mimeType?: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 8000,
        messages: [{ role: 'user', content: this.buildContent(prompt, filePath, mimeType) }],
      });
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('')
        .trim();
      if (!text) {
        throw new AppError(502, 'AI_EMPTY_RESPONSE', 'Claude retornou resposta vazia');
      }
      return text;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : 'erro desconhecido';
      throw new AppError(502, 'AI_API_ERROR', `Falha na API da Claude: ${message}`);
    }
  }
}
