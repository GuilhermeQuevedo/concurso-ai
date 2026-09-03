import { z } from 'zod';
import type {
  GenerateQuestionsParams,
  GradeEssayParams,
  GradeCaseStudyParams,
  TopicContentParams,
  GenerateFlashcardsParams,
} from '../interfaces/ai.interfaces.js';

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

export const caseStudyResponseSchema = z.object({
  score: z.number().min(0),
  maxScore: z.number().min(1),
  framing: z.string(),
  aspects: z
    .array(
      z.object({
        aspect: z.string(),
        situation: z.enum(['correto', 'parcial', 'incorreto', 'ausente']),
        points: z.number().min(0),
        maxPoints: z.number().min(0),
        justification: z.string(),
      }),
    )
    .min(1),
  form: z.object({
    strengths: z.string(),
    issues: z.string(),
    deduction: z.number(),
  }),
  penalties: z.array(z.object({ reason: z.string(), deduction: z.number() })),
  calculation: z.string(),
  feedback: z.array(z.string()).min(1),
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
  focusDisciplines: z.array(z.string()).nullable().optional(),
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
    ? `\nMATERIAL DE ESTUDO DO CANDIDATO (baseie-se ESTRITAMENTE neste material — cada questão deve poder ser respondida com o que está aqui; não cobre nada que não esteja no texto):\n${params.context}\n`
    : '';

  return `Você é um elaborador experiente de questões de concursos públicos brasileiros. Gere ${params.quantity} questão(ões) de múltipla escolha sobre "${params.subject}"${params.topic ? `, especificamente sobre "${params.topic}"` : ''}.

${params.examBoard ? `Estilo da banca: ${params.examBoard}. Siga o padrão de elaboração dessa banca.` : ''}
Dificuldade: ${diffText}.
${contextBlock}

REGRAS OBRIGATÓRIAS:
1. Cada questão deve ter exatamente 5 alternativas (A, B, C, D, E)
2. Apenas UMA alternativa inequivocamente correta por questão — as demais devem estar claramente erradas para quem domina o conteúdo, sem ambiguidade
3. O enunciado deve ser claro, autocontido e direto: uma única pergunta, sem duplas negações, sem "pegadinhas" de redação confusa
4. As alternativas erradas devem ser plausíveis (erros comuns de candidatos), curtas e com estrutura gramatical semelhante à correta
5. NÃO invente leis, artigos, números ou datas; se não tiver certeza de um dado, não o utilize
6. A explicação deve justificar por que a alternativa correta está certa e por que CADA uma das outras está errada
7. Use linguagem formal e técnica adequada para concursos
8. Varie a posição da resposta correta entre as questões

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

export function buildCaseStudyPrompt(params: GradeCaseStudyParams): string {
  const contentBlock = params.content
    ? params.content
    : '(A resposta do candidato está na imagem anexada. Extraia o texto manuscrito/digitado e corrija.)';
  const answerKeyBlock = params.answerKey?.trim()
    ? params.answerKey
    : 'Não foi fornecido espelho oficial. Monte um espelho de referência a partir do comando da questão e sinalize no enquadramento que a pontuação é uma referência estimada.';

  return `Você é um avaliador de provas discursivas do tipo "estudo de caso" para concurso público, atuando como uma banca examinadora. Sua tarefa é corrigir a resposta do candidato com rigor, imparcialidade e consistência, seguindo o espelho de correção fornecido.

## Contexto da correção
- Cargo/área: ${params.role?.trim() || 'genérico'}
- Banca/estilo: ${params.examBoard?.trim() || 'genérico'}
- Enunciado do caso: ${params.caseStatement}
- Limite de linhas: ${params.lineLimit ? `${params.lineLimit} linhas` : 'não especificado'}
- Espelho de correção (aspectos esperados e pontuação): ${answerKeyBlock}
- Resposta do candidato: ${contentBlock}

## Como corrigir
A nota divide-se em duas partes.

### 1. Conteúdo (peso maior)
Para cada aspecto previsto no espelho: verifique se o candidato abordou o ponto e classifique como correto/parcial/incorreto/ausente, atribuindo pontos conforme o espelho (proporcionais em abordagem parcial). Avalie: atendimento ao comando, domínio técnico (conceitos, legislação, normas), análise do caso (problema, variáveis, relações), solução (viável, fundamentada, aplicável) e argumentação (conclusões que decorrem logicamente).

### 2. Forma
Estrutura textual (coesão, coerência, organização), norma culta (gramática, ortografia, pontuação, concordância) e clareza/objetividade. Aplique descontos por erros de forma.

### 3. Penalidades
Desconto por linha excedente ao limite; fuga total ao tema ou resposta em branco zera o aspecto com justificativa; não pontue "encher linguiça".

## Regras de conduta
- Baseie-se exclusivamente na resposta enviada e no espelho; não presuma conhecimento não escrito.
- Seja consistente: o mesmo erro recebe o mesmo desconto sempre.
- Cite trechos da resposta ao justificar cada pontuação.
- Tom técnico, impessoal e construtivo.

Responda APENAS com JSON válido no formato abaixo, sem markdown ou texto adicional. "maxScore" é a soma dos pontos possíveis do espelho; "score" é a nota final (conteúdo + forma − penalidades); "form.deduction" e "penalties[].deduction" são valores positivos que foram subtraídos; "calculation" mostra o cálculo explícito da nota final:
{
  "score": 7.5,
  "maxScore": 10,
  "framing": "1-2 frases sobre o que a questão pediu.",
  "aspects": [
    { "aspect": "Identificação do problema central", "situation": "correto", "points": 2, "maxPoints": 2, "justification": "Justificativa citando trecho da resposta." }
  ],
  "form": { "strengths": "Pontos fortes da forma.", "issues": "Erros de forma identificados.", "deduction": 0.5 },
  "penalties": [ { "reason": "Excedeu 3 linhas do limite", "deduction": 0.3 } ],
  "calculation": "Conteúdo 8,0 + Forma −0,5 − Penalidades 0,3 = 7,2",
  "feedback": ["Recomendação 1", "Recomendação 2", "Recomendação 3"]
}`;
}

export function buildEditalPrompt(content: string, focus?: string): string {
  const focusBlock = focus
    ? `

FOCO DO CANDIDATO: "${focus}"
Além de extrair o conteúdo COMPLETO, identifique em **focusDisciplines** APENAS as disciplinas do syllabus que são exigidas para esse foco/cargo (inclua as disciplinas comuns a todos os cargos, como Língua Portuguesa e conhecimentos gerais, mais as específicas do foco). Use exatamente os mesmos nomes de disciplina que aparecem no syllabus. Se o foco não corresponder a nenhuma disciplina específica, retorne focusDisciplines como null.`
    : '';

  const focusField = focus ? '\n  "focusDisciplines": ["Língua Portuguesa", "Sociologia"],' : '';

  return `Você é um especialista em concursos públicos brasileiros. Analise o texto do edital abaixo e extraia as informações estruturadas.

TEXTO DO EDITAL:
${content}

EXTRAIA:
1. **name** — Nome curto do concurso (órgão + cargo principal), ex: "SEEDF — Professor de Educação Básica"
2. **organization** — Nome completo do órgão realizador
3. **examBoard** — Banca organizadora (ex: CESPE/CEBRASPE, FGV, FCC). null se não encontrar.
4. **role** — Cargo/função principal do edital. null se não encontrar.
5. **examDate** — Data da prova objetiva no formato YYYY-MM-DD. null se não encontrada.
6. **syllabus** — Conteúdo programático COMPLETO: para cada disciplina, liste TODOS os tópicos exatamente como aparecem no edital. Não resuma, não omita tópicos. Separe tópicos compostos em itens individuais quando fizer sentido.${focusBlock}

Responda APENAS com JSON válido no seguinte formato, sem markdown ou texto adicional:
{
  "name": "Órgão — Cargo",
  "organization": "Nome completo do órgão",
  "examBoard": "Banca",
  "role": "Cargo",
  "examDate": "2026-10-15",${focusField}
  "syllabus": [
    {
      "discipline": "Língua Portuguesa",
      "topics": ["Tópico 1", "Tópico 2"]
    }
  ]
}`;
}

const FLASHCARD_MAX_CONTENT = 12000;

export const flashcardsResponseSchema = z.object({
  flashcards: z
    .array(z.object({ front: z.string().min(1), back: z.string().min(1) }))
    .min(1),
});

export function buildFlashcardsPrompt(params: GenerateFlashcardsParams): string {
  const content = params.content.slice(0, FLASHCARD_MAX_CONTENT);
  const subjectBlock = params.subject ? ` da disciplina "${params.subject}"` : '';

  return `Você é um especialista em técnicas de memorização para concursos públicos. A partir do CONTEÚDO DE ESTUDO abaixo${subjectBlock}, crie ${params.count} flashcards de pergunta e resposta para revisão espaçada.

CONTEÚDO DE ESTUDO:
${content}

REGRAS OBRIGATÓRIAS:
1. Baseie-se ESTRITAMENTE no conteúdo fornecido — não invente fatos que não estejam no texto.
2. Cada flashcard deve testar UM conceito específico e importante (atômico).
3. A "front" é uma pergunta direta e objetiva; a "back" é a resposta completa mas concisa.
4. Evite perguntas de sim/não. Prefira "O que é...", "Qual...", "Quando...", "Por que...".
5. Priorize os pontos mais cobrados em prova (definições, prazos, exceções, classificações).
6. Não repita o mesmo conceito em cards diferentes.

Responda APENAS com JSON válido no seguinte formato, sem markdown ou texto adicional:
{
  "flashcards": [
    { "front": "Pergunta objetiva?", "back": "Resposta completa e concisa." }
  ]
}`;
}

export function buildTopicContentPrompt(params: TopicContentParams): string {
  const bancaBlock = params.examBoard ? ` A prova é da banca ${params.examBoard}; foque no que costuma ser cobrado por ela.` : '';

  return `Você é um professor experiente que prepara candidatos para concursos públicos brasileiros. Escreva um material de estudo objetivo e didático sobre o tópico abaixo.

DISCIPLINA: ${params.discipline}
TÓPICO: ${params.topic}${bancaBlock}

O material deve conter, em português, formatado em Markdown:
1. Um resumo dos conceitos essenciais do tópico (o que o candidato precisa dominar)
2. Os pontos mais cobrados em prova e possíveis pegadinhas
3. Uma dica prática de memorização ou resolução

Seja direto e didático. Use listas e negrito para destacar o essencial. Não invente legislação nem dados; se citar leis, cite apenas as reconhecidas. Escreva de 200 a 400 palavras. Responda APENAS com o material em Markdown, sem preâmbulo.`;
}

export function stripJsonMarkdown(raw: string): string {
  return raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}
