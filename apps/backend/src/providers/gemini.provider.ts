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
import { z } from 'zod';

const questionSchema = z.object({
  statement: z.string(),
  alternatives: z.array(z.object({ letter: z.string(), text: z.string() })).min(4).max(5),
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
});

const questionsResponseSchema = z.object({
  questions: z.array(questionSchema),
});

const essayCriterionSchema = z.object({
  score: z.number().min(0),
  maxScore: z.number(),
  comments: z.string(),
});

const essayResponseSchema = z.object({
  score: z.number().min(0).max(100),
  maxScore: z.number(),
  feedback: z.string(),
  criteria: z.object({
    cac: essayCriterionSchema,
    ot: essayCriterionSchema,
    dlp: essayCriterionSchema,
  }),
});

const editalResponseSchema = z.object({
  name: z.string(),
  organization: z.string().nullable(),
  examBoard: z.string().nullable(),
  role: z.string().nullable(),
  examDate: z.string().nullable(),
  syllabus: z.array(
    z.object({
      discipline: z.string(),
      topics: z.array(z.string()),
    }),
  ),
});

const EDITAL_MAX_CHARS = 700000;
const EDITAL_HEAD_CHARS = 150000;

export class GeminiProvider implements IAIProvider {
  private readonly apiKey: string;
  private readonly model = 'gemini-2.0-flash';
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const prompt = this.buildQuestionsPrompt(params);
    const raw = await this.callApi(prompt);
    return this.parseQuestionsResponse(raw, params.quantity);
  }

  async gradeEssay(params: GradeEssayParams): Promise<EssayGradeResult> {
    const prompt = this.buildEssayPrompt(params);

    if (params.filePath && params.fileMimeType?.startsWith('image/')) {
      const raw = await this.callApiWithImage(prompt, params.filePath, params.fileMimeType);
      return this.parseEssayResponse(raw);
    }

    const raw = await this.callApi(prompt);
    return this.parseEssayResponse(raw);
  }

  async parseEdital(params: ParseEditalParams): Promise<EditalParseResult> {
    const prompt = this.buildEditalPrompt(this.truncateEdital(params.content));
    const raw = await this.callApi(prompt);
    return this.parseEditalResponse(raw);
  }

  // Em editais longos o conteúdo programático fica nos anexos, no final —
  // ao truncar, preserva o início (dados do concurso) e o final (anexos)
  private truncateEdital(content: string): string {
    if (content.length <= EDITAL_MAX_CHARS) return content;
    const head = content.slice(0, EDITAL_HEAD_CHARS);
    const tail = content.slice(-(EDITAL_MAX_CHARS - EDITAL_HEAD_CHARS));
    return `${head}\n\n[... trecho intermediário do edital omitido ...]\n\n${tail}`;
  }

  private buildEditalPrompt(content: string): string {
    return `Você é um especialista em concursos públicos brasileiros. Analise o texto do edital abaixo e extraia as informações estruturadas.

TEXTO DO EDITAL:
${content}

EXTRAIA:
1. **name** — Nome curto do concurso (órgão + cargo principal), ex: "SEEDF — Professor de Educação Básica"
2. **organization** — Nome completo do órgão realizador
3. **examBoard** — Banca organizadora (ex: CESPE/CEBRASPE, FGV, FCC). null se não encontrar.
4. **role** — Cargo/função principal do edital. null se não encontrar.
5. **examDate** — Data da prova objetiva no formato YYYY-MM-DD. null se não encontrada.
6. **syllabus** — Conteúdo programático COMPLETO: para cada disciplina, liste TODOS os tópicos exatamente como aparecem no edital. Não resuma, não omita tópicos. Separe tópicos compostos em itens individuais quando fizer sentido.

Responda APENAS com JSON válido no seguinte formato, sem markdown ou texto adicional:
{
  "name": "Órgão — Cargo",
  "organization": "Nome completo do órgão",
  "examBoard": "Banca",
  "role": "Cargo",
  "examDate": "2026-10-15",
  "syllabus": [
    {
      "discipline": "Língua Portuguesa",
      "topics": ["Tópico 1", "Tópico 2"]
    }
  ]
}`;
  }

  private parseEditalResponse(raw: string): EditalParseResult {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new AppError(502, 'AI_INVALID_JSON', 'Gemini retornou JSON inválido na análise do edital');
    }

    const result = editalResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de análise de edital inválido: ${result.error.message}`);
    }

    return result.data;
  }

  private buildEssayPrompt(params: GradeEssayParams): string {
    const contentBlock = params.content
      ? `\nREDAÇÃO DO CANDIDATO:\n${params.content}`
      : '\nA redação do candidato está na imagem anexada. Extraia o texto manuscrito/digitado e corrija.';

    return `Você é um corretor experiente de redações para concursos públicos brasileiros (estilo CESPE/CEBRASPE). Corrija a redação abaixo com rigor técnico.

TEMA: "${params.theme}"
${contentBlock}

CRITÉRIOS DE AVALIAÇÃO:
1. **CAC — Conteúdo e Atendimento ao Comando** (0 a 40 pontos): Avalia se o candidato compreendeu e atendeu ao tema/comando da proposta. Analisa a pertinência dos argumentos, a profundidade da abordagem e o uso de repertório sociocultural.
2. **OT — Organização Textual** (0 a 30 pontos): Avalia a estrutura dissertativo-argumentativa (introdução, desenvolvimento, conclusão), a progressão temática, o encadeamento lógico dos parágrafos e o uso de conectivos.
3. **DLP — Domínio da Língua Portuguesa** (0 a 30 pontos): Avalia o domínio da norma culta (ortografia, concordância, regência, pontuação, crase, colocação pronominal) e a adequação vocabular.

NOTA FINAL (score): Soma dos 3 critérios (0 a 100).

FEEDBACK: Texto corrido de 3-5 parágrafos explicando os pontos fortes, fracos e sugestões de melhoria. Seja construtivo e específico, citando trechos da redação quando relevante.

Responda APENAS com JSON válido no seguinte formato, sem markdown ou texto adicional:
{
  "score": 72,
  "maxScore": 100,
  "feedback": "Texto do feedback completo...",
  "criteria": {
    "cac": { "score": 30, "maxScore": 40, "comments": "Comentário específico sobre conteúdo e atendimento ao comando..." },
    "ot": { "score": 22, "maxScore": 30, "comments": "Comentário específico sobre organização textual..." },
    "dlp": { "score": 20, "maxScore": 30, "comments": "Comentário específico sobre domínio da língua portuguesa..." }
  }
}`;
  }

  private async callApiWithImage(prompt: string, filePath: string, mimeType: string): Promise<string> {
    const fs = await import('node:fs');
    const imageData = fs.readFileSync(filePath);
    const base64 = imageData.toString('base64');

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

  private parseEssayResponse(raw: string): EssayGradeResult {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new AppError(502, 'AI_INVALID_JSON', 'Gemini retornou JSON inválido na correção');
    }

    const result = essayResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(502, 'AI_INVALID_FORMAT', `Formato de correção inválido: ${result.error.message}`);
    }

    return result.data;
  }

  private buildQuestionsPrompt(params: GenerateQuestionsParams): string {
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

  private parseQuestionsResponse(raw: string, expectedCount: number): GeneratedQuestion[] {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new AppError(502, 'AI_INVALID_JSON', 'Gemini retornou JSON inválido');
    }

    const result = questionsResponseSchema.safeParse(parsed);
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
