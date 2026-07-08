import { z } from 'zod';
import type { GenerateQuestionsParams, GradeEssayParams } from '../interfaces/ai.interfaces.js';

export const questionsResponseSchema = z.object({
  questions: z.array(
    z.object({
      statement: z.string(),
      alternatives: z.array(z.object({ letter: z.string(), text: z.string() })).min(4).max(5),
      correctAnswer: z.string(),
      explanation: z.string(),
      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    }),
  ),
});

const essayCriterionSchema = z.object({
  score: z.number().min(0),
  maxScore: z.number(),
  comments: z.string(),
});

export const essayResponseSchema = z.object({
  score: z.number().min(0).max(100),
  maxScore: z.number(),
  feedback: z.string(),
  criteria: z.object({
    cac: essayCriterionSchema,
    ot: essayCriterionSchema,
    dlp: essayCriterionSchema,
  }),
});

export const editalResponseSchema = z.object({
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

// Em editais longos o conteúdo programático fica nos anexos, no final —
// ao truncar, preserva o início (dados do concurso) e o final (anexos)
export function truncateEdital(content: string, maxChars = EDITAL_MAX_CHARS): string {
  if (content.length <= maxChars) return content;
  const headChars = Math.min(EDITAL_HEAD_CHARS, Math.floor(maxChars * 0.25));
  const head = content.slice(0, headChars);
  const tail = content.slice(-(maxChars - headChars));
  return `${head}\n\n[... trecho intermediário do edital omitido ...]\n\n${tail}`;
}

export function buildQuestionsPrompt(params: GenerateQuestionsParams): string {
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

export function buildEssayPrompt(params: GradeEssayParams): string {
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

export function buildEditalPrompt(content: string): string {
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

export function stripJsonMarkdown(raw: string): string {
  return raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}
