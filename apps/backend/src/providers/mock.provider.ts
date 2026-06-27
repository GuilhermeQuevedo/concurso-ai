import type { IAIProvider, GenerateQuestionsParams, GeneratedQuestion } from '../interfaces/ai.interfaces.js';

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
}
