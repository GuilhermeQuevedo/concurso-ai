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
    <div className="mx-auto max-w-3xl p-4 sm:p-6 space-y-6 animate-in fade-in duration-fast">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 shadow-xs">
          <Trophy className="h-8 w-8 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sessão Finalizada!</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Confira o resumo do seu desempenho nesta rodada de estudo.</p>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatCard icon={Target} label="Acertos" value={`${stats.correct}/${stats.total}`} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={XCircle} label="Erros" value={String(stats.wrong)} color="text-red-500 dark:text-red-400" />
        <StatCard icon={CheckCircle2} label="Aproveitamento" value={`${stats.accuracy}%`} color="text-primary-600 dark:text-primary-400" />
        <StatCard icon={Timer} label="Tempo total" value={formatTime(stats.totalTime)} color="text-blue-500 dark:text-blue-400" />
      </div>

      {stats.wrong > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 dark:border-amber-800 dark:bg-amber-950/30 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                {stats.wrong} {stats.wrong === 1 ? 'questão salva' : 'questões salvas'} no seu Caderno de Erros
              </p>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed mt-0.5">
                Gere a Tríade de Fixação Ativa (Direto, Cloze e V/F) para consolidar seus pontos fracos.
              </p>
            </div>
          </div>
          <Link
            to="/error-notebook"
            className="shrink-0 min-h-[44px] inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition-all duration-fast shadow-xs touch-manipulation cursor-pointer active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Abrir Caderno de Erros
          </Link>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Revisão das Questões</h2>
        <div className="space-y-2.5">
          {questions.map((q, i) => {
            const qs = questionStates[q.id];
            const isCorrect = qs?.result?.isCorrect;
            return (
              <div
                key={q.id}
                className={`rounded-xl border p-4 shadow-xs transition-all duration-fast ${
                  isCorrect
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                    : 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      isCorrect ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 line-clamp-2 text-sm text-gray-800 dark:text-gray-200">{htmlToPlainText(q.statement)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Sua resposta: <strong className={isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}>{describeAnswer(q, qs?.selectedAnswer)}</strong>
                      {q.alternatives.length > 0 && (
                        <>
                          {' '}| Gabarito: <strong className="text-gray-900 dark:text-white">{q.correctAnswer}</strong>
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
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] flex items-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 px-6 py-2.5 text-sm font-bold text-white transition-all duration-fast shadow-xs cursor-pointer touch-manipulation active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
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
    <div className="rounded-xl border border-gray-200/90 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900 shadow-xs">
      <Icon className={`mx-auto mb-1 h-5 w-5 ${color}`} />
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
