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

const QUESTIONS_MAX_CONTEXT = 40000;
const ALT_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

export function getSmartChunks(text: string, numChunks: number, maxChunkChars = 35000): string[] {
  if (numChunks <= 1 || text.length <= maxChunkChars) {
    return [text.slice(0, maxChunkChars)];
  }

  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += para + '\n\n';
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export function getBancaGuidance(examBoard?: string): string {
  if (!examBoard || examBoard.trim() === '') {
    return `ESTILO PADRÃO: Crie questões claras e objetivas, testando a compreensão e aplicação do conceito sem ambiguidades extremas. Evite pegadinhas injustas, foque no aprendizado e retenção técnica de alto nível.`;
  }
  const board = examBoard.trim().toUpperCase();

  if (board.includes('CESPE') || board.includes('CEBRASPE') || board.includes('QUADRIX')) {
    return `
ESTILO CESPE/CEBRASPE/QUADRIX:
- Para questões de Certo ou Errado: Crie afirmações declarativas assertivas para julgamento (Certo ou Errado). Misture conceitos de diferentes partes do texto/matéria.
- Utilize "pegadinhas" clássicas de concurso: restrição (palavras como "apenas", "somente", "sempre", "nunca", "exclusivamente"), extrapolação (afirmar algo que o texto/lei não prevê) e inversão conceitual.
- Troque sutilmente termos técnicos: "prescindível" por "imprescindível", "pode" por "deve", "vedado" por "permitido". A frase deve induzir ao erro por desatenção a um único termo sutil.
- Informática pesa muito na Quadrix; Direito Constitucional e Administrativo com peso dobrado.

EXEMPLO DE QUESTÃO NO ESTILO CESPE/CEBRASPE:
Enunciado: "À luz da Constituição Federal, os ministros de Estado são julgados originariamente pelo Supremo Tribunal Federal nos crimes de responsabilidade, independentemente de conexão com o Presidente da República."
Alternativas: [{"letter":"C","text":"Certo"},{"letter":"E","text":"Errado"}]
correctAnswer: "E"
explanation: "Errado. Conforme art. 102, I, 'c' da CF/88, compete ao STF processar e julgar Ministros de Estado nos crimes comuns e nos crimes de responsabilidade APENAS se houver conexão com os do Presidente da República. A afirmação generalizou indevidamente o julgamento de responsabilidade originário ao excluir o requisito de conexão."
Por que é estilo CESPE: Utilizou detalhe restritivo doutrinário de conexão com o Presidente da República numa afirmação corrida e assertiva.`;
  }

  if (board.includes('FGV')) {
    return `
ESTILO FGV (Fundação Getulio Vargas):
- Nível de complexidade altíssimo. Crie "casos concretos" (situações hipotéticas ou historinhas com personagens fictícios, ex: "João, servidor recém empossado...") onde o candidato precisa aplicar a teoria à prática.
- As alternativas de A a E devem ser longas, extremamente plausíveis e parecidas entre si.
- Exija interpretação de texto profunda, raciocínio lógico/jurídico aplicado e foco nas EXCEÇÕES à regra geral. Fuja da literalidade pura.
- Raciocínio Lógico e Estatística com peso máximo; alto risco eliminatório.

EXEMPLO DE QUESTÃO NO ESTILO FGV:
Enunciado: "João, servidor recém empossado, no exercício da função e mediante uso abusivo de suas atribuições, constrangeu subordinado. Considerando o texto normativo adotado no órgão, João:"
Alternativas: [
  {"letter":"A","text":"Responderá por falta disciplinar, sendo imprescindível a instauração imediata de sindicância de rito sumário preparatório."},
  {"letter":"B","text":"Não sofrerá sanções caso não haja dolo específico comprovado da intenção lesiva, respondendo apenas administrativamente de forma branda."},
  {"letter":"C","text":"Sofrerá processo administrativo apuratório, garantindo-se contraditório apenas na fase de defesa."},
  {"letter":"D","text":"Poderá vir a responder administrativamente, civilmente e penalmente, dada as esferas independentes, em face da materialidade do excesso exercido."},
  {"letter":"E","text":"Terá a falta relevada pelo princípio da insignificância funcional adotada internamente pelo conselho ético."}
]
correctAnswer: "D"
explanation: "A alternativa D está correta. Pelo princípio da independência das instâncias (art. 121 a 125 da Lei 8.112/90 e doutrina pacificada), as sanções civis, penais e administrativas poderão cumular-se, sendo independentes entre si. As demais alternativas criam falsos requisitos processuais ou atenuantes inexistentes."
Por que é estilo FGV: O enunciado é caso prático simulado (fictício) e as alternativas parecem todas plausivelmente corretas, exigindo aplicação da teoria para achar a exata.`;
  }

  if (board.includes('FCC')) {
    return `
ESTILO FCC (Fundação Carlos Chagas):
- Foco pesado na literalidade exata do texto/regra legal ou técnica, mas com maldades sutis.
- O erro das alternativas incorretas consiste na alteração pontual de um único dado: prazos (de 15 para 30 dias), porcentagens, competências, conjunções ("e" por "ou", "salvo" por "inclusive") e conceitos processuais ("suspensão" por "interrupção").
- Crie alternativas de A a E onde o erro de 4 delas está em uma única palavra cirurgicamente alterada em relação ao texto original.
- Português eliminatório, literalidade de legislação sem elucubrações doutrinárias.

EXEMPLO DE QUESTÃO NO ESTILO FCC:
Enunciado: "Nos termos da legislação de regência, é correto afirmar sobre a suspensão e contagem de prazos:"
Alternativas: [
  {"letter":"A","text":"Suspende-se o curso do prazo a partir do primeiro dia útil e retorna a fluir do doze subsequente."},
  {"letter":"B","text":"O prazo legal interrompe, exceto nas instâncias em dilação de urgência contínua."},
  {"letter":"C","text":"O fluxo sofre suspensão no período de recesso formal de 20 de dezembro a 20 de janeiro, inclusive."},
  {"letter":"D","text":"Fica vedada a prática de qualquer ato processual administrativo, sem exceção de urgência no período de 20 a 30 de janeiro."},
  {"letter":"E","text":"Os prazos prescricionais ficam excluídos da suspensão geral, salvo em decisão fundamentada em sigilo."}
]
correctAnswer: "C"
explanation: "A alternativa C é a literalidade correta (ex: art. 220 do CPC). As alternativas A, B, D e E alteram cirurgicamente prazos, trocam suspensão por interrupção ou criam vedações absolutas inexistentes."
Por que é estilo FCC: Questão seca literal de uma regrinha técnica onde as alternativas erradas trocaram sutis elementos como 'suspensão' por 'interrupção' e datas.`;
  }

  if (board.includes('VUNESP')) {
    return `
ESTILO VUNESP:
- Situações contextualizadas simples envolvendo o cotidiano administrativo da repartição (ex: um servidor público, uma rotina administrativa).
- As alternativas de A a E são diretas e enxutas, testando a aplicação literal da regra, deveres, proibições e prazos.
- É uma banca direta, menos interpretativa que a FGV, focada na retenção precisa e fidedigna da informação.
- Foco regional, legislação municipal/estadual tem peso máximo.

EXEMPLO DE QUESTÃO NO ESTILO VUNESP:
Enunciado: "Ana Beatriz, servidora pública em exercício na repartição, precisou retirar autos físicos do setor por 3 dias sem prévia autorização da autoridade competente. De acordo com o estatuto funcional, Ana Beatriz:"
Alternativas: [
  {"letter":"A","text":"Tem o prazo de 24h para comunicar formalmente a ocorrência sem incorrer em penalidade disciplinar."},
  {"letter":"B","text":"Cometeu infração funcional punível com penalidade administrativa de suspensão."},
  {"letter":"C","text":"Praticou ato passível exclusivamente de advertência verbal sumária caso seja ré primária."},
  {"letter":"D","text":"Possui amparo legal irrestrito com esteio no princípio da eficiência funcional."},
  {"letter":"E","text":"Terá a irregularidade automaticamente relevada mediante declaração de boa-fé subscrita."}
]
correctAnswer: "B"
explanation: "A alternativa B é a correta. A retirada não autorizada de documentos ou autos da repartição pública configura falta disciplinar grave punível com suspensão nos estatutos dos servidores públicos civis."
Por que é estilo VUNESP: Historinha do cotidiano pragmático do setor, alternativas focadas na aplicação direta do regulamento sem malabarismos.`;
  }

  if (board.includes('CESGRANRIO')) {
    return `
ESTILO CESGRANRIO:
- Questões muito objetivas e perfeitamente equilibradas entre teoria e prática.
- Crie enunciados fortemente contextualizados, simulando situações reais do mercado de trabalho (como rotinas bancárias, financeiras, administrativas, comerciais ou de engenharia).
- Evite 'pegadinhas' baseadas apenas em trocas semânticas de palavras; o foco deve ser testar se o candidato domina o conceito central e sabe aplicá-lo na prática.
- As alternativas incorretas (distratores) devem representar erros conceituais clássicos que um profissional novato ou desatento cometeria no dia a dia.
- Matemática Financeira, Legislação Específica e Contabilidade com peso alto.`;
  }

  if (
    board.includes('IBFC') ||
    board.includes('AOCP') ||
    board.includes('IDECAN') ||
    board.includes('CONSULPLAN') ||
    board.includes('FUNDEP') ||
    board.includes('IADES') ||
    board.includes('FEPESE') ||
    board.includes('FUNRIO')
  ) {
    return `
ESTILO ${board}:
- Questões secas, diretas e literais ("Assinale a alternativa correta sobre...", "Com base no texto/legislação, é INCORRETO afirmar que...").
- Foco extremo em memorização de conceitos, listas e enumerações literais presentes no texto ou na lei.
- Alternativas de A a E tendem a ser mais curtas e diretas ao ponto, sem historinhas prolixas.`;
  }

  return `Banca Alvo: ${examBoard}.
Aplique o estilo característico e o nível de exigência desta banca.
Perfil geral de referência:
${BANCA_PROFILES}`;
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

  return `Você é um examinador sênior e de alta precisão de concursos públicos brasileiros.
Gere ${params.quantity} questão(ões) inéditas sobre "${params.subject}"${params.topic ? `, especificamente sobre "${params.topic}"` : ''}.

======================================================================
DIRETRIZES DE ESTILO DA BANCA EXAMINADORA:
======================================================================
${bancaGuidance}

Nível de Dificuldade: ${diffText}.
${contextBlock}

======================================================================
🚨 ÂNCORA ANTI-ALUCINAÇÃO (MANDATÓRIO):
======================================================================
Baseie as perguntas e respostas exclusivamente no conhecimento técnico real e na legislação vigente no Brasil.
Nunca invente legislação, números de artigos inexistentes, súmulas ou jurisprudências fictícias.
Se houver material fornecido pelo candidato, as questões devem ater-se aos limites temáticos do texto.

REGRAS OBRIGATÓRIAS DE QUALIDADE PEDAGÓGICA (PADRÃO ZION):
1. ${typeInstructions(type)}
2. Em questões objetivas, apenas UMA alternativa inequivocamente correta — as demais devem estar claramente erradas para quem domina o conteúdo, sem ambiguidade.
3. O enunciado deve ser claro, autocontido, elaborado e refletir com exatidão o formato e a malícia típica da banca.
4. As alternativas erradas (distratores) devem ser altamente verossímeis e representar erros conceituais clássicos que candidatos cometem sob pressão.
5. NÃO invente leis, artigos, números ou datas; baseie-se exclusivamente no ordenamento real.
6. A explicação ("explanation") deve ser completa, didática e aprofundada:
   - Justificar a resposta correta citando o fundamento legal (lei, artigo, súmula ou teoria pacificada);
   - Explicar por que cada alternativa incorreta está errada;
   - Destacar a pegadinha clássica da banca para que o estudante memorize o padrão.
7. Varie e equilibre a posição da alternativa correta.
8. Use linguagem formal e técnica adequada para concursos públicos.

Responda APENAS com JSON válido no seguinte formato, sem markdown ou texto adicional:
{"questions":[${exampleItem(type, params.difficulty ?? 'MEDIUM')}]}`;
}

export function prepareExamTextForSubject(
  examContent: string,
  subjectName?: string,
  maxChars = 160000,
): string {
  const text = examContent.trim();
  if (text.length <= maxChars) {
    return text;
  }

  const cleanSubject = subjectName?.trim().toUpperCase();
  const isGeneric =
    !cleanSubject ||
    ['TODAS AS MATÉRIAS', 'TODAS', 'GERAL', 'PROVAS ANTERIORES', 'SIMULADO'].includes(cleanSubject);

  if (!isGeneric) {
    const subjectPatterns = [
      new RegExp(`(?:^|\\n)\\s*(?:conhecimentos\\s+espec[íi]ficos\\s*[-–:]?\\s*)?${cleanSubject}`, 'i'),
      new RegExp(`(?:no[çc][õo]es\\s+de\\s+)?${cleanSubject}`, 'i'),
    ];

    let foundIdx = -1;
    for (const pattern of subjectPatterns) {
      const match = pattern.exec(text);
      if (match && match.index >= 0) {
        foundIdx = match.index;
        break;
      }
    }

    if (foundIdx >= 0) {
      const start = Math.max(0, foundIdx - 1000);
      const end = Math.min(text.length, start + maxChars);
      return text.slice(start, end);
    }
  }

  const windows = 4;
  const windowSize = Math.floor(maxChars / windows);
  const step = Math.max(windowSize, Math.floor((text.length - windowSize) / (windows - 1)));
  const parts: string[] = [];
  for (let i = 0; i < windows; i++) {
    const start = Math.min(i * step, text.length - windowSize);
    parts.push(text.slice(start, start + windowSize));
  }
  return parts.join('\n\n[... continuidade do texto da prova ...]\n\n');
}

export function buildExamSlicerPrompt(params: ExamSlicerParams): string {
  const randomSeed = Date.now() % 10000;
  const quantity = params.quantity ?? 10;
  const targetSubject = params.subjectName?.trim();
  const isSpecificSubject =
    targetSubject &&
    !['Todas as Matérias', 'Todas', 'Geral', 'Provas Anteriores', 'Simulado'].includes(targetSubject);

  const subjectDirective = isSpecificSubject
    ? `\n🎯 DIRETRIZ DE MATÉRIA OBRIGATÓRIA:
O candidato solicitou EXCLUSIVAMENTE a matéria: "${targetSubject}".
- Você DEVE percorrer todo o texto da prova e extrair UNICAMENTE questões pertencentes a "${targetSubject}".
- É TERMINANTEMENTE PROIBIDO extrair questões de outras matérias quando esta disciplina for especificada.
- Se houver mais de ${quantity} questões desta matéria, selecione as ${quantity} mais representativas e bem formuladas.\n`
    : `\n🎯 DIRETRIZ GERAL:
O candidato solicitou extração ampla da prova. Percorra todo o texto e extraia ${quantity} questões distribuídas harmonicamente pelas diversas disciplinas presentes na prova.\n`;

  const answerKeyBlock = params.answerKeyContent
    ? `\n📋 GABARITO OFICIAL FORNECIDO (Valide rigorosamente o gabarito de cada questão contra este documento oficial):\n${params.answerKeyContent.slice(0, 20000)}\n`
    : '';

  const examText = prepareExamTextForSubject(params.examContent, targetSubject, 160000);

  return `Você é um analista sênior e professor especializado em Provas de Concursos Públicos Brasileiros (estilo CEBRASPE, FGV, FCC, VUNESP, etc.).
Sua missão é extrair com máxima precisão e fidelidade ${quantity} questões reais do texto da prova fornecida, estruturando-as com comentários de altíssimo valor pedagógico para estudo aprofundado.
Semente de variação: ${randomSeed}.

${subjectDirective}

REGRAS DE EXTRAÇÃO E FORMATAÇÃO:
1. Extraia até ${quantity} questões objetivas completas presentes no documento da prova.
2. Identifique se a questão possui texto-base de suporte/interpretação (artigo, poema, situação-problema compartilhada) e preencha "referenceText" com o texto de apoio correspondente (se não houver, use null).
3. "statement": Enunciado fiel, claro e completo da questão (sem truncar).
4. "alternatives": Array com a letra (A, B, C, D, E ou C, E) e o texto integral de cada alternativa da prova.
5. "correctAnswer": Letra oficial da resposta correta (A-E ou C/E), conferida com o gabarito oficial se fornecido.
6. "explanation" (OBRIGATÓRIO SER RICO, FUNDAMENTADO E ESTRUTURADO):
   A explicação DEVE ser detalhada, aprofundada e formatada obrigatoriamente com os seguintes blocos:
   - 💡 **Gabarito e Síntese**: Justifique por que a alternativa correta é a verdadeira de forma clara e direta.
   - 📖 **Fundamentação & Fontes**: Cite expressamente os artigos de lei (CF/88, Códigos, Legislação Específica), súmulas vinculantes ou jurisprudência pacífica (STF/STJ), regras gramaticais ou conceitos técnicos normativos.
   - 🔍 **Análise dos Distratores**: Aponte de forma cirúrgica onde está o erro de cada uma das alternativas incorretas, demonstrando o que as torna falsas.
   - ⚠️ **Dica do Especialista / Pegadinha da Banca**: Alerte sobre pegadinhas típicas (palavras de restrição como "apenas/sempre/nunca", inversões de competência, trocas conceituais).

TEXTO DA PROVA:
${examText}
${answerKeyBlock}

Responda APENAS com JSON estrito no formato abaixo, sem markdown ou caracteres fora do JSON:
{
  "questions": [
    {
      "statement": "Enunciado fiel da questão",
      "referenceText": "Texto de apoio se houver, ou null",
      "alternatives": [
        { "letter": "A", "text": "Texto da alternativa A" },
        { "letter": "B", "text": "Texto da alternativa B" }
      ],
      "correctAnswer": "A",
      "explanation": "💡 **Gabarito e Síntese**: ...\\n\\n📖 **Fundamentação & Fontes**: ...\\n\\n🔍 **Análise dos Distratores**: ...\\n\\n⚠️ **Dica do Especialista**: ..."
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


export interface ZionEditalTree {
  banca: string;
  cargo: string;
  subjects: Array<{
    name: string;
    weight: 'alta' | 'media' | 'baixa';
    topics: Array<{
      name: string;
      subtopics: string[];
    }>;
  }>;
}

export function extractRelevantEditalContent(editalText: string, maxLen = 250000): string {
  // Localiza o início formal do Conteúdo Programático / Objetos de Avaliação
  const specificRegex = /(\b\d+\s*[-–—.]?\s*(?:dos\s+objetos\s+de\s+avalia[çc][ãa]o|do\s+conte[úu]do\s+program[áa]tico|dos\s+conte[úu]dos\s+program[áa]ticos)|anexo\s+[ivx0-9]+\s*[-–—:]\s*(?:conte[úu]do\s+program[áa]tico|objetos?\s+de\s+avalia[çc][ãa]o|programa)|conte[úu]do\s+program[áa]tico)/i;
  const match = specificRegex.exec(editalText);

  if (match && match.index > 3000) {
    const header = editalText.slice(0, 5000);
    const body = editalText.slice(match.index);
    if (body.length > maxLen - 6000) {
      return `[CABEÇALHO DO EDITAL]\n${header}\n\n[CONTEÚDO PROGRAMÁTICO COMPLETO (OBJETOS DE AVALIAÇÃO)]\n${body.slice(0, maxLen - 6000)}`;
    }
    return `[CABEÇALHO DO EDITAL]\n${header}\n\n[CONTEÚDO PROGRAMÁTICO COMPLETO (OBJETOS DE AVALIAÇÃO)]\n${body}`;
  }

  if (editalText.length <= maxLen) {
    return editalText;
  }

  // Fallback: se não achar pelo regex específico, pega início e final onde normalmente estão os anexos
  const half = Math.floor(maxLen / 2);
  const head = editalText.slice(0, half);
  const tail = editalText.slice(-half);
  return `${head}\n\n[... texto intermediário omitido ...]\n\n${tail}`;
}

export function buildZionEditalExtractionPrompt(editalText: string): string {
  const relevantText = extractRelevantEditalContent(editalText, 250000);

  return `Você é um analista sênior de editais de concursos públicos de máxima precisão.
Sua missão é extrair a árvore hierárquica COMPLETA e EXAUSTIVA de TODAS as matérias, especialidades e tópicos do edital, SEM EXCEÇÃO.

REGRAS OBRIGATÓRIAS DE EXAUSTIVIDADE (SEM EXCEÇÃO):
1. EXTRAÇÃO DE TODAS AS MATÉRIAS E ESPECIALIDADES:
   - Extraia TODAS as matérias de conhecimentos gerais (ex: Língua Portuguesa, Legislação, Raciocínio Lógico, Informática, Primeiros Socorros, etc.).
   - Se o edital contiver conhecimentos específicos comuns e conhecimentos por especialidade (como TDAS - Agente Social, TDAS - Cuidador Social, TDAS - Técnico Administrativo, EDAS - Administração, EDAS - Ciências Contábeis, EDAS - Comunicação Social, EDAS - Direito, EDAS - Economia, EDAS - Educador Social, EDAS - Estatística, EDAS - Nutrição, EDAS - Pedagogia, EDAS - Psicologia, EDAS - Serviço Social, EDAS - Sociologia, etc.):
   - CADA UMA dessas especialidades DEVE SER OBRIGATORIAMENTE UMA ENTRADA INDIVIDUAL em "subjects", contendo todos os seus tópicos próprios.
   - É ESTRITAMENTE PROIBIDO criar um tópico chamado "Conhecimentos Específicos por Especialidade" ou agrupar os nomes das especialidades em subtópicos. As especialidades NÃO são subtópicos, elas são MATÉRIAS (subjects) e cada uma tem seus próprios tópicos numerados no edital.
   - Se o edital contiver 10, 15 ou 20 cargos/especialidades no conteúdo programático, a lista "subjects" DEVE conter todos os 10, 15 ou 20 itens correspondentes.
2. ESTRUTURA DE TÓPICOS E SUBTÓPICOS:
   - Para cada matéria/especialidade em "subjects", cada grande tema programático (ex: itens numerados 1, 2, 3...) é um item em "topics".
   - Os detalhamentos (itens 1.1, 1.2, ou desdobramentos de conteúdo) são a lista de strings em "subtopics".
   - "subtopics" DEVE ser OBRIGATORIAMENTE um array de strings puras, NUNCA objetos.
3. ÂNCORA ANTI-ALUCINAÇÃO:
   - Extraia rigorosamente apenas o que está no texto fornecido, sem adicionar ou inventar itens externos, preservando os termos exatos do edital.

Você deve responder APENAS com um JSON estrito seguindo este formato:
{
  "banca": "string",
  "cargo": "string",
  "subjects": [
    {
      "name": "Nome da Matéria / Especialidade",
      "weight": "alta|media|baixa",
      "topics": [
        {
          "name": "Nome do Tópico",
          "subtopics": ["Subtópico 1", "Subtópico 2"]
        }
      ]
    }
  ]
}
Se for impossível identificar a banca ou cargo, retorne "Não identificada" ou "Diversos". O peso ("weight") deve ser inferido com base na quantidade de tópicos ou relevância no edital ("alta", "media" ou "baixa").

Texto extraído do edital:

${relevantText}`;
}

export function buildZionProbabilityPrompt(topicsTree: ZionEditalTree, banca: string): string {
  return `Você é um estatístico e estrategista de concursos altamente especializado em analisar o histórico das bancas examinadoras.
Sua missão é classificar a probabilidade de cada tópico de uma árvore do edital cair na prova real, baseado APENAS no perfil histórico da banca informada: ${banca}.

Perfis históricos conhecidos embutidos:
${BANCA_PROFILES}

Âncora anti-alucinação OBRIGATÓRIA:
Baseie suas análises apenas no perfil histórico conhecido da banca. NUNCA invente dados ou porcentagens estapafúrdias. Se a banca for desconhecida ou não houver informação suficiente, RETORNE 'probability': 'media' e justifique afirmando: 'Banca sem histórico suficiente para análise precisa'.

Retorne um JSON OBRIGATÓRIO no seguinte formato:
{
  "analysis": [
    {
      "subjectName": "string (exata ao enviado)",
      "topicName": "string (exata ao enviado)",
      "probability": "alta|media|baixa",
      "justification": "Razão breve baseada no histórico."
    }
  ]
}

Banca Informada: ${banca}
Árvore de Tópicos do Edital Extraída:
${JSON.stringify(topicsTree, null, 2)}

Por favor, classifique as probabilidades por matéria/tópico e retorne o JSON estruturado.`;
}

export interface ZionSchedulePromptInput {
  subjects: string[];
  examDate: string;
  dailyHours: number;
  performanceData?: Record<string, number> | null;
  probabilityData?: Record<string, string> | null;
  editalFileText?: string | null;
  banca?: string | null;
  userObservations?: string | null;
  availability?: string | null;
}

export function buildZionSchedulePrompt(input: ZionSchedulePromptInput): string {
  const hasPerformance = input.performanceData && Object.keys(input.performanceData).length > 0;
  const hasProbability = input.probabilityData && Object.keys(input.probabilityData).length > 0;
  const hasEditalFile = Boolean(input.editalFileText);

  return `Você é um planejador de estudos especializado em concursos.
Sua missão é criar uma SEMANA MODELO (Ciclo de Estudos Base) de alto rendimento.
Esta única semana servirá como template e será repetida pelo sistema até o dia da prova.

### 1. INTERLEAVING (REGRA ABSOLUTA):
Todo dia de estudo deve conter no mínimo 2 matérias diferentes. Um cronograma com uma única matéria por dia é pedagogicamente inferior e inaceitável.
- Carga 2h - 4h: 2 matérias.
- Carga 4h - 6h: 2 a 3 matérias.
Distribua as matérias em "blocos" de 1h a 2h no máximo.

### 2. ALTERNÂNCIA INTELIGENTE:
Classifique cada matéria como: Analítica, Memorização ou Mista. NUNCA coloque dois blocos da mesma categoria em sequência se houver opções. Intercale.

### 3. REVISÕES E QUESTÕES:
- Reserve cerca de 30% da carga para resolução de questões (crie blocos "questoes").
- Crie blocos específicos do tipo "revisao" (30 a 45 min) dentro do dia para a manutenção da memória (Ebbinghaus simplificado no ciclo).

### 4. SAÚDE, REALISMO E POMODORO:
- Respeite rigorosamente a carga diária de ${input.dailyHours} horas somando os blocos.
- Domingo: Máximo 1 bloco leve de revisão ou descanso total.

### 5. PERFIL DA BANCA E PARETO:
${input.banca ? `- Banca Atual: **${input.banca.toUpperCase()}**.\n` : ''}
${BANCA_PROFILES}
- Se houver dados de probabilidade alta, priorize blocos dessas matérias.

### FORMATO JSON OBRIGATÓRIO DE SAÍDA:
Verifique rigorosamente a estrutura. Retorne APENAS o JSON válido sem markdown extra.
{
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "base",
      "days": [
        {
          "dayOfWeek": "Segunda-feira",
          "type": "estudo|revisao|simulado|descanso|questoes",
          "totalHours": number,
          "blocks": [
            {
              "subject": "matéria (ou nulo)",
              "type": "estudo|revisao|questoes",
              "hours": number,
              "priority": "alta|normal|baixa",
              "revision": "R1|R2|R3|R4|null"
            }
          ]
        }
      ]
    }
  ]
}
Gere APENAS 1 SEMANA. Esta semana será o Ciclo Base do aluno.

DADOS DO USUÁRIO PARA CRONOGRAMA:

- Data da Prova: ${input.examDate}
- Carga Diária: ${input.dailyHours} horas (Gere os múltiplos blocos respeitando essa soma diária)
${input.banca ? `- Banca Informada: ${input.banca}` : '- Banca: Não Informada'}

${
  hasEditalFile
    ? `[CONTEÚDO PROGRAMÁTICO DO EDITAL]\n${extractRelevantEditalContent(input.editalFileText ?? '', 60000)}\n\n${
        input.subjects.length > 0 ? `[MATÉRIAS INFORMADAS PELO USUÁRIO]\n${input.subjects.join(', ')}` : ''
      }`
    : `[LISTA DE MATÉRIAS GERAIS]\n${input.subjects.join(', ')}`
}

${
  hasPerformance
    ? `[DESEMPENHO HISTÓRICO]\n${JSON.stringify(input.performanceData, null, 2)}`
    : `(Sem histórico de desempenho).`
}

${
  hasProbability
    ? `[ANÁLISE DE PROBABILIDADE (PARETO)]\n${JSON.stringify(input.probabilityData, null, 2)}`
    : `(Nenhuma análise de probabilidade disponível.)`
}

${
  input.userObservations
    ? `[OBSERVAÇÕES DO USUÁRIO]\n"${input.userObservations}"`
    : ''
}

INSTRUÇÃO FINAL: Retorne APENAS o JSON válido para 1 SEMANA (Ciclo Base).`;
}
