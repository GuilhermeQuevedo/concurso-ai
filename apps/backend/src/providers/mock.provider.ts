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

export class MockProvider implements IAIProvider {
  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const difficulties: Array<'EASY' | 'MEDIUM' | 'HARD'> = ['EASY', 'MEDIUM', 'HARD'];
    const questions: GeneratedQuestion[] = [];

    for (let i = 0; i < params.quantity; i++) {
      const diff = params.difficulty ?? difficulties[i % 3];
      questions.push({
        statement: `[MOCK] Questão ${i + 1} sobre ${params.subject}${params.topic ? ` — ${params.topic}` : ''}. ${params.examBoard ? `Estilo ${params.examBoard}.` : ''} Qual alternativa está correta?`,
        alternatives: [
          { letter: 'A', text: `Alternativa A da questão ${i + 1}` },
          { letter: 'B', text: `Alternativa B da questão ${i + 1}` },
          { letter: 'C', text: `Alternativa C da questão ${i + 1} (correta)` },
          { letter: 'D', text: `Alternativa D da questão ${i + 1}` },
          { letter: 'E', text: `Alternativa E da questão ${i + 1}` },
        ],
        correctAnswer: 'C',
        explanation: `Explicação detalhada da questão ${i + 1}. A alternativa C está correta porque aborda corretamente o conceito de ${params.subject}.`,
        difficulty: diff,
      });
    }

    return questions;
  }

  async gradeEssay(_params: GradeEssayParams): Promise<EssayGradeResult> {
    const cacScore = Math.floor(Math.random() * 10) + 25;
    const otScore = Math.floor(Math.random() * 10) + 20;
    const dlpScore = Math.floor(Math.random() * 10) + 20;
    const total = cacScore + otScore + dlpScore;

    return {
      score: total,
      maxScore: 100,
      feedback: `[MOCK] Sua redação demonstra bom domínio do tema proposto, com argumentação consistente e estrutura textual adequada. O texto apresenta introdução contextualizada, desenvolvimento com argumentos pertinentes e conclusão que retoma a tese principal.\n\nPontos fortes: boa articulação entre os parágrafos, uso adequado de conectivos e repertório sociocultural diversificado.\n\nPontos a melhorar: a proposta de intervenção poderia ser mais detalhada, com agentes, ações e meios mais específicos. Alguns desvios de concordância e regência foram identificados.\n\nNota final: ${total}/100.`,
      criteria: {
        cac: {
          score: cacScore,
          maxScore: 40,
          comments: '[MOCK] Conteúdo e Atendimento ao Comando: O candidato demonstrou compreensão do tema e atendeu ao comando da proposta. A abordagem é pertinente, com argumentos que dialogam com o recorte temático. Poderia aprofundar a discussão com mais exemplos concretos e dados estatísticos.',
        },
        ot: {
          score: otScore,
          maxScore: 30,
          comments: '[MOCK] Organização Textual: O texto apresenta estrutura dissertativo-argumentativa adequada, com introdução, desenvolvimento e conclusão bem delimitados. A progressão temática é satisfatória, embora alguns parágrafos pudessem ter melhor encadeamento lógico.',
        },
        dlp: {
          score: dlpScore,
          maxScore: 30,
          comments: '[MOCK] Domínio da Língua Portuguesa: Bom domínio da norma culta, com poucos desvios gramaticais. Vocabulário adequado ao gênero textual. Atenção a alguns problemas de concordância verbal e uso de crase.',
        },
      },
    };
  }

  async gradeCaseStudy(_params: GradeCaseStudyParams): Promise<CaseStudyResult> {
    return {
      score: 7.2,
      maxScore: 10,
      framing: '[MOCK] A questão pediu a análise de um caso e a proposta de solução fundamentada.',
      aspects: [
        { aspect: 'Identificação do problema central', situation: 'correto', points: 2, maxPoints: 2, justification: '[MOCK] O candidato identificou corretamente o problema, conforme trecho citado.' },
        { aspect: 'Fundamentação legal/normativa', situation: 'parcial', points: 1.5, maxPoints: 3, justification: '[MOCK] Citou a norma, mas não aprofundou a aplicação ao caso.' },
        { aspect: 'Proposta de solução viável', situation: 'correto', points: 3, maxPoints: 3, justification: '[MOCK] Solução aplicável e bem fundamentada.' },
      ],
      form: { strengths: '[MOCK] Texto coeso e organizado.', issues: '[MOCK] Alguns desvios de pontuação.', deduction: 0.5 },
      penalties: [{ reason: '[MOCK] Excedeu 2 linhas do limite', deduction: 0.3 }],
      calculation: 'Conteúdo 6,5 + Forma −0,5 − Penalidades 0,3 = 7,2 (mock)',
      feedback: [
        '[MOCK] Aprofunde a fundamentação legal aplicando a norma ao caso concreto.',
        '[MOCK] Revise a pontuação antes de entregar.',
        '[MOCK] Controle o número de linhas para não sofrer penalidade.',
      ],
    };
  }

  async parseEdital(params: ParseEditalParams): Promise<EditalParseResult> {
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 90);

    return {
      name: '[MOCK] SEEDF — Professor de Educação Básica',
      organization: 'Secretaria de Estado de Educação do Distrito Federal',
      examBoard: 'CESPE/CEBRASPE',
      role: 'Professor de Educação Básica — Sociologia',
      examDate: examDate.toISOString().slice(0, 10),
      focusDisciplines: params.focus
        ? ['Língua Portuguesa', 'Conhecimentos Pedagógicos', 'Sociologia']
        : null,
      syllabus: [
        {
          discipline: 'Língua Portuguesa',
          topics: [
            'Compreensão e interpretação de textos',
            'Tipologia textual e gêneros textuais',
            'Ortografia oficial e acentuação gráfica',
            'Concordância verbal e nominal',
            'Regência verbal e nominal',
          ],
        },
        {
          discipline: 'Conhecimentos Pedagógicos',
          topics: [
            'Lei de Diretrizes e Bases da Educação Nacional (LDB)',
            'Currículo em Movimento do Distrito Federal',
            'Avaliação educacional e institucional',
            'Gestão democrática na escola pública',
          ],
        },
        {
          discipline: 'Sociologia',
          topics: [
            'Clássicos da Sociologia: Durkheim, Weber e Marx',
            'Cultura, identidade e diversidade',
            'Estratificação e desigualdades sociais',
            'Movimentos sociais no Brasil',
            'Sociologia da educação',
          ],
        },
      ],
    };
  }

  async generateTopicContent(params: TopicContentParams): Promise<string> {
    return `## ${params.topic}

**[MOCK]** Material de estudo de exemplo para *${params.discipline}*.

### Conceitos essenciais
- Ponto-chave 1 do tópico "${params.topic}".
- Ponto-chave 2, com foco no que a banca costuma cobrar.
- Ponto-chave 3, relacionando o tópico a casos práticos.

### Mais cobrado em prova
- Definições e classificações costumam cair em questões objetivas.
- **Pegadinha comum:** trocar termos parecidos entre si.

### Dica de memorização
Associe cada conceito a um exemplo do dia a dia para fixar melhor.`;
  }

  async generateFlashcards(params: GenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
    const subject = params.subject ?? 'o tema estudado';
    return Array.from({ length: params.count }, (_, i) => ({
      front: `[MOCK] Pergunta ${i + 1} sobre ${subject}?`,
      back: `[MOCK] Resposta ${i + 1} baseada no conteúdo enviado, resumindo o conceito principal.`,
    }));
  }
}
