import { Plus, Trophy } from 'lucide-react';
import { Link } from 'react-router';

import { daysUntil } from '@/features/contests/components/ContestCard';
import type { ContestSummary } from '@/features/contests/services/contest.service';

interface ExamsPanelProps {
  contests: ContestSummary[];
}

function tone(days: number): string {
  if (days <= 14) return 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300';
  if (days <= 45) return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300';
  return 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300';
}

export function ExamsPanel({ contests }: ExamsPanelProps) {
  const upcoming = contests
    .filter((c) => c.examDate && (daysUntil(c.examDate) ?? -1) >= 0)
    .sort((a, b) => ((a.examDate ?? '') < (b.examDate ?? '') ? -1 : 1));

  return (
    <section aria-label="Minhas provas" className="mb-4 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Trophy className="h-4 w-4 text-amber-500" /> Minhas provas
        </h2>
        <Link to="/contests" className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
          <Plus className="h-3.5 w-3.5" /> Adicionar prova
        </Link>
      </header>
      {upcoming.length === 0 ? (
        <p className="px-4 py-5 text-center text-sm text-gray-500 dark:text-gray-400">Nenhuma prova cadastrada. Adicione suas provas para acompanhar a contagem regressiva!</p>
      ) : (
        <div className="flex flex-wrap gap-3 p-3">
          {upcoming.map((contest) => {
            const days = daysUntil(contest.examDate) ?? 0;
            return (
              <div key={contest.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${tone(days)}`}>
                <span className="font-bold">{days} dias</span>
                <span className="max-w-56 truncate text-xs opacity-80">{contest.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
