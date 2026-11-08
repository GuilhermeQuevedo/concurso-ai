import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import {
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  XCircle,
  ChevronDown,
  Star,
  CheckCircle2,
  Sparkles,
  Loader2,
  Flag,
} from 'lucide-react';
import { AskGroupHelp } from '@/features/groups/components/AskGroupHelp';
import type { QuestionDTO } from '@/features/questions/services/question.service';
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

const FORMAT_LABEL: Record<Format, string> = {
  MULTIPLE: 'Múltipla escolha',
  TRUE_FALSE: 'Certo ou errado',
  ESSAY: 'Subjetiva',
};

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
  const [showExplanation, setShowExplanation] = useState(false);
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
    setShowExplanation(false);
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
          {/* Top Badges */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-850 pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-primary-600/10 px-2.5 py-1 text-xs font-bold text-primary-600 dark:text-primary-400">
                Questão {index + 1} de {questions.length}
              </span>
              <span className="rounded-md bg-gray-200/80 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {FORMAT_LABEL[format]}
              </span>
            </div>

            <button
              onClick={favorite}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border transition-all ${
                current.favorited
                  ? 'border-amber-400 bg-amber-50 text-amber-600 dark:border-amber-700 dark:bg-amber-950/40'
                  : 'border-gray-200 text-gray-500 hover:text-amber-500 dark:border-gray-800 hover:border-amber-300'
              }`}
            >
              <Star className="h-3.5 w-3.5" fill={current.favorited ? 'currentColor' : 'none'} />
              {current.favorited ? 'Favoritada' : 'Favoritar'}
            </button>
          </div>

          {/* Statement */}
          <p className="mb-6 whitespace-pre-line text-base font-normal leading-relaxed text-gray-900 dark:text-gray-100">
            {htmlToPlainText(question.statement)}
          </p>

          {/* Alternatives / Essay */}
          {format === 'ESSAY' ? (
            <EssayArea
              q={question}
              state={current}
              showFeedback={showFeedback}
              onDraft={(d) => patch(question.id, { draft: d })}
              onSelfEval={(ok) => submit.mutate({ questionId: question.id, answer: ok ? SELF_RIGHT : SELF_WRONG })}
              pending={submit.isPending}
              answered={isAnswered}
            />
          ) : (
            <div className="space-y-3">
              {question.alternatives.map((alt) => {
                const picked = current.selectedAnswer === alt.letter;
                const isRight = showFeedback && alt.letter === question.correctAnswer;
                const isWrong = showFeedback && picked && alt.letter !== question.correctAnswer;

                let cardStyle = 'border-gray-200 bg-white hover:border-primary-400 dark:border-gray-800 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
                let circleStyle = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';

                if (isRight) {
                  cardStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-xs ring-1 ring-emerald-500';
                  circleStyle = 'bg-emerald-600 text-white font-bold';
                } else if (isWrong) {
                  cardStyle = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100 shadow-xs ring-1 ring-red-500';
                  circleStyle = 'bg-red-600 text-white font-bold';
                } else if (picked) {
                  cardStyle = 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 ring-2 ring-primary-500/80 shadow-xs';
                  circleStyle = 'bg-primary-600 text-white font-bold';
                }

                return (
                  <button
                    key={alt.letter}
                    onClick={() => select(alt.letter)}
                    disabled={isAnswered}
                    className={`flex w-full items-center gap-3.5 rounded-xl border p-4 text-left text-sm transition-all cursor-pointer ${cardStyle} ${
                      isAnswered ? 'cursor-default' : 'active:scale-[0.995]'
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs transition-transform ${circleStyle}`}>
                      {isRight ? <Check className="h-4 w-4 stroke-[3]" /> : isWrong ? <XCircle className="h-4 w-4 stroke-[3]" /> : alt.letter}
                    </span>
                    <span className="leading-snug">{htmlToPlainText(alt.text)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Botão de Alta Visibilidade: Responder e Ver Resposta (logo abaixo das opções) */}
          {!isAnswered && format !== 'ESSAY' && (
            <div className="mt-5">
              <button
                type="button"
                onClick={confirm}
                disabled={!current.selectedAnswer || submit.isPending}
                className="w-full h-12 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:hover:bg-primary-600 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                {submit.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Conferindo com a banca...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{mode === 'EXAM' ? 'Confirmar Resposta' : 'Responder e Ver Resposta'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Feedback Imediato após Responder (Modo Estudo) */}
          {showFeedback && (
            <div className="mt-6 space-y-4 animate-in fade-in duration-200">
              {/* Banner de Resultado */}
              <div
                className={`flex items-center justify-between rounded-xl border p-4 shadow-xs ${
                  isCurrentCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-xs ${
                      isCurrentCorrect ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                  >
                    {isCurrentCorrect ? <Check className="h-6 w-6 stroke-[3]" /> : <XCircle className="h-6 w-6 stroke-[3]" />}
                  </div>
                  <div>
                    <p className="font-bold text-base">
                      {isCurrentCorrect ? 'Parabéns, você acertou!' : 'Você errou esta questão.'}
                    </p>
                    <p className="text-xs opacity-90">
                      Gabarito oficial: <strong>Alternativa {question.correctAnswer}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExplanation((prev) => !prev)}
                  className="flex items-center gap-1 text-xs font-bold underline cursor-pointer hover:opacity-80"
                >
                  {showExplanation ? 'Ocultar Explicação' : 'Ver Explicação'}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className="flex justify-end">
                <AskGroupHelp
                  targetType="QUESTION"
                  targetId={question.id}
                  context={[htmlToPlainText(question.statement), ...question.alternatives.map((a) => `${a.letter}) ${a.text}`)].join('\n')}
                />
              </div>

              {/* Explicação Pedagógica da Banca */}
              {showExplanation && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 shadow-sm animate-in fade-in">
                  <div className="mb-2 flex items-center gap-2 font-bold text-primary-600 dark:text-primary-400">
                    <Sparkles className="h-4 w-4" />
                    <span>Comentário Didático e Justificativa</span>
                  </div>
                  <div className="whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                    {htmlToPlainText(question.explanation) || 'Sem comentário cadastrado para esta questão.'}
                  </div>
                </div>
              )}
            </div>
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
