import { z } from 'zod';
import type {
  GenerateQuestionsParams,
  QuestionType,
  GradeEssayParams,
  GradeCaseStudyParams,
  TopicContentParams,
  GenerateFlashcardsParams,
  AdvancedGenerateFlashcardsParams,
  GenerateErrorRemediationParams,
  ExamSlicerParams,
  EditalSyllabusEntry,
  GenerateSummaryParams,
  AnswerQuestionsParams,
} from '../interfaces/ai.interfaces.js';
import { BANCA_PROFILES } from './banca-profiles.js';

export const questionsResponseSchema = z.object({
  questions: z.array(
    z.object({
      statement: z.string(),
      alternatives: z.array(z.object({ letter: z.string(), text: z.string() })).max(5),
      correctAnswer: z.string(),
      explanation: z.string(),
      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    }),
  ),
});

export const examSlicerResponseSchema = z.object({
  questions: z.array(
    z.object({
      statement: z.string().min(1),
      referenceText: z.string().nullable().optional(),
      alternatives: z.array(z.object({ letter: z.string(), text: z.string() })).min(2),
      correctAnswer: z.string().min(1),
      explanation: z.string().min(1),
    }),
  ),
});

export const errorRemediationResponseSchema = z.object({
  flashcards: z.array(
    z.object({
      front: z.string().min(1),
      back: z.string().min(1),
      type: z.enum(['direct', 'cloze', 'true_false']),
      explanation: z.string().min(1),
    }),
  ),
});

export const topicProbabilityResponseSchema = z.object({
  analysis: z.array(
    z.object({
      discipline: z.string(),
      topic: z.string(),
      probability: z.enum(['alta', 'media', 'baixa']),
      justification: z.string(),
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

export function truncateEdital(content: string, maxChars = EDITAL_MAX_CHARS): string {
  if (content.length <= maxChars) return content;
  const headChars = Math.min(EDITAL_HEAD_CHARS, Math.floor(maxChars * 0.25));
  const head = content.slice(0, headChars);
  const tail = content.slice(-(maxChars - headChars));
  return `${head}\n\n[... trecho intermediário do edital omitido ...]\n\n${tail}`;
}

export function sampleContent(content: string, maxChars: number, windows = 5): string {
  const text = content.trim();
  if (text.length <= maxChars) return text;

  const windowSize = Math.floor(maxChars / windows);
  const step = Math.max(windowSize, Math.floor((text.length - windowSize) / (windows - 1)));
  const parts: string[] = [];
  for (let i = 0; i < windows; i++) {
    const start = Math.min(i * step, text.length - windowSize);
    parts.push(text.slice(start, start + windowSize));
  }
  return parts.join('\n\n[... trecho omitido ...]\n\n');
}

const QUESTIONS_MAX_CONTEXT = 14000;
const ALT_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

function getBancaGuidance(examBoard?: string): string {
  if (!examBoard) return '';
  const board = examBoard.trim().toUpperCase();

  if (board.includes('CESPE') || board.includes('CEBRASPE') || board.includes('QUADRIX')) {
    return `
ESTILO CESPE/CEBRASPE/QUADRIX:
- Para questões de Certo ou Errado: formule afirmações declarativas longas e assertivas.
- Utilize pegadinhas clássicas: palavras restritivas ("apenas", "somente", "sempre", "nunca", "exclusivamente").
- Empregue inversão conceitual sutil: troque "prescindível" por "imprescindível", "pode" por "deve", "vedado" por "permitido".
- O candidato deve ser desafiado a detectar detalhes de doutrina e jurisprudência pacificada.`;
  }

  if (board.includes('FGV')) {
    return `
ESTILO FGV (Fundação Getulio Vargas):
- Crie enunciados no formato de "Casos Concretos" (situações hipotéticas ou historinhas com personagens fictícios aplicando a matéria).
- Alternativas de A a E longas, muito plausíveis e gramaticalmente parecidas entre si.
- Exija raciocínio jurídico/técnico aplicado e interpretação de texto, focando em EXCEÇÕES à regra geral.`;
  }

  if (board.includes('FCC')) {
    return `
ESTILO FCC (Fundação Carlos Chagas):
- Foco cirúrgico na literalidade do texto legal ou técnico.
- As alternativas incorretas devem conter alterações pontuais e sutis: troca de prazos (ex: 15 por 30 dias), conjunções ("e" por "ou", "salvo" por "inclusive") e conceitos procedimentais ("suspensão" por "interrupção").`;
  }

  if (board.includes('VUNESP')) {
    return `
ESTILO VUNESP:
- Situações contextualizadas simples do dia a dia da administração pública.
- Alternativas diretas e enxutas testando aplicação literal de deveres funcionais, proibições e prazos.`;
  }

  if (board.includes('CESGRANRIO')) {
    return `
ESTILO CESGRANRIO:
- Questões fortemente contextualizadas simulando o mercado de trabalho (rotinas administrativas, bancárias ou de engenharia).
- Distratores construídos em cima de equívocos clássicos de profissionais novatos ou desatentos.`;
  }

  if (board.includes('IBFC') || board.includes('AOCP') || board.includes('IDECAN')) {
    return `
ESTILO IBFC/AOCP/IDECAN:
- Questões diretas, literais e secas ("Assinale a alternativa correta sobre...", "É INCORRETO afirmar que...").
- Foco em listas, enumerações e decoreba de conceitos literais.`;
  }

  return `Banca Alvo: ${examBoard}. Adapte o vocabulário, estrutura e nível de cobrança ao perfil histórico desta banca.`;
}

function typeInstructions(type: QuestionType): string {
  switch (type) {
    case 'MULTIPLE_4':
      return 'Cada questão deve ter exatamente 4 alternativas (A, B, C, D), com UMA única correta.';
    case 'TRUE_FALSE':
      return 'Cada questão é uma afirmação para julgar como CERTO ou ERRADO. Use exatamente 2 alternativas: {"letter":"C","text":"Certo"} e {"letter":"E","text":"Errado"}; correctAnswer é "C" ou "E". Equilibre afirmações certas e erradas.';
    case 'ESSAY':
      return 'Cada questão é SUBJETIVA (resposta dissertativa curta). Use "alternatives": [] e "correctAnswer": "S". Em "explanation" escreva a resposta esperada, com os pontos-chave que uma boa resposta deve conter.';
    case 'MIXED':
      return 'Varie o formato entre as questões: múltipla escolha com 5 alternativas (A–E), múltipla escolha com 4 (A–D), certo/errado (alternativas C e E, texto "Certo" e "Errado") e subjetiva ("alternatives": [] e "correctAnswer": "S", com a resposta esperada em "explanation").';
    default:
      return 'Cada questão deve ter exatamente 5 alternativas (A, B, C, D, E), com UMA única correta.';
  }
}

function exampleItem(type: QuestionType, difficulty: string): string {
  const alternatives =
    type === 'ESSAY'
      ? '[]'
      : type === 'TRUE_FALSE'
        ? '[{"letter":"C","text":"Certo"},{"letter":"E","text":"Errado"}]'
        : JSON.stringify(
            ALT_LETTERS.slice(0, type === 'MULTIPLE_4' ? 4 : 5).map((letter) => ({ letter, text: `Texto da alternativa ${letter}` })),
          );
  const correct = type === 'ESSAY' ? 'S' : 'C';
  return `{"statement":"Enunciado da questão","alternatives":${alternatives},"correctAnswer":"${correct}","explanation":"Explicação detalhada","difficulty":"${difficulty}"}`;
}

export function buildQuestionsPrompt(params: GenerateQuestionsParams): string {
  const difficultyMap = { EASY: 'fácil', MEDIUM: 'média', HARD: 'difícil' };
  const diffText = params.difficulty ? difficultyMap[params.difficulty] : 'variada';
  const type = params.questionType ?? 'MULTIPLE_5';
  const bancaGuidance = getBancaGuidance(params.examBoard);

  const styleNote = params.cloneStyle
    ? '\nCLONADOR DE PROVA: o material abaixo é uma prova/lista de referência. Imite o ESTILO dela (tamanho dos enunciados, tom, tipo de cobrança e pegadinhas da banca) sem copiar as questões.\n'
    : '';
  const contextBlock = params.context
    ? `\nMATERIAL DE ESTUDO DO CANDIDATO (trechos ao longo do material; baseie-se ESTRITAMENTE neste material — cada questão deve poder ser respondida com o que está aqui; não cobre nada que não esteja no texto):${styleNote}\n${sampleContent(params.context, QUESTIONS_MAX_CONTEXT)}\n`
    : '';

  return `Você é um examinador experiente de concursos públicos brasileiros. Gere ${params.quantity} questão(ões) sobre "${params.subject}"${params.topic ? `, especificamente sobre "${params.topic}"` : ''}.

${bancaGuidance}
Dificuldade: ${diffText}.
${contextBlock}

REGRAS OBRIGATÓRIAS:
1. ${typeInstructions(type)}
2. Em questões objetivas, apenas UMA alternativa inequivocamente correta — as demais devem estar claramente erradas para quem domina o conteúdo, sem ambiguidade.
3. O enunciado deve ser claro, autocontido e direto.
4. As alternativas erradas (distratores) devem ser plausíveis e representar erros frequentes dos candidatos.
5. NÃO invente leis, artigos, números ou datas; baseie-se exclusivamente no ordenamento real.
6. A explicação deve justificar a resposta correta e explicar por que as demais alternativas estão erradas.
7. Use linguagem formal e técnica adequada para concursos públicos.
8. Varie a posição da alternativa correta.

Responda APENAS com JSON válido no seguinte formato, sem markdown ou texto adicional:
{"questions":[${exampleItem(type, params.difficulty ?? 'MEDIUM')}]}`;
}

export function buildExamSlicerPrompt(params: ExamSlicerParams): string {
  const randomSeed = Date.now() % 10000;
  const quantity = params.quantity ?? 10;
  const answerKeyBlock = params.answerKeyContent
    ? `\nGABARITO OFICIAL FORNECIDO PELO USUÁRIO (Use obrigatoriamente para validar o gabarito e justificar):\n${params.answerKeyContent.slice(0, 15000)}\n`
    : '';

  return `Você é um especialista em análise e fatiamento de Provas de Concursos Públicos Brasileiros.
Sua missão é extrair fielmente ${quantity} questões reais do texto da prova fornecida, estruturando-as para resolução interativa.
Semente de variação: ${randomSeed}. Não extraia apenas o início; percorra diferentes blocos da prova.

TEXTO DA PROVA:
${sampleContent(params.examContent, 25000)}
${answerKeyBlock}

REGRAS DE EXTRAÇÃO:
1. Extraia até ${quantity} questões objetivas completas presentes no documento.
2. Identifique se a questão possui texto-base de suporte/interpretação e preencha "referenceText" (se não houver texto-base próprio, use null).
3. "statement" deve conter o enunciado limpo da questão.
4. "alternatives" deve conter a lista com letter (A, B, C, D, E ou C, E) e o text correspondente.
5. "correctAnswer" deve ser a letra da resposta correta (A-E ou C/E).
6. "explanation" deve ser didática, citando a regra jurídica ou fundamento técnico da resposta.

Responda APENAS com JSON válido no formato abaixo, sem markdown:
{
  "questions": [
    {
      "statement": "Enunciado da questão",
      "referenceText": "Texto de apoio se houver, ou null",
      "alternatives": [
        { "letter": "A", "text": "Texto da alternativa A" },
        { "letter": "B", "text": "Texto da alternativa B" }
      ],
      "correctAnswer": "A",
      "explanation": "Explicação completa e fundamentada"
    }
  ]
}`;
}

export function buildAdvancedFlashcardsPrompt(params: AdvancedGenerateFlashcardsParams): {
  prompt: string;
  temperature: number;
} {
  const mode = params.mode ?? 'standard';
  const difficulty = params.difficulty ?? 'MEDIUM';
  const count = params.count;
  const subjectBlock = params.subject ? ` da disciplina "${params.subject}"` : '';

  const difficultyConfig = {
    EASY: {
      temperature: 0.3,
      instructions: 'Foque em conceitos diretos, definições e identificação literal de regras.',
    },
    MEDIUM: {
      temperature: 0.5,
      instructions: 'Foque em aplicação de conceitos em cenários práticos, comparações e relações de causa/efeito.',
    },
    HARD: {
      temperature: 0.65,
      instructions: 'Foque em exceções à regra geral, pegadinhas doutrinárias, prazos específicos e distinções sutis.',
    },
  }[difficulty];

  const memoryBlock =
    params.previousQuestions && params.previousQuestions.length > 0
      ? `\n🚨 DIRETRIZ DE EXCLUSÃO (ANTI-REPETIÇÃO):
É ESTRITAMENTE PROIBIDO gerar perguntas sobre os mesmos tópicos ou abordagens destas questões já geradas:
${params.previousQuestions.slice(-30).map((q) => `- ${q}`).join('\n')}
Ignore essas partes e extraia outros detalhes essenciais do material.\n`
      : '';

  const focusBlock = params.customFocus?.trim()
    ? `\n🎯 FOCO DO ALUNO: "${params.customFocus.trim()}". Priorize flashcards baseados estritamente nesse recorte.\n`
    : '';

  let modeSpecificPrompt = '';
  let finalTemperature = difficultyConfig.temperature;

  if (mode === 'cloze') {
    finalTemperature = 0.35;
    modeSpecificPrompt = `
METODOLOGIA CLOZE (COMPLETAR A LACUNA):
Transforme os conceitos em afirmações com lacuna ("________").
A lacuna DEVE recair sobre a informação central:
1. Prazos e quantitativos numéricos;
2. Termos técnicos nucleares;
3. Efeitos jurídicos e consequências;
4. Exceções à regra.
NUNCA oculte artigos ("o", "a"), preposições ("de", "em") ou verbos genéricos.
DICA VISUAL: Para palavras compostas, use blocos de underlines proporcionais separados por espaço (Ex: "______ __ ________"). Na resposta ("back"), forneça apenas o termo ocultado sem underlines.`;
  } else {
    modeSpecificPrompt = `
METODOLOGIA PADRÃO:
A "front" deve ser uma pergunta atômica, clara e desafiadora. A "back" deve conter a resposta precisa acompanhada de justificativa concisa.`;
  }

  const prompt = `Você é um professor especialista em técnicas de estudo e memorização para concursos públicos.
A partir do CONTEÚDO DE ESTUDO abaixo${subjectBlock}, crie EXATAMENTE ${count} flashcards de alta retenção.

NÍVEL DE DIFICULDADE: ${difficulty}
${difficultyConfig.instructions}
${focusBlock}
${memoryBlock}
${modeSpecificPrompt}

CONTEÚDO DE ESTUDO:
${sampleContent(params.content, 18000)}

Responda APENAS com JSON válido no formato abaixo, sem markdown ou texto adicional:
{
  "flashcards": [
    {
      "front": "${mode === 'cloze' ? 'Afirmação com lacuna: O prazo para recurso é de ________ dias.' : 'Pergunta direta e objetiva?'}",
      "back": "${mode === 'cloze' ? '15' : 'Resposta concisa e completa.'}"
    }
  ]
}`;

  return { prompt, temperature: finalTemperature };
}

export function buildErrorRemediationPrompt(params: GenerateErrorRemediationParams): string {
  const userAnswerBlock = params.userAnswer ? `\nRESPOSTA QUE O ALUNO MARCOU INCORRETAMENTE: "${params.userAnswer}"` : '';

  return `Você é um mentor sênior especialista em preparação de candidatos para concursos públicos brasileiros.
O aluno errou a seguinte questão e necessita de um ciclo corretivo imediato:

QUESTÃO DO ERRO:
"${params.question}"
${userAnswerBlock}

GABARITO E EXPLICAÇÃO CORRETA:
"${params.correctAnswer} - ${params.explanation}"

SUA TAREFA:
Crie EXATAMENTE 3 flashcards estratégicos para fixar e sanar essa falha:
1. Tipo "direct": 1 Pergunta conceitual direta sobre a regra que levou ao erro.
2. Tipo "cloze": 1 Frase afirmativa com lacuna ("________") cobrando exatamente o prazo, exceção ou termo técnico que o aluno confundiu. Use dica proporcional de sublinhados se for termo composto.
3. Tipo "true_false": 1 Afirmação declarativa para o aluno julgar como Verdadeiro ou Falso, formulando a pegadinha clássica da banca sobre o tema.

Para CADA flashcard, forneça um campo "explanation" com explicação didática em Markdown destacando a legislação/jurisprudência aplicável e alertando para a pegadinha mais comum.

Responda APENAS com JSON válido no formato abaixo, sem markdown:
{
  "flashcards": [
    {
      "front": "Pergunta ou afirmação com lacuna",
      "back": "Resposta correta",
      "type": "direct",
      "explanation": "Explicação detalhada em Markdown com **destaques** e fundamentação legal."
    }
  ]
}`;
}

export function buildTopicProbabilityPrompt(params: {
  syllabus: EditalSyllabusEntry[];
  examBoard: string;
}): string {
  const syllabusText = params.syllabus
    .map((s) => `DISCIPLINA: ${s.discipline}\nTÓPICOS:\n${s.topics.map((t) => `- ${t}`).join('\n')}`)
    .join('\n\n');

  return `Você é um examinador especialista em estatística de bancas de concursos no Brasil.
Analise o conteúdo programático abaixo tendo como foco a banca ${params.examBoard.toUpperCase()}.

PERFIL HISTÓRICO DAS BANCAS:
${BANCA_PROFILES}

CONTEÚDO PROGRAMÁTICO:
${syllabusText.slice(0, 16000)}

TAREFA:
Para os principais tópicos de cada disciplina, atribua a probabilidade de incidência na prova objetiva:
- "alta": temas recorrentes e prioritários com histórico maciço de cobrança pela ${params.examBoard.toUpperCase()}.
- "media": temas complementares de cobrança regular.
- "baixa": temas marginais ou periféricos raramente cobrados.

Forneça uma justificativa objetiva para cada classificação.

Responda APENAS com JSON válido no seguinte formato:
{
  "analysis": [
    {
      "discipline": "Nome da Disciplina",
      "topic": "Nome do Tópico",
      "probability": "alta",
      "justification": "Histórico massivo em provas anteriores da banca."
    }
  ]
}`;
}

export function buildExtractQuestionsPrompt(content: string, subject?: string): string {
  return `Você é um especialista em bancas de concursos. O texto abaixo é uma LISTA DE QUESTÕES já existente${subject ? ` sobre "${subject}"` : ''}. Sua tarefa é EXTRAIR fielmente as questões de múltipla escolha presentes no texto — NÃO invente questões novas.

TEXTO (lista de questões):
${sampleContent(content, QUESTIONS_MAX_CONTEXT)}

REGRAS OBRIGATÓRIAS:
1. Extraia cada questão como aparece, com seu enunciado e suas alternativas
2. Normalize para exatamente 5 alternativas (A, B, C, D, E); se a questão original tiver menos, complete com distratores plausíveis coerentes com o tema
3. Se o gabarito estiver indicado no texto, use-o em "correctAnswer"; caso contrário, determine a alternativa correta pelo conteúdo
4. Em "explanation", justifique a resposta correta; se o texto já trouxer comentário/justificativa, aproveite-o
5. Defina "difficulty" como EASY, MEDIUM ou HARD conforme a complexidade
6. Ignore cabeçalhos, numeração solta e texto que não seja questão
7. Não repita questões

Responda APENAS com JSON válido neste formato, sem markdown:
{
  "questions": [
    {
      "statement": "Enunciado da questão",
      "alternatives": [
        {"letter": "A", "text": "..."},
        {"letter": "B", "text": "..."},
        {"letter": "C", "text": "..."},
        {"letter": "D", "text": "..."},
        {"letter": "E", "text": "..."}
      ],
      "correctAnswer": "C",
      "explanation": "Justificativa",
      "difficulty": "MEDIUM"
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
  const content = sampleContent(params.content, FLASHCARD_MAX_CONTENT);
  const subjectBlock = params.subject ? ` da disciplina "${params.subject}"` : '';

  return `Você é um especialista em técnicas de memorização para concursos públicos. A partir do CONTEÚDO DE ESTUDO abaixo${subjectBlock} (trechos ao longo de todo o material), crie ${params.count} flashcards de pergunta e resposta para revisão espaçada.

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

const SUMMARY_MAX_CONTENT = 16000;

export function buildSummaryPrompt(params: GenerateSummaryParams): string {
  const content = sampleContent(params.content, SUMMARY_MAX_CONTENT);
  const subjectBlock = params.subject ? ` da disciplina "${params.subject}"` : '';

  return `Você é um professor experiente que prepara candidatos para concursos públicos brasileiros. Resuma o CONTEÚDO DE ESTUDO abaixo${subjectBlock} (trechos ao longo de todo o material) de forma objetiva e didática, para revisão rápida.

CONTEÚDO DE ESTUDO:
${content}

REGRAS OBRIGATÓRIAS:
1. Baseie-se ESTRITAMENTE no conteúdo fornecido — não acrescente fatos que não estejam no texto.
2. Destaque os pontos mais importantes (definições, classificações, prazos, exceções).
3. Use Markdown: títulos, listas e **negrito** no essencial.
4. Seja conciso: de 250 a 500 palavras.

Responda APENAS com o resumo em Markdown, sem preâmbulo.`;
}

export const auditResponseSchema = z.object({
  answers: z.array(z.object({ index: z.number().int(), letter: z.string().min(1) })),
});

export function buildAuditPrompt(params: AnswerQuestionsParams): string {
  const subjectBlock = params.subject ? ` de ${params.subject}` : '';
  const blocks = params.questions
    .map((q, i) => {
      const alts = q.alternatives.map((a) => `${a.letter}) ${a.text}`).join('\n');
      return `[index ${i}]\n${q.statement}\n${alts}`;
    })
    .join('\n\n');

  return `Você é um candidato experiente resolvendo uma prova de concurso${subjectBlock}. Resolva CADA questão escolhendo a ÚNICA alternativa correta, usando apenas seu conhecimento técnico. Não explique, não comente — apenas escolha.

${blocks}

Responda APENAS com JSON válido, sem markdown, uma resposta por questão (use o index informado):
{ "answers": [ { "index": 0, "letter": "A" } ] }`;
}

export function mapAuditAnswers(
  parsed: { answers: { index: number; letter: string }[] },
  count: number,
): string[] {
  const out = new Array<string>(count).fill('');
  for (const a of parsed.answers) {
    if (a.index >= 0 && a.index < count) {
      out[a.index] = a.letter.trim().charAt(0).toUpperCase();
    }
  }
  return out;
}

export function stripJsonMarkdown(raw: string): string {
  return raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}
