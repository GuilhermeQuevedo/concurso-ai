import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { X, Clock, ChevronLeft, ChevronRight, Check, XCircle, ChevronDown, Star } from 'lucide-react';
import type { QuestionDTO } from '@/features/questions/services/question.service';
import { studyService } from '@/features/study/services/study.service';
import { ResultsView, type QuestionState } from '@/features/study/components/ResultsView';
import { htmlToPlainText } from '@/lib/html';

type StudyMode = 'STUDY' | 'EXAM';
type Format = 'MULTIPLE' | 'TRUE_FALSE' | 'ESSAY';

interface LocationState {
  questions: QuestionDTO[];
  mode: StudyMode;
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
      .createSession({ mode, questionIds: questions.map((q) => q.id), subjectId: state.subjectId, examBoardId: state.examBoardId, difficulty: state.difficulty })
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

  const patch = useCallback((id: string, p: Partial<QuestionState>) => setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...p } })), []);

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

  const finish = useMutation({
    mutationFn: () => (sessionId ? studyService.finishSession(sessionId) : Promise.reject(new Error('Sessão não iniciada'))),
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
    if (question && current?.selectedAnswer && !isAnswered) submit.mutate({ questionId: question.id, answer: current.selectedAnswer });
  };

  const favorite = async () => {
    if (!question) return;
    const res = await studyService.toggleFavorite(question.id);
    patch(question.id, { favorited: res.favorited });
  };

  if (stats) return <ResultsView stats={stats} questions={questions} questionStates={states} onBack={() => navigate('/generate')} />;
  if (!question || !current) return null;

  const mainAction = (() => {
    if (isAnswered) return { label: 'Respondida', disabled: true, onClick: () => undefined, done: true };
    if (format === 'ESSAY') return { label: 'Ver Resposta', disabled: current.revealed, onClick: () => patch(question.id, { revealed: true }), done: false };
    return { label: mode === 'EXAM' ? 'Confirmar' : 'Ver Resposta', disabled: !current.selectedAnswer || submit.isPending, onClick: confirm, done: false };
  })();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950">
      <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
        <button onClick={() => navigate('/generate')} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Sair">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <span>{answered} de {questions.length} respondidas</span>
          <span className="flex items-center gap-1 font-mono text-xs text-gray-500"><Clock className="h-3.5 w-3.5" /> {clock(elapsed)}</span>
        </div>
        <button
          onClick={() => finish.mutate()}
          disabled={!sessionId || answered === 0 || finish.isPending}
          className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {finish.isPending ? 'Finalizando...' : 'Finalizar'}
        </button>
        <div className="absolute inset-x-0 -bottom-px h-0.5 bg-gray-200 dark:bg-gray-800">
          <div className="h-full bg-primary-600 transition-all" style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded bg-primary-600/10 px-2 py-0.5 text-xs font-medium text-primary-600 dark:text-primary-400">Questão {index + 1}</span>
            <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">{FORMAT_LABEL[format]}</span>
          </div>
          <p className="mb-5 whitespace-pre-line text-base leading-relaxed text-gray-900 dark:text-white">{htmlToPlainText(question.statement)}</p>

          {format === 'ESSAY' ? (
            <EssayArea q={question} state={current} showFeedback={showFeedback} onDraft={(d) => patch(question.id, { draft: d })} onSelfEval={(ok) => submit.mutate({ questionId: question.id, answer: ok ? SELF_RIGHT : SELF_WRONG })} pending={submit.isPending} answered={isAnswered} />
          ) : (
            <div className="space-y-2.5">
              {question.alternatives.map((alt) => {
                const picked = current.selectedAnswer === alt.letter;
                const isRight = showFeedback && alt.letter === question.correctAnswer;
                const isWrong = showFeedback && picked && alt.letter !== question.correctAnswer;
                const tone = isRight
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/40'
                  : isWrong
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40'
                    : picked
                      ? 'border-primary-500 bg-primary-600/5'
                      : 'border-gray-200 bg-white hover:border-primary-300 dark:border-gray-800 dark:bg-gray-900';
                return (
                  <button key={alt.letter} onClick={() => select(alt.letter)} disabled={isAnswered} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm text-gray-800 transition-colors dark:text-gray-200 ${tone}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isRight ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {isRight ? <Check className="h-4 w-4" /> : isWrong ? <XCircle className="h-4 w-4" /> : alt.letter}
                    </span>
                    {htmlToPlainText(alt.text)}
                  </button>
                );
              })}
            </div>
          )}

          {showFeedback && (
            <div className="mt-4">
              <div className="flex items-center gap-4 text-xs">
                <button onClick={favorite} className={`flex items-center gap-1 ${current.favorited ? 'text-amber-500' : 'text-gray-500 hover:text-amber-500'}`}>
                  <Star className="h-3.5 w-3.5" fill={current.favorited ? 'currentColor' : 'none'} /> Favoritar
                </button>
                <button onClick={() => setShowExplanation((v) => !v)} className="flex items-center gap-1 font-medium text-primary-600 dark:text-primary-400">
                  Explicar questão inteira <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {showExplanation && (
                <div className="mt-2 whitespace-pre-line rounded-xl bg-white p-4 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">{htmlToPlainText(question.explanation) || 'Sem explicação cadastrada.'}</div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="grid h-14 shrink-0 grid-cols-3 items-center border-t border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
        <button onClick={() => goTo(index - 1)} disabled={index === 0} className="flex items-center gap-1 justify-self-start text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 dark:text-gray-300">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <button
          onClick={mainAction.onClick}
          disabled={mainAction.disabled}
          className={`justify-self-center rounded-lg px-5 py-2 text-sm font-medium ${mainAction.done ? 'bg-green-500/10 text-green-600' : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40'}`}
        >
          {mainAction.label}
        </button>
        {isLast ? (
          <button onClick={() => finish.mutate()} disabled={!sessionId || answered === 0 || finish.isPending} className="flex items-center gap-1 justify-self-end text-sm font-medium text-primary-600 disabled:opacity-30">
            Finalizar <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={() => goTo(index + 1)} className="flex items-center gap-1 justify-self-end text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300">
            Próxima <ChevronRight className="h-4 w-4" />
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
          <button onClick={() => onSelfEval(true)} disabled={pending} className="rounded-lg border border-green-500 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-500/10">Acertei</button>
          <button onClick={() => onSelfEval(false)} disabled={pending} className="rounded-lg border border-red-400 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10">Errei</button>
        </div>
      )}
    </div>
  );
}
