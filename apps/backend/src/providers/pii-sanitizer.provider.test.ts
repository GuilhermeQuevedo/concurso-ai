import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PIISanitizerAIProvider } from './pii-sanitizer.provider.js';
import type {
  IAIProvider,
  GradeEssayParams,
  GradeCaseStudyParams,
  GenerateFlashcardsParams,
  GenerateErrorRemediationParams,
  GenerateQuestionsParams,
  GenerateSummaryParams,
} from '../interfaces/ai.interfaces.js';

describe('PIISanitizerAIProvider (Decorator de Minimização de PII)', () => {
  let capturedEssayParams: GradeEssayParams | null = null;
  let capturedCaseStudyParams: GradeCaseStudyParams | null = null;
  let capturedFlashcardParams: GenerateFlashcardsParams | null = null;
  let capturedRemediationParams: GenerateErrorRemediationParams | null = null;
  let capturedQuestionsParams: GenerateQuestionsParams | null = null;
  let capturedSummaryParams: GenerateSummaryParams | null = null;

  const mockInnerProvider: IAIProvider = {
    gradeEssay: async (params) => {
      capturedEssayParams = params;
      return {
        score: 80,
        maxScore: 100,
        feedback: 'Bom texto',
        criteria: {
          cac: { score: 30, maxScore: 40, comments: 'Ok' },
          ot: { score: 25, maxScore: 30, comments: 'Ok' },
          dlp: { score: 25, maxScore: 30, comments: 'Ok' },
        },
      };
    },
    gradeCaseStudy: async (params) => {
      capturedCaseStudyParams = params;
      return {
        score: 85,
        maxScore: 100,
        framing: 'Adequado',
        aspects: [],
        form: { strengths: '', issues: '', deduction: 0 },
        penalties: [],
        calculation: '',
        feedback: ['Muito bom'],
      };
    },
    generateFlashcards: async (params) => {
      capturedFlashcardParams = params;
      return [{ front: 'O que é ato vinculado?', back: 'Aquele em que a lei não deixa margem de escolha.' }];
    },
    generateErrorRemediation: async (params) => {
      capturedRemediationParams = params;
      return [{ front: 'F', back: 'B', type: 'direct', explanation: 'Exp' }];
    },
    generateQuestions: async (params) => {
      capturedQuestionsParams = params;
      return [];
    },
    generateSummary: async (params) => {
      capturedSummaryParams = params;
      return 'Resumo';
    },
    extractQuestions: async () => [],
    parseEdital: async () => ({ name: '', organization: null, examBoard: null, role: null, examDate: null, syllabus: [] }),
    generateTopicContent: async () => '',
    answerQuestions: async () => [],
  };

  const provider = new PIISanitizerAIProvider(mockInnerProvider);

  it('deve sanitizar PII do conteúdo da redação antes de passar ao provedor', async () => {
    await provider.gradeEssay({
      theme: 'Direito Administrativo',
      content: 'Nome: Maria Silva Sauro CPF: 123.456.789-00 - Contato 11987654321.',
    });

    assert.ok(capturedEssayParams);
    assert.ok(!capturedEssayParams.content?.includes('123.456.789-00'));
    assert.ok(!capturedEssayParams.content?.includes('11987654321'));
    assert.ok(!capturedEssayParams.content?.includes('Maria Silva Sauro'));
    assert.ok(capturedEssayParams.content?.includes('[CPF REDIGIDO]'));
    assert.ok(capturedEssayParams.content?.includes('[TELEFONE REDIGIDO]'));
  });

  it('deve sanitizar PII em estudo de caso (enunciado, resposta e espelho)', async () => {
    await provider.gradeCaseStudy({
      caseStatement: 'O candidato João da Silva CPF 111.444.777-35 cometeu falta.',
      content: 'Meu e-mail joao@candidato.com e resposta...',
      answerKey: 'Espelho padrão.',
    });

    assert.ok(capturedCaseStudyParams);
    assert.ok(!capturedCaseStudyParams.caseStatement.includes('111.444.777-35'));
    assert.ok(!capturedCaseStudyParams.content?.includes('joao@candidato.com'));
    assert.ok(capturedCaseStudyParams.caseStatement.includes('[CPF REDIGIDO]'));
    assert.ok(capturedCaseStudyParams.content?.includes('[E-MAIL REDIGIDO]'));
  });

  it('deve sanitizar PII em flashcards, resumos e cadernos de erros', async () => {
    await provider.generateFlashcards({
      content: 'Contato do monitor: monitor@concursos.com.br e tel (21) 99999-8888.',
      count: 2,
    });
    assert.ok(capturedFlashcardParams);
    assert.ok(!capturedFlashcardParams.content.includes('monitor@concursos.com.br'));
    assert.ok(!capturedFlashcardParams.content.includes('99999-8888'));

    await provider.generateQuestions({
      subject: 'Direito Constitucional',
      quantity: 5,
      context: 'Informações do aluno Carlos (carlos@concurso.com.br, tel 11988887777).',
    });
    assert.ok(capturedQuestionsParams);
    assert.ok(!capturedQuestionsParams.context?.includes('carlos@concurso.com.br'));
    assert.ok(!capturedQuestionsParams.context?.includes('11988887777'));
    assert.ok(capturedQuestionsParams.context?.includes('[E-MAIL REDIGIDO]'));
    assert.ok(capturedQuestionsParams.context?.includes('[TELEFONE REDIGIDO]'));

    await provider.generateSummary({
      content: 'Anotações de Maria: maria@estudo.com - Art. 5º da CF.',
    });
    assert.ok(capturedSummaryParams);
    assert.ok(!capturedSummaryParams.content.includes('maria@estudo.com'));

    await provider.generateErrorRemediation({
      question: 'Questão do aluno João: joao@teste.com',
      userAnswer: 'Minha resposta assinada por Carlos Alberto Santos',
      correctAnswer: 'A',
      explanation: 'Gabarito oficial',
    });
    assert.ok(capturedRemediationParams);
    assert.ok(!capturedRemediationParams.question.includes('joao@teste.com'));
    assert.ok(!capturedRemediationParams.userAnswer?.includes('Carlos Alberto Santos'));
  });
});
