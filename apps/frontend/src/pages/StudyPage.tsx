import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Star,
  Trophy,
  Target,
  Timer,
  ArrowLeft,
} from 'lucide-react';
import type { QuestionDTO } from '@/features/questions/services/question.service';
import { studyService, type SubmitAnswerResponse } from '@/features/study/services/study.service';
import { htmlToPlainText } from '@/lib/html';

type StudyMode = 'STUDY' | 'EXAM';

interface LocationState {
  questions: QuestionDTO[];
  mode: StudyMode;
  subjectId?: string;
  examBoardId?: string;
  difficulty?: string;
}

interface QuestionState {
  selectedAnswer: string | null;
  result: SubmitAnswerResponse | null;
  timeSpent: number;
  favorited: boolean;
}

export default function StudyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>({});
  const [expandedExplanation, setExpandedExplanation] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finishStats, setFinishStats] = useState<{
    total: number;
    correct: number;
    wrong: number;
    accuracy: number;
    totalTime: number;
  } | null>(null);

  const questionTimer = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const questions = state?.questions ?? [];
  const mode = state?.mode ?? 'STUDY';

  useEffect(() => {
    if (!state || questions.length === 0) {
      navigate('/generate', { replace: true });
      return;
    }

    const initial: Record<string, QuestionState> = {};
    for (const q of questions) {
      initial[q.id] = { selectedAnswer: null, result: null, timeSpent: 0, favorited: false };
    }
    setQuestionStates(initial);

    studyService.createSession({
      mode,
      questionIds: questions.map((q) => q.id),
      subjectId: state.subjectId,
      examBoardId: state.examBoardId,
      difficulty: state.difficulty,
    }).then((res) => setSessionId(res.session.id));
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
      questionTimer.current += 1;
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const currentQuestion = questions[currentIndex];
  const currentState = currentQuestion ? questionStates[currentQuestion.id] : null;
  const answeredCount = Object.values(questionStates).filter((s) => s.result !== null).length;

  const submitMutation = useMutation({
    mutationFn: (data: { questionId: string; answer: string; timeSpent: number }) => {
      if (!sessionId) return Promise.reject(new Error('Sessão não iniciada'));
      return studyService.submitAnswer(sessionId, data);
    },
    onSuccess: (result, variables) => {
      setQuestionStates((prev) => ({
        ...prev,
        [variables.questionId]: {
          ...prev[variables.questionId],
          result,
          timeSpent: variables.timeSpent,
        },
      }));
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => {
      if (!sessionId) return Promise.reject(new Error('Sessão não iniciada'));
      return studyService.finishSession(sessionId);
    },
    onSuccess: (data) => {
      setFinished(true);
      setFinishStats(data.stats);
      clearInterval(timerRef.current);
    },
  });

  const handleSelectAnswer = useCallback(
    (letter: string) => {
      // Enquanto não confirmar, a seleção é livre — pode trocar ou desmarcar
      if (!currentQuestion || currentState?.result) return;

      setQuestionStates((prev) => {
        const current = prev[currentQuestion.id];
        const next = current.selectedAnswer === letter ? null : letter;
        return { ...prev, [currentQuestion.id]: { ...current, selectedAnswer: next } };
      });
    },
    [currentQuestion, currentState?.result],
  );

  const handleConfirm = useCallback(() => {
    if (!currentQuestion || !sessionId || !currentState?.selectedAnswer || currentState.result) return;

    submitMutation.mutate({
      questionId: currentQuestion.id,
      answer: currentState.selectedAnswer,
      timeSpent: questionTimer.current,
    });

    questionTimer.current = 0;
  }, [currentQuestion, sessionId, currentState?.selectedAnswer, currentState?.result, submitMutation]);

  const handleToggleFavorite = useCallback(async () => {
    if (!currentQuestion) return;
    const result = await studyService.toggleFavorite(currentQuestion.id);
    setQuestionStates((prev) => ({
      ...prev,
      [currentQuestion.id]: { ...prev[currentQuestion.id], favorited: result.favorited },
    }));
  }, [currentQuestion]);

  const goTo = (index: number) => {
    questionTimer.current = 0;
    setCurrentIndex(index);
    setExpandedExplanation(false);
  };

  const handleFinish = () => {
    if (!sessionId) return;
    finishMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (finished && finishStats) {
    return <ResultsView stats={finishStats} questions={questions} questionStates={questionStates} onBack={() => navigate('/generate')} />;
  }

  if (!currentQuestion) return null;

  const isConfirmed = !!currentState?.result;
  const hasSelection = !!currentState?.selectedAnswer;
  const showFeedback = mode === 'STUDY' && isConfirmed;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate('/generate')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium dark:bg-gray-800">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">{formatTime(elapsed)}</span>
          </div>
          <span className="rounded-lg bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
            {mode === 'STUDY' ? 'Modo Estudo' : 'Modo Simulado'}
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const qs = questionStates[q.id];
          const isCurrent = i === currentIndex;
          let bg = 'bg-gray-200 dark:bg-gray-700';
          if (qs?.result && mode === 'STUDY') {
            bg = qs.result.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
          } else if (qs?.result || qs?.selectedAnswer) {
            bg = 'bg-primary-500 text-white';
          }
          return (
            <button
              key={q.id}
              onClick={() => goTo(i)}
              className={`flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-colors ${bg} ${isCurrent ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Questão {currentIndex + 1} de {questions.length}
          </span>
          <div className="flex items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${
              currentQuestion.difficulty === 'EASY' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
              currentQuestion.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
              'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            }`}>
              {currentQuestion.difficulty === 'EASY' ? 'Fácil' : currentQuestion.difficulty === 'MEDIUM' ? 'Média' : 'Difícil'}
            </span>
            <button onClick={handleToggleFavorite} className="text-gray-400 hover:text-yellow-500 transition-colors">
              <Star className={`h-4 w-4 ${currentState?.favorited ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <p className="mb-5 whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200">{htmlToPlainText(currentQuestion.statement)}</p>

          <div className="space-y-2">
            {currentQuestion.alternatives.map((alt) => {
              const isSelected = currentState?.selectedAnswer === alt.letter;
              const isCorrectAlt = alt.letter === currentQuestion.correctAnswer;

              let borderClass = 'border-gray-200 dark:border-gray-700';
              if (showFeedback && isCorrectAlt) borderClass = 'border-green-500 bg-green-50 dark:bg-green-950';
              else if (showFeedback && isSelected && !currentState.result?.isCorrect) borderClass = 'border-red-500 bg-red-50 dark:bg-red-950';
              else if (!isConfirmed && isSelected) borderClass = 'border-primary-500 bg-primary-50 dark:bg-primary-950';

              return (
                <button
                  key={alt.letter}
                  onClick={() => handleSelectAnswer(alt.letter)}
                  disabled={isConfirmed}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${borderClass} ${
                    !isConfirmed ? 'hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-700 dark:hover:bg-primary-950 cursor-pointer' : ''
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-medium dark:border-gray-600">
                    {alt.letter}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{htmlToPlainText(alt.text)}</span>
                  {showFeedback && isCorrectAlt && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-green-500" />}
                  {showFeedback && isSelected && !currentState.result?.isCorrect && <XCircle className="ml-auto h-4 w-4 shrink-0 text-red-500" />}
                </button>
              );
            })}
          </div>

          {!isConfirmed && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleConfirm}
                disabled={!hasSelection || submitMutation.isPending}
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-40"
              >
                {submitMutation.isPending ? 'Confirmando...' : 'Confirmar resposta'}
              </button>
              <span className="text-xs text-gray-400">
                {hasSelection
                  ? 'Você ainda pode trocar de alternativa antes de confirmar.'
                  : 'Selecione uma alternativa.'}
              </span>
            </div>
          )}

          {showFeedback && (
            <div className="mt-4">
              <button
                onClick={() => setExpandedExplanation(!expandedExplanation)}
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                {expandedExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {expandedExplanation ? 'Ocultar explicação' : 'Ver explicação'}
              </button>
              {expandedExplanation && (
                <div className="mt-2 whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {htmlToPlainText(currentState.result?.explanation ?? '')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleFinish}
            disabled={finishMutation.isPending || answeredCount === 0}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            <Trophy className="h-4 w-4" />
            {finishMutation.isPending ? 'Finalizando...' : 'Finalizar'}
          </button>
        ) : (
          <button
            onClick={() => goTo(currentIndex + 1)}
            className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function ResultsView({
  stats,
  questions,
  questionStates,
  onBack,
}: {
  stats: { total: number; correct: number; wrong: number; accuracy: number; totalTime: number };
  questions: QuestionDTO[];
  questionStates: Record<string, QuestionState>;
  onBack: () => void;
}) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <Trophy className="mx-auto mb-3 h-12 w-12 text-yellow-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sessão Finalizada!</h1>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Target} label="Acertos" value={`${stats.correct}/${stats.total}`} color="text-green-600" />
        <StatCard icon={XCircle} label="Erros" value={String(stats.wrong)} color="text-red-500" />
        <StatCard icon={CheckCircle2} label="Aproveitamento" value={`${stats.accuracy}%`} color="text-primary-600" />
        <StatCard icon={Timer} label="Tempo total" value={formatTime(stats.totalTime)} color="text-blue-500" />
      </div>

      <div className="mb-6 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revisão das Questões</h2>
        {questions.map((q, i) => {
          const qs = questionStates[q.id];
          const isCorrect = qs?.result?.isCorrect;
          return (
            <div key={q.id} className={`rounded-lg border p-4 ${isCorrect ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{htmlToPlainText(q.statement)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sua resposta: <strong>{qs?.selectedAnswer ?? '—'}</strong> | Correta: <strong>{q.correctAnswer}</strong>
                    {qs?.timeSpent ? ` | Tempo: ${qs.timeSpent}s` : ''}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Gerar mais questões
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Target; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
      <Icon className={`mx-auto mb-1 h-5 w-5 ${color}`} />
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
