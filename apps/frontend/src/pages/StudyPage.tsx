import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import {
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Flag,
} from 'lucide-react';
import { BankOriginBadge } from '@/features/questions/components/BankOriginBadge';
import type { QuestionDTO } from '@/features/questions/services/question.service';
import { QuestionCard } from '@/features/study/components/QuestionCard';
import { StudyFeedbackBanner } from '@/features/study/components/StudyFeedbackBanner';
import { studyService } from '@/features/study/services/study.service';
import { errorNotebookService } from '@/features/error-notebook/services/error-notebook.service';
import { ResultsView, type QuestionState } from '@/features/study/components/ResultsView';
import { htmlToPlainText } from '@/lib/html';

type StudyMode = 'STUDY' | 'EXAM';
type Format = 'MULTIPLE' | 'TRUE_FALSE' | 'ESSAY';

interface LocationState {
  questions: QuestionDTO[];
  mode: StudyMode;
  title?: string;
  subjectId?: string;
  examBoardId?: string;
  difficulty?: string;
}

const SELF_RIGHT = 'S';
const SELF_WRONG = 'N';

function formatOf(q: QuestionDTO): Format {
  if (q.alternatives.length === 0) return 'ESSAY';
  return q.alternatives.length === 2 ? 'TRUE_FALSE' : 'MULTIPLE';
}

function clock(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function StudyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const questions = state?.questions ?? [];
  const mode = state?.mode ?? 'STUDY';
  const simuladoTitle = state?.title ?? 'Simulado';

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [states, setStates] = useState<Record<string, QuestionState>>({});
  const [elapsed, setElapsed] = useState(0);
  const [stats, setStats] = useState<{ total: number; correct: number; wrong: number; accuracy: number; totalTime: number } | null>(null);
  const questionTimer = useRef(0);
  const clockRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!state || questions.length === 0) {
      navigate('/generate', { replace: true });
      return;
    }
    const initial: Record<string, QuestionState> = {};
    for (const q of questions) {
      initial[q.id] = { selectedAnswer: null, result: null, timeSpent: 0, favorited: false, revealed: false, draft: '' };
    }
    setStates(initial);
    studyService
      .createSession({
        mode,
        questionIds: questions.map((q) => q.id),
        subjectId: state.subjectId,
        examBoardId: state.examBoardId,
        difficulty: state.difficulty,
      })
      .then((res) => setSessionId(res.session.id));
  }, []);

  useEffect(() => {
    clockRef.current = setInterval(() => {
      setElapsed((s) => s + 1);
      questionTimer.current += 1;
    }, 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  const question = questions[index];
  const current = question ? states[question.id] : undefined;
  const answered = Object.values(states).filter((s) => s.result !== null).length;
  const isAnswered = !!current?.result;
  const showFeedback = isAnswered && mode === 'STUDY';
  const format = question ? formatOf(question) : 'MULTIPLE';
  const isLast = index === questions.length - 1;

  const patch = useCallback((id: string, p: Partial<QuestionState>) => {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));
  }, []);

  const submit = useMutation({
    mutationFn: (v: { questionId: string; answer: string }) => {
      if (!sessionId) return Promise.reject(new Error('Sessão não iniciada'));
      return studyService.submitAnswer(sessionId, { ...v, timeSpent: questionTimer.current });
    },
    onSuccess: (result, v) => {
      patch(v.questionId, { result, selectedAnswer: v.answer, timeSpent: questionTimer.current });
      questionTimer.current = 0;
    },
  });

  // Sincroniza todos os erros do simulado diretamente no Caderno de Erros (Zion standard)
  const syncErrorsToNotebook = async (finalStates: Record<string, QuestionState>) => {
    const wrongQuestions = questions.filter((q) => {
      const qs = finalStates[q.id];
      if (!qs || !qs.selectedAnswer) return false;
      if (qs.result) return !qs.result.isCorrect;
      return qs.selectedAnswer.trim().toUpperCase() !== q.correctAnswer.trim().toUpperCase();
    });

    if (wrongQuestions.length > 0) {
      try {
        await errorNotebookService.recordSimuladoErrors({
          simuladoTitle,
          errors: wrongQuestions.map((q) => {
            const qs = finalStates[q.id];
            return {
              questionId: q.id,
              statement: q.statement,
              alternatives: q.alternatives,
              userAnswer: qs?.selectedAnswer || 'N/A',
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            };
          }),
        });
      } catch (err) {
        console.error('Falha ao sincronizar erros no Caderno de Erros:', err);
      }
    }
  };

  const finish = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('Sessão não iniciada');

      // Garante envio de qualquer questão respondida que ainda não foi salva no banco
      const updatedStates = { ...states };
      for (const q of questions) {
        const qs = updatedStates[q.id];
        if (qs && qs.selectedAnswer && !qs.result) {
          try {
            const res = await studyService.submitAnswer(sessionId, {
              questionId: q.id,
              answer: qs.selectedAnswer,
              timeSpent: qs.timeSpent || 0,
            });
            updatedStates[q.id] = { ...qs, result: res };
          } catch (e) {
            console.error('Falha ao submeter resposta pendente:', e);
          }
        }
      }
      setStates(updatedStates);

      const finishRes = await studyService.finishSession(sessionId);
      await syncErrorsToNotebook(updatedStates);
      return finishRes;
    },
    onSuccess: (data) => {
      clearInterval(clockRef.current);
      setStats(data.stats);
    },
  });

  const goTo = (next: number) => {
    questionTimer.current = 0;
    setIndex(next);
  };

  const select = (letter: string) => {
    if (!question || isAnswered) return;
    patch(question.id, { selectedAnswer: current?.selectedAnswer === letter ? null : letter });
  };

  const confirm = () => {
    if (question && current?.selectedAnswer && !isAnswered) {
      submit.mutate({ questionId: question.id, answer: current.selectedAnswer });
    }
  };

  // Ao clicar em 'Próxima', se a questão atual estiver marcada mas não confirmada, submete automaticamente
  const handleNext = async () => {
    if (question && !isAnswered && current?.selectedAnswer && sessionId) {
      try {
        const res = await studyService.submitAnswer(sessionId, {
          questionId: question.id,
          answer: current.selectedAnswer,
          timeSpent: questionTimer.current,
        });
        patch(question.id, { result: res, selectedAnswer: current.selectedAnswer, timeSpent: questionTimer.current });
        questionTimer.current = 0;
      } catch (e) {
        console.error('Falha ao submeter automaticamente ao avançar:', e);
      }
    }
    if (index < questions.length - 1) {
      goTo(index + 1);
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      goTo(index - 1);
    }
  };

  const favorite = async () => {
    if (!question) return;
    const res = await studyService.toggleFavorite(question.id);
    patch(question.id, { favorited: res.favorited });
  };

  if (stats) {
    return <ResultsView stats={stats} questions={questions} questionStates={states} onBack={() => navigate('/generate')} />;
  }

  if (!question || !current) return null;

  const isCurrentCorrect = current.result?.isCorrect ?? false;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 select-none">
      {/* Top Header */}
      <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
        <button
          onClick={() => navigate('/generate')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
          title="Sair do Simulado"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
            <span>{answered} de {questions.length} respondidas</span>
          </span>
          <span className="flex items-center gap-1 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-300">
            <Clock className="h-3.5 w-3.5 text-primary-500" /> {clock(elapsed)}
          </span>
        </div>

        <button
          onClick={() => finish.mutate()}
          disabled={!sessionId || finish.isPending}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
        >
          {finish.isPending ? 'Finalizando...' : 'Finalizar'}
        </button>

        {/* Barra de Progresso Superior */}
        <div className="absolute inset-x-0 -bottom-px h-1 bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full bg-primary-600 transition-all duration-300 ease-out"
            style={{ width: `${(answered / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28">
        <div className="mx-auto max-w-2xl">
          {/* Question Source Badge (Banca/Concurso Oficial) */}
          <div className="mb-3">
            <BankOriginBadge question={question} />
          </div>

          {/* Question Card (Pose to Pose, Feedback & Doherty) */}
          <QuestionCard
            question={question}
            index={index}
            total={questions.length}
            format={format}
            selectedAnswer={current.selectedAnswer}
            isAnswered={isAnswered}
            showFeedback={showFeedback}
            isFavorited={current.favorited}
            isSubmitting={submit.isPending}
            mode={mode}
            onSelectAlternative={select}
            onConfirmAnswer={confirm}
            onToggleFavorite={favorite}
          >
            {format === 'ESSAY' && (
              <EssayArea
                q={question}
                state={current}
                showFeedback={showFeedback}
                onDraft={(d) => patch(question.id, { draft: d })}
                onSelfEval={(ok) => submit.mutate({ questionId: question.id, answer: ok ? SELF_RIGHT : SELF_WRONG })}
                pending={submit.isPending}
                answered={isAnswered}
              />
            )}
          </QuestionCard>

          {/* Feedback Imediato após Responder (Modo Estudo) */}
          {showFeedback && (
            <StudyFeedbackBanner
              isCorrect={!!isCurrentCorrect}
              correctAnswer={question.correctAnswer}
              explanation={question.explanation}
              questionContext={[
                htmlToPlainText(question.statement),
                ...question.alternatives.map((a) => `${a.letter}) ${a.text}`),
              ].join('\n')}
              targetId={question.id}
            />
          )}
        </div>
      </main>

      {/* Elevated Bottom Navigation Bar */}
      <footer className="fixed bottom-0 inset-x-0 h-16 shrink-0 border-t border-gray-200 bg-white/95 dark:border-gray-800 dark:bg-gray-900/95 backdrop-blur-md px-4 sm:px-8 shadow-xl flex items-center justify-between z-40">
        {/* Botão Anterior */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={index === 0}
          className="h-11 px-5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-sm shadow-xs hover:bg-gray-100 dark:hover:bg-gray-750 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 cursor-pointer transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Indicador Central de Questões */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <span>Questão</span>
          <span className="text-gray-900 dark:text-white font-bold text-sm">{index + 1}</span>
          <span>de</span>
          <span>{questions.length}</span>
        </div>

        {/* Botão Próxima ou Finalizar */}
        {isLast ? (
          <button
            type="button"
            onClick={() => finish.mutate()}
            disabled={!sessionId || finish.isPending}
            className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            {finish.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Finalizando...</span>
              </>
            ) : (
              <>
                <Flag className="h-4 w-4" />
                <span>Finalizar Simulado</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="h-11 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <span>Próxima</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </footer>
    </div>
  );
}

function EssayArea({
  q,
  state,
  showFeedback,
  answered,
  pending,
  onDraft,
  onSelfEval,
}: {
  q: QuestionDTO;
  state: QuestionState;
  showFeedback: boolean;
  answered: boolean;
  pending: boolean;
  onDraft: (d: string) => void;
  onSelfEval: (correct: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <textarea
        value={state.draft}
        onChange={(e) => onDraft(e.target.value)}
        disabled={answered}
        rows={5}
        placeholder="Escreva sua resposta aqui (só você vê)..."
        className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
      />
      {(state.revealed || showFeedback) && (
        <div className="rounded-xl border border-primary-300 bg-primary-600/5 p-4 text-sm text-gray-800 dark:text-gray-200">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-600">Resposta esperada</p>
          <p className="whitespace-pre-line">{htmlToPlainText(q.explanation) || 'Sem resposta cadastrada.'}</p>
        </div>
      )}
      {state.revealed && !answered && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">Você acertou?</span>
          <button
            onClick={() => onSelfEval(true)}
            disabled={pending}
            className="rounded-lg border border-green-500 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-500/10 cursor-pointer"
          >
            Acertei
          </button>
          <button
            onClick={() => onSelfEval(false)}
            disabled={pending}
            className="rounded-lg border border-red-400 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10 cursor-pointer"
          >
            Errei
          </button>
        </div>
      )}
    </div>
  );
}
