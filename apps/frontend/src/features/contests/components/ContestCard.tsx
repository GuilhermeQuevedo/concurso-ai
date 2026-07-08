import { Building2, CalendarDays, Clock } from 'lucide-react';
import type { ContestSummary } from '../services/contest.service';

// Data da prova é "somente data" (armazenada como meia-noite UTC) —
// converter para fuso local deslocaria um dia; usa os componentes UTC
export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
  const exam = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((exam.getTime() - today.getTime()) / 86400000);
}

export function formatExamDate(dateStr: string): string {
  const [year, month, day] = dateStr.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function ContestCard({ contest, onClick }: { contest: ContestSummary; onClick: () => void }) {
  const days = daysUntil(contest.examDate);
  const progress = contest.totalTopics > 0
    ? Math.round((contest.studiedTopics / contest.totalTopics) * 100)
    : 0;

  const countdownColor =
    days === null ? '' : days <= 14 ? 'text-red-600 dark:text-red-400' : days <= 45 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400';

  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{contest.name}</h3>
          {contest.role && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{contest.role}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {contest.examBoard && (
              <span className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Building2 className="h-3 w-3" />
                {contest.examBoard}
              </span>
            )}
            {contest.examDate && (
              <span className="flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">
                <CalendarDays className="h-3 w-3" />
                {formatExamDate(contest.examDate)}
              </span>
            )}
          </div>
        </div>
        {days !== null && days >= 0 && (
          <div className="flex flex-col items-center">
            <span className={`text-2xl font-bold ${countdownColor}`}>{days}</span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              dias
            </span>
          </div>
        )}
      </div>

      {contest.totalTopics > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Conteúdo programático</span>
            <span>
              {contest.studiedTopics}/{contest.totalTopics} tópicos ({progress}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-primary-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}
