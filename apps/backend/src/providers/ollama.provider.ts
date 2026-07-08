import type {
  IAIProvider,
  GenerateQuestionsParams,
  GeneratedQuestion,
  GradeEssayParams,
  EssayGradeResult,
  ParseEditalParams,
  EditalParseResult,
} from '../interfaces/ai.interfaces.js';
import { AppError } from '../middlewares/error-handler.js';
import {
  buildQuestionsPrompt,
  buildEssayPrompt,
  buildEditalPrompt,
  questionsResponseSchema,
  essayResponseSchema,
  editalResponseSchema,
  truncateEdital,
  stripJsonMarkdown,
} from './ai-prompts.js';

// Modelos locais têm contexto menor que os de API — trunca o edital mais cedo
const OLLAMA_EDITAL_MAX_CHARS = 60000;
const REQUEST_TIMEOUT_MS = 10 * 60 * 1000;

export class OllamaProvider implements IAIProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
  ) {}

  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const raw = await this.callApi(buildQuestionsPrompt(params));
    const parsed = this.parseJson(raw, 'geração de questões');

    const result = questionsResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de resposta inválido do modelo local: ${result.error.message}`);
    }
    return result.data.questions;
  }

  async gradeEssay(params: GradeEssayParams): Promise<EssayGradeResult> {
    if (!params.content && params.fileMimeType?.startsWith('image/')) {
      throw new AppError(
        400,
        'IMAGE_NOT_SUPPORTED',
        'O modelo de IA local não lê imagens. Envie a redação em PDF com texto ou digite o conteúdo.',
      );
    }

    const raw = await this.callApi(buildEssayPrompt(params));
    const parsed = this.parseJson(raw, 'correção de redação');

    const result = essayResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de correção inválido do modelo local: ${result.error.message}`);
    }
    return result.data;
  }

  async parseEdital(params: ParseEditalParams): Promise<EditalParseResult> {
    const content = truncateEdital(params.content, OLLAMA_EDITAL_MAX_CHARS);
    const raw = await this.callApi(buildEditalPrompt(content));
    const parsed = this.parseJson(raw, 'análise de edital');

    const result = editalResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de análise de edital inválido do modelo local: ${result.error.message}`);
    }
    return result.data;
  }

  private async callApi(prompt: string): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: 'json',
          options: { temperature: 0.7, num_ctx: 32768 },
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } catch {
      throw new AppError(
        502,
        'AI_CONNECTION_ERROR',
        `Não foi possível conectar ao Ollama em ${this.baseUrl}. Verifique se o Ollama está em execução (ollama serve).`,
      );
    }

    if (!response.ok) {
      const body = await response.text();
      throw new AppError(502, 'AI_API_ERROR', `Erro do Ollama: ${response.status} — ${body}`);
    }

    const data = (await response.json()) as { message?: { content?: string } };
    const text = data.message?.content;
    if (!text) {
      throw new AppError(502, 'AI_EMPTY_RESPONSE', 'O modelo local retornou resposta vazia');
    }
    return text;
  }

  private parseJson(raw: string, context: string): unknown {
    try {
      return JSON.parse(stripJsonMarkdown(raw));
    } catch {
      throw new AppError(502, 'AI_INVALID_JSON', `O modelo local retornou JSON inválido na ${context}`);
    }
  }
}
