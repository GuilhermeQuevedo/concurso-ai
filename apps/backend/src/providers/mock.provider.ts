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
  ExtractQuestionsParams,
  ZionEditalTree,
  ZionProbabilityItem,
  ZionScheduleWeek,
  ZionScheduleDay,
  ZionSchedulePromptParams,
  QuestionType,
  ErrorRemediationFlashcard,
} from '../interfaces/ai.interfaces.js';

function mockQuestion(
  i: number,
  type: QuestionType,
  params: GenerateQuestionsParams,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
): GeneratedQuestion {
  const base = `Questão ${i + 1} sobre ${params.subject}${params.topic ? ` — ${params.topic}` : ''}.`;
  const explanation = `Explicação detalhada e fundamentação legal/doutrinária da questão ${i + 1} sobre ${params.subject}.`;
  if (type === 'ESSAY') {
    return { statement: `${base} Explique os fundamentos e a aplicação prática do conceito principal.`, alternatives: [], correctAnswer: 'S', explanation, difficulty };
  }
  if (type === 'TRUE_FALSE') {
    return {
      statement: `${base} Julgue a assertiva a seguir com base na jurisprudência dominante e legislação aplicável.`,
      alternatives: [{ letter: 'C', text: 'Certo' }, { letter: 'E', text: 'Errado' }],
      correctAnswer: i % 2 === 0 ? 'C' : 'E',
      explanation,
      difficulty,
    };
  }
  const letters = type === 'MULTIPLE_4' ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
  return {
    statement: `${base} Considerando os princípios que regem a matéria, assinale a alternativa correta:`,
    alternatives: letters.map((letter) => ({ letter, text: `Alternativa ${letter}: proposição analítica referente ao tópico ${i + 1}${letter === 'C' ? ' (gabarito correto)' : ''}.` })),
    correctAnswer: 'C',
    explanation,
    difficulty,
  };
}

export class MockProvider implements IAIProvider {
  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const difficulties: Array<'EASY' | 'MEDIUM' | 'HARD'> = ['EASY', 'MEDIUM', 'HARD'];
    const mixed: QuestionType[] = ['MULTIPLE_5', 'MULTIPLE_4', 'TRUE_FALSE', 'ESSAY'];
    const questions: GeneratedQuestion[] = [];

    for (let i = 0; i < params.quantity; i++) {
      const type = params.questionType === 'MIXED' ? mixed[i % mixed.length] : (params.questionType ?? 'MULTIPLE_5');
      questions.push(mockQuestion(i, type, params, params.difficulty ?? difficulties[i % 3]));
    }
    return questions;
  }

  async extractQuestions(params: ExtractQuestionsParams): Promise<GeneratedQuestion[]> {
    return [
      {
        statement: `Questão extraída do documento${params.subject ? ` referente a ${params.subject}` : ''}. Qual alternativa está correta?`,
        alternatives: [
          { letter: 'A', text: 'Alternativa A' },
          { letter: 'B', text: 'Alternativa B (correta)' },
          { letter: 'C', text: 'Alternativa C' },
          { letter: 'D', text: 'Alternativa D' },
          { letter: 'E', text: 'Alternativa E' },
        ],
        correctAnswer: 'B',
        explanation: 'Justificativa fundamentada da assertiva correta com base no texto analisado.',
        difficulty: 'MEDIUM',
      },
    ];
  }

  async gradeEssay(_params: GradeEssayParams): Promise<EssayGradeResult> {
    const cacScore = Math.floor(Math.random() * 10) + 25;
    const otScore = Math.floor(Math.random() * 10) + 20;
    const dlpScore = Math.floor(Math.random() * 10) + 20;
    const total = cacScore + otScore + dlpScore;

    return {
      score: total,
      maxScore: 100,
      feedback: `Sua redação demonstra bom domínio do tema proposto, com argumentação consistente e estrutura textual adequada. O texto apresenta introdução contextualizada, desenvolvimento com argumentos pertinentes e conclusão que retoma a tese principal.\n\nPontos fortes: boa articulação entre os parágrafos, uso adequado de conectivos e repertório sociocultural diversificado.\n\nPontos a melhorar: a proposta de intervenção poderia ser mais detalhada, com agentes, ações e meios mais específicos.\n\nNota final: ${total}/100.`,
      criteria: {
        cac: {
          score: cacScore,
          maxScore: 40,
          comments: 'Conteúdo e Atendimento ao Comando: O candidato demonstrou compreensão do tema e atendeu ao comando da proposta. A abordagem é pertinente, com argumentos que dialogam com o recorte temático.',
        },
        ot: {
          score: otScore,
          maxScore: 30,
          comments: 'Organização Textual: O texto apresenta estrutura dissertativo-argumentativa adequada, com introdução, desenvolvimento e conclusão bem delimitados.',
        },
        dlp: {
          score: dlpScore,
          maxScore: 30,
          comments: 'Domínio da Língua Portuguesa: Bom domínio da norma culta, com vocabulário adequado ao gênero textual.',
        },
      },
    };
  }

  async gradeCaseStudy(_params: GradeCaseStudyParams): Promise<CaseStudyResult> {
    return {
      score: 7.2,
      maxScore: 10,
      framing: 'A questão demandou análise de situação concreta e proposição de solução juridicamente fundamentada.',
      aspects: [
        { aspect: 'Identificação do problema central', situation: 'correto', points: 2, maxPoints: 2, justification: 'O candidato identificou corretamente a questão controvertida principal.' },
        { aspect: 'Fundamentação legal/normativa', situation: 'parcial', points: 1.5, maxPoints: 3, justification: 'Citou a legislação de regência, mas poderia ter aprofundado a jurisprudência correlata.' },
        { aspect: 'Proposta de solução viável', situation: 'correto', points: 3, maxPoints: 3, justification: 'Solução aplicável e coerente com os postulados constitucionais.' },
      ],
      form: { strengths: 'Texto coeso e boa ordenação dos argumentos.', issues: 'Pequenos desvios de pontuação e transição entre períodos.', deduction: 0.5 },
      penalties: [{ reason: 'Excedeu 2 linhas do limite', deduction: 0.3 }],
      calculation: 'Conteúdo 6,5 + Forma −0,5 − Penalidades 0,3 = 7,2',
      feedback: [
        'Aprofunde a fundamentação jurídica aplicando o dispositivo legal diretamente ao caso.',
        'Revise a concordância e a pontuação antes da entrega.',
      ],
    };
  }

  async parseEdital(_params: ParseEditalParams): Promise<EditalParseResult> {
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 90);

    return {
      name: 'Concurso Público Unificado',
      organization: 'Órgão Demandante',
      examBoard: 'Banca Examinadora',
      role: 'Cargo Público / Especialidade',
      examDate: examDate.toISOString(),
      syllabus: [
        {
          discipline: 'Língua Portuguesa',
          topics: ['Compreensão e interpretação de textos', 'Ortografia oficial', 'Crase e regência'],
        },
        {
          discipline: 'Direito Constitucional',
          topics: ['Direitos e garantias fundamentais', 'Organização do Estado', 'Poder Judiciário'],
        },
      ],
    };
  }

  async generateTopicContent(params: TopicContentParams): Promise<string> {
    return `## ${params.topic}

Material de estudo essencial sobre ${params.discipline}.

### Conceitos essenciais
- Ponto-chave 1 do tópico "${params.topic}".
- Ponto-chave 2, com foco no perfil das principais bancas examinadoras.
- Ponto-chave 3, relacionando a norma à jurisprudência e casos práticos.

### Mais cobrado em prova
- Definições e classificações centrais do tema.
- Pegadinhas frequentes de banca: inversão de termos e prazos.

### Dica de memorização
Associe a regra geral à sua respectiva exceção para evitar confusões na hora da prova.`;
  }

  async generateFlashcards(params: GenerateFlashcardsParams): Promise<GeneratedFlashcard[]> {
    const subject = params.subject ?? 'Tema de Estudo';
    const rawSentences = params.content
      ? params.content
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 25 && s.length < 250)
      : [];

    return Array.from({ length: params.count }, (_, i) => {
      const sentence = rawSentences[i % Math.max(rawSentences.length, 1)];
      if (sentence) {
        return {
          front: `Segundo o material sobre ${subject}: qual o preceito central referente a "${sentence.slice(0, 80)}..."?`,
          back: sentence,
        };
      }
      return {
        front: `Qual é o preceito fundamental de ${subject} (Tópico ${i + 1})?`,
        back: `Conceito central e aplicação prática relevante sobre ${subject}.`,
      };
    });
  }

  async generateAdvancedFlashcards(params: {
    content: string;
    subject: string;
    count: number;
    mode?: 'standard' | 'cloze';
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    customFocus?: string;
  }): Promise<GeneratedFlashcard[]> {
    return this.generateFlashcards(params);
  }

  async generateErrorRemediation(params: {
    question: string;
    userAnswer?: string;
    correctAnswer: string;
    explanation: string;
  }): Promise<ErrorRemediationFlashcard[]> {
    return [
      {
        front: `[Direto] Sobre a questão: "${params.question.slice(0, 100)}...". Qual é a regra oficial?`,
        back: `Alternativa Correta: ${params.correctAnswer}\n\nFundamentação: ${params.explanation}`,
        type: 'direct',
        explanation: params.explanation,
      },
      {
        front: `[Lacuna Cloze] Conforme a fundamentação da questão: ${params.explanation.slice(0, 60)} _______`,
        back: params.correctAnswer,
        type: 'cloze',
        explanation: params.explanation,
      },
      {
        front: `[Certo/Errado] A afirmativa correspondente ao gabarito: "${params.correctAnswer}" está de acordo com a norma?`,
        back: 'CERTO',
        type: 'true_false',
        explanation: params.explanation,
      },
    ];
  }

  async generateSummary(params: GenerateSummaryParams): Promise<string> {
    const subject = params.subject ? ` de *${params.subject}*` : '';
    return `## Resumo${subject}

Resumo condensado com foco em retenção a partir do material enviado.

### Pontos principais
- Conceito central extraído do material.
- Aspectos de alta incidência em questões de concursos.
- Aplicação prática e correlação doutrinária.

### Para revisar
- Definições e classificações essenciais.
- Atenção às exceções legais e prazos.`;
  }

  async answerQuestions(params: AnswerQuestionsParams): Promise<string[]> {
    return params.questions.map(() => 'C');
  }
  async mapEditalZion(_editalText: string): Promise<ZionEditalTree> {
    return {
      banca: 'CEBRASPE',
      cargo: 'Técnico Judiciário',
      subjects: [
        {
          name: 'Língua Portuguesa',
          weight: 'alta',
          topics: [
            { name: 'Compreensão e interpretação de textos', subtopics: ['Tipologia textual', 'Coesão e coerência'] },
            { name: 'Ortografia e Acentuação gráfica', subtopics: ['Novo acordo ortográfico'] },
            { name: 'Sintaxe da oração e do período', subtopics: ['Concordância nominal e verbal', 'Regência e Crase'] }
          ]
        },
        {
          name: 'Direito Constitucional',
          weight: 'alta',
          topics: [
            { name: 'Direitos e Garantias Fundamentais', subtopics: ['Direitos individuais e coletivos (Art. 5º)', 'Remédios constitucionais'] },
            { name: 'Organização do Estado', subtopics: ['Competências da União, Estados e Municípios'] },
            { name: 'Poder Judiciário', subtopics: ['Disposições gerais', 'STF e STJ'] }
          ]
        },
        {
          name: 'Direito Administrativo',
          weight: 'alta',
          topics: [
            { name: 'Princípios da Administração Pública', subtopics: ['LIMPE e princípios implícitos'] },
            { name: 'Atos Administrativos', subtopics: ['Requisitos', 'Atributos', 'Extinção'] },
            { name: 'Licitações e Contratos (Lei 14.133/21)', subtopics: ['Modalidades licitatórias', 'Contratação direta'] }
          ]
        },
        {
          name: 'Raciocínio Lógico',
          weight: 'media',
          topics: [
            { name: 'Estruturas Lógicas e Proposições', subtopics: ['Tabelas-verdade', 'Equivalências lógicas'] },
            { name: 'Lógica de Argumentação', subtopics: ['Diagramas lógicos', 'Falácias'] }
          ]
        }
      ]
    };
  }

  async analyzeProbabilitiesZion(topicsTree: ZionEditalTree, banca: string): Promise<ZionProbabilityItem[]> {
    const analysis: ZionProbabilityItem[] = [];
    topicsTree.subjects.forEach(subject => {
      subject.topics.forEach((topic, idx) => {
        analysis.push({
          subjectName: subject.name,
          topicName: topic.name,
          probability: idx === 0 ? 'alta' : (idx === 1 ? 'media' : 'baixa'),
          justification: `Historicamente cobrado com alta incidência pela banca ${banca}.`
        });
      });
    });
    return analysis;
  }

  async generateScheduleZion(input: ZionSchedulePromptParams): Promise<{ weeks: ZionScheduleWeek[] }> {
    const subjects = input.subjects.length > 0 ? input.subjects : ['Língua Portuguesa', 'Direito Constitucional', 'Direito Administrativo', 'Raciocínio Lógico'];
    const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    
    const days: ZionScheduleDay[] = daysOfWeek.map((dayName, idx) => {
      if (idx === 6) {
        return {
          date: '',
          dayOfWeek: dayName,
          type: 'descanso',
          totalHours: 1,
          blocks: [
            {
              order: 1,
              subject: 'Revisão Leve',
              type: 'revisao',
              hours: 1,
              priority: 'baixa',
              revision: 'R1',
              notes: 'Pomodoro: 2 ciclos de 25m'
            }
          ],
          completed: false
        };
      }
      
      const sub1 = subjects[idx % subjects.length];
      const sub2 = subjects[(idx + 1) % subjects.length];
      const halfHours = Number((input.dailyHours / 2).toFixed(1));

      return {
        date: '',
        dayOfWeek: dayName,
        type: 'estudo',
        totalHours: input.dailyHours,
        blocks: [
          {
            order: 1,
            subject: sub1,
            type: 'estudo',
            hours: halfHours,
            priority: 'alta',
            revision: null,
            notes: `Pomodoro: ${Math.ceil(halfHours * 2)} ciclos de 25m`
          },
          {
            order: 2,
            subject: sub2,
            type: idx % 2 === 0 ? 'questoes' : 'estudo',
            hours: Number((input.dailyHours - halfHours).toFixed(1)),
            priority: 'normal',
            revision: null,
            notes: `Pomodoro: ${Math.ceil((input.dailyHours - halfHours) * 2)} ciclos de 25m`
          }
        ],
        completed: false
      };
    });

    return {
      weeks: [
        {
          weekNumber: 1,
          phase: 'base',
          days
        }
      ]
    };
  }

}
