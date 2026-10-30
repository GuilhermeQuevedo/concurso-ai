import type { IAIProvider, ErrorRemediationFlashcard } from '../interfaces/ai.interfaces.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';

export interface PendingErrorDTO {
  id: string;
  questionId: string;
  statement: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  subjectName: string;
  subjectId: string;
  originTitle: string;
  originType: 'SIMULADO' | 'FLASHCARD';
  createdAt: Date;
}

export interface SimuladoErrorItemDTO {
  questionId?: string;
  statement: string;
  alternatives?: Array<{ letter: string; text: string }>;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  subjectName?: string;
}

export interface RecordSimuladoErrorsDTO {
  simuladoTitle?: string;
  errors: SimuladoErrorItemDTO[];
}

export interface GenerateRemediationDTO {
  questionId?: string;
  questionText?: string;
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  subjectId?: string;
  deckName?: string;
}

export class ErrorNotebookService {
  constructor(private readonly aiProvider: IAIProvider) {}

  async listPendingErrors(userId: string): Promise<PendingErrorDTO[]> {
    const pendingErrors: PendingErrorDTO[] = [];

    // 1. Busca todos os Flashcards marcados com status 'incorrect', 'doubt' ou 'Caderno de Erros' (Mecanismo Zion)
    const flashcardErrors = await prisma.flashcard.findMany({
      where: {
        userId,
        source: { in: ['incorrect', 'doubt', 'Caderno de Erros'] },
      },
      include: {
        deck: true,
        subject: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    for (const card of flashcardErrors) {
      pendingErrors.push({
        id: card.id,
        questionId: card.id,
        statement: card.front,
        userAnswer: card.source === 'doubt' ? 'Em dúvida' : 'Errei',
        correctAnswer: card.back,
        explanation: card.elaboration || card.back,
        subjectName: card.subject?.name ?? 'Flashcards',
        subjectId: card.subjectId,
        originTitle: card.deck?.name ?? 'Flashcard',
        originType: 'FLASHCARD',
        createdAt: card.updatedAt,
      });
    }

    // 2. Busca tentativas de Simulados registradas em QuestionAttempt (ordenadas da mais recente para a mais antiga)
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        question: {
          include: { subject: true },
        },
      },
    });

    const seenQuestions = new Set<string>();
    for (const attempt of attempts) {
      if (!attempt.question || seenQuestions.has(attempt.questionId)) continue;
      seenQuestions.add(attempt.questionId);

      // Se a tentativa mais recente da questão foi correta (ou marcada como aprendida), não exibe no caderno de erros
      if (attempt.isCorrect) continue;

      let originTitle = 'Simulado';
      let originType: 'SIMULADO' | 'FLASHCARD' = 'SIMULADO';

      if (attempt.question.comments && Array.isArray(attempt.question.comments)) {
        const commentsList = attempt.question.comments as Array<{
          originType?: string;
          originTitle?: string;
        }>;
        const meta = commentsList.find((c) => c && typeof c === 'object' && c.originType);
        if (meta) {
          if (meta.originTitle) originTitle = meta.originTitle;
          if (meta.originType === 'FLASHCARD' || meta.originType === 'SIMULADO') {
            originType = meta.originType;
          }
        }
      }

      // Evita duplicar se já foi trazido como flashcard
      if (!pendingErrors.some((e) => e.statement === attempt.question.statement)) {
        pendingErrors.push({
          id: attempt.id,
          questionId: attempt.questionId,
          statement: attempt.question.statement,
          userAnswer: attempt.answer,
          correctAnswer: attempt.question.correctAnswer,
          explanation: attempt.question.explanation,
          subjectName: attempt.question.subject?.name ?? 'Geral',
          subjectId: attempt.question.subjectId,
          originTitle,
          originType,
          createdAt: attempt.createdAt,
        });
      }
    }

    // Ordenação decrescente: erros mais recentes primeiro (igual à Zion)
    return pendingErrors.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async markAsLearned(userId: string, id: string): Promise<{ success: boolean }> {
    // 1. Se for um Flashcard (por id), atualiza status para 'correct' para remoção imediata
    const card = await prisma.flashcard.findUnique({ where: { id } });
    if (card && card.userId === userId) {
      await prisma.flashcard.update({
        where: { id },
        data: { source: 'correct' },
      });
      return { success: true };
    }

    // 2. Se for um QuestionAttempt existente (se o id passado for do QuestionAttempt)
    const existingAttempt = await prisma.questionAttempt.findUnique({ where: { id } });
    const targetQuestionId = existingAttempt ? existingAttempt.questionId : id;

    // 3. Atualiza todas as tentativas dessa questão para o usuário como corretas
    await prisma.questionAttempt.updateMany({
      where: { userId, questionId: targetQuestionId },
      data: { isCorrect: true },
    });

    // 4. Garante registro de acerto/revisão concluída caso a questão exista
    const question = await prisma.question.findUnique({ where: { id: targetQuestionId } });
    if (question) {
      await prisma.questionAttempt.create({
        data: {
          userId,
          questionId: targetQuestionId,
          answer: 'ACERTOU_REVISAO',
          isCorrect: true,
          timeSpent: 0,
        },
      });
    }

    return { success: true };
  }

  async recordSimuladoErrors(
    userId: string,
    dto: RecordSimuladoErrorsDTO,
  ): Promise<{ recorded: number; deckId: string | null; deckTitle: string }> {
    if (!dto.errors || dto.errors.length === 0) {
      return { recorded: 0, deckId: null, deckTitle: '' };
    }

    const subject = await this.ensureSubject();
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const deckTitle = dto.simuladoTitle?.trim()
      ? `Erros: ${dto.simuladoTitle.trim()}`
      : `Erros do Simulado - ${todayStr}`;

    let deck = await prisma.flashcardDeck.findFirst({
      where: {
        userId,
        name: deckTitle,
      },
    });

    if (!deck) {
      deck = await prisma.flashcardDeck.create({
        data: {
          userId,
          name: deckTitle,
          subjectId: subject.id,
          color: '#f59e0b',
          topic: 'Caderno de Erros',
        },
      });
    }

    for (const err of dto.errors) {
      let qId = err.questionId;
      if (qId) {
        const exists = await prisma.question.findUnique({ where: { id: qId } });
        if (!exists) {
          qId = undefined;
        }
      }

      if (!qId) {
        const newQuestion = await prisma.question.create({
          data: {
            statement: err.statement,
            alternatives: err.alternatives ?? [],
            correctAnswer: err.correctAnswer,
            difficulty: 'MEDIUM',
            explanation: err.explanation,
            comments: [
              {
                originType: 'SIMULADO',
                originTitle: deckTitle,
              },
            ],
            subjectId: subject.id,
            source: 'AI_GENERATED',
          },
        });
        qId = newQuestion.id;
      }

      await prisma.questionAttempt.create({
        data: {
          userId,
          questionId: qId,
          answer: err.userAnswer || 'N/A',
          isCorrect: false,
          timeSpent: 0,
        },
      });

      // Cria flashcard com source: 'incorrect' (Mecanismo Zion)
      await prisma.flashcard.create({
        data: {
          userId,
          subjectId: subject.id,
          deckId: deck.id,
          front: `[Erro em Simulado] ${err.statement}`,
          back: `**Alternativa Correta:** ${err.correctAnswer}\n\n**Comentário do Professor:**\n${err.explanation}`,
          source: 'incorrect',
        },
      });
    }

    return {
      recorded: dto.errors.length,
      deckId: deck.id,
      deckTitle,
    };
  }

  async generateRemediationCards(
    userId: string,
    dto: GenerateRemediationDTO,
  ): Promise<{ flashcards: ErrorRemediationFlashcard[]; deckId: string }> {
    let question = dto.questionText?.trim() ?? '';
    let explanation = dto.explanation?.trim() ?? '';
    let correctAnswer = dto.correctAnswer?.trim() ?? '';
    let targetSubjectId = dto.subjectId;

    if (dto.questionId) {
      const q = await prisma.question.findUnique({
        where: { id: dto.questionId },
        include: { subject: true },
      });
      if (q) {
        question = q.statement;
        explanation = q.explanation;
        correctAnswer = q.correctAnswer;
        targetSubjectId = targetSubjectId ?? q.subjectId;
      } else {
        // Pode ser id de um Flashcard
        const card = await prisma.flashcard.findUnique({
          where: { id: dto.questionId },
          include: { subject: true },
        });
        if (card) {
          question = card.front;
          correctAnswer = card.back;
          explanation = card.elaboration || card.back;
          targetSubjectId = targetSubjectId ?? card.subjectId;
        }
      }
    }

    if (!question || !explanation) {
      throw new AppError(400, 'INVALID_ERROR_DATA', 'Enunciado e explicação são obrigatórios para a remediação.');
    }

    if (!this.aiProvider.generateErrorRemediation) {
      throw new AppError(500, 'AI_PROVIDER_ERROR', 'Provedor de IA não suporta remediação de erro.');
    }

    const cards = await this.aiProvider.generateErrorRemediation({
      question,
      userAnswer: dto.userAnswer,
      correctAnswer: correctAnswer || 'Gabarito Oficial',
      explanation,
    });

    const subject = await this.ensureSubject(targetSubjectId);

    let deck = await prisma.flashcardDeck.findFirst({
      where: {
        userId,
        name: dto.deckName ?? 'Caderno de Erros - Revisão Ativa',
      },
    });

    if (!deck) {
      deck = await prisma.flashcardDeck.create({
        data: {
          userId,
          name: dto.deckName ?? 'Caderno de Erros - Revisão Ativa',
          subjectId: subject.id,
          color: '#f59e0b',
        },
      });
    }

    await prisma.$transaction(
      cards.map((c) =>
        prisma.flashcard.create({
          data: {
            userId,
            subjectId: subject.id,
            deckId: deck.id,
            front: c.front,
            back: `${c.back}\n\n**Fundamentação:**\n${c.explanation}`,
            source: 'Caderno de Erros',
          },
        }),
      ),
    );

    return { flashcards: cards, deckId: deck.id };
  }

  private async ensureSubject(subjectId?: string) {
    if (subjectId) {
      const existing = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (existing) return existing;
    }
    const defaultSubject = await prisma.subject.findFirst({ where: { name: 'Caderno de Erros' } });
    if (defaultSubject) return defaultSubject;

    return prisma.subject.create({
      data: { name: 'Caderno de Erros' },
    });
  }
}
