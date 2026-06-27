import type { IAIProvider, GenerateQuestionsParams, GeneratedQuestion } from '../interfaces/ai.interfaces.js';
import { AppError } from '../middlewares/error-handler.js';
import { z } from 'zod';

const questionSchema = z.object({
  statement: z.string(),
  alternatives: z.array(z.object({ letter: z.string(), text: z.string() })).min(4).max(5),
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
});

const responseSchema = z.object({
  questions: z.array(questionSchema),
});

export class GeminiProvider implements IAIProvider {
  private readonly apiKey: string;
  private readonly model = 'gemini-2.0-flash';
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const prompt = this.buildPrompt(params);
    const raw = await this.callApi(prompt);
    return this.parseResponse(raw, params.quantity);
  }

  private buildPrompt(params: GenerateQuestionsParams): string {
    const difficultyMap = { EASY: 'fácil', MEDIUM: 'média', HARD: 'difícil' };
    const diffText = params.difficulty ? difficultyMap[params.difficulty] : 'variada';

    const contextBlock = params.context
      ? `\nMATERIAL DE REFERÊNCIA (use como base para elaborar as questões):\n${params.context}\n`
      : '';

    return `Você é um especialista em concursos públicos brasileiros. Gere ${params.quantity} questão(ões) de múltipla escolha sobre "${params.subject}"${params.topic ? `, especificamente sobre "${params.topic}"` : ''}.

${params.examBoard ? `Estilo da banca: ${params.examBoard}. Siga o padrão de elaboração dessa banca.` : ''}
Dificuldade: ${diffText}.
${contextBlock}

REGRAS OBRIGATÓRIAS:
1. Cada questão deve ter exatamente 5 alternativas (A, B, C, D, E)
2. Apenas UMA alternativa correta por questão
3. O enunciado deve ser claro e contextualizado
4. A explicação deve justificar por que a alternativa correta está certa e as outras erradas
5. Use linguagem formal e técnica adequada para concursos
6. Varie a posição da resposta correta entre as questões

Responda APENAS com JSON válido no seguinte formato, sem markdown ou texto adicional:
{
  "questions": [
    {
      "statement": "Enunciado da questão",
      "alternatives": [
        {"letter": "A", "text": "Texto da alternativa A"},
        {"letter": "B", "text": "Texto da alternativa B"},
        {"letter": "C", "text": "Texto da alternativa C"},
        {"letter": "D", "text": "Texto da alternativa D"},
        {"letter": "E", "text": "Texto da alternativa E"}
      ],
      "correctAnswer": "C",
      "explanation": "Explicação detalhada",
      "difficulty": "${params.difficulty ?? 'MEDIUM'}"
    }
  ]
}`;
  }

  private async callApi(prompt: string, retries = 2): Promise<string> {
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
              responseMimeType: 'application/json',
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

  private parseResponse(raw: string, expectedCount: number): GeneratedQuestion[] {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new AppError(502, 'AI_INVALID_JSON', 'Gemini retornou JSON inválido');
    }

    const result = responseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de resposta inválido: ${result.error.message}`);
    }

    if (result.data.questions.length < expectedCount) {
      console.warn(`Gemini gerou ${result.data.questions.length} questões, esperava ${expectedCount}`);
    }

    return result.data.questions;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
