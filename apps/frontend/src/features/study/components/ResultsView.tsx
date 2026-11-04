import { Link } from 'react-router';
import { ArrowLeft, CheckCircle2, Target, Timer, Trophy, XCircle, BookOpen, Sparkles } from 'lucide-react';
import type { QuestionDTO } from '@/features/questions/services/question.service';
import type { SubmitAnswerResponse } from '../services/study.service';
import { htmlToPlainText } from '@/lib/html';

export interface QuestionState {
  selectedAnswer: string | null;
  result: SubmitAnswerResponse | null;
  timeSpent: number;
  favorited: boolean;
  revealed: boolean;
  draft: string;
}

interface Stats {
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
  totalTime: number;
}

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function describeAnswer(q: QuestionDTO, answer: string | null | undefined): string {
  if (!answer) return '—';
  if (q.alternatives.length === 0) return answer === 'S' ? 'Acertei' : 'Errei';
  return answer;
}

export function ResultsView({
  stats,
  questions,
  questionStates,
  onBack,
}: {
  stats: Stats;
  questions: QuestionDTO[];
  questionStates: Record<string, QuestionState>;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl p-6">
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

      {stats.wrong > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                {stats.wrong} {stats.wrong === 1 ? 'questão salva' : 'questões salvas'} no seu Caderno de Erros
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Gere a Tríade de Fixação Ativa (Direto, Cloze e V/F) com IA para consolidar os seus pontos fracos.
              </p>
            </div>
          </div>
          <Link
            to="/error-notebook"
            className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors shadow-xs"
          >
            Abrir Caderno de Erros
          </Link>
        </div>
      )}

      <div className="mb-6 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revisão das Questões</h2>
        {questions.map((q, i) => {
          const qs = questionStates[q.id];
          const isCorrect = qs?.result?.isCorrect;
          return (
            <div
              key={q.id}
              className={`rounded-lg border p-4 ${
                isCorrect
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 line-clamp-2 text-sm text-gray-800 dark:text-gray-200">{htmlToPlainText(q.statement)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sua resposta: <strong>{describeAnswer(q, qs?.selectedAnswer)}</strong>
                    {q.alternatives.length > 0 && (
                      <>
                        {' '}| Correta: <strong>{q.correctAnswer}</strong>
                      </>
                    )}
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
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos simulados
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
