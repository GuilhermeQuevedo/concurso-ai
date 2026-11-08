import { Link } from 'react-router';
import { Target, X } from 'lucide-react';

import { useActiveStudy } from './active-study-context';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(`${iso.slice(0, 10)}T12:00:00Z`).getTime() - Date.now()) / MS_PER_DAY);
  return days >= 0 ? days : null;
}

// Faixa na Visão Geral lembrando em qual edital a tela está focada, com o progresso dele.
export function ActiveStudyBanner() {
  const { activeContest, setActiveContestId } = useActiveStudy();
  if (!activeContest) return null;

  const days = daysUntil(activeContest.examDate);
  const percent = activeContest.totalTopics > 0 ? Math.round((activeContest.studiedTopics / activeContest.totalTopics) * 100) : 0;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-primary-300 bg-primary-50 px-4 py-3 dark:border-primary-800 dark:bg-primary-950/30">
      <Target className="h-5 w-5 shrink-0 text-primary-600" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">Estudo ativo: {activeContest.name}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {activeContest.studiedTopics}/{activeContest.totalTopics} tópicos ({percent}%)
          {days !== null && ` · ${days} dia${days === 1 ? '' : 's'} para a prova`}
        </p>
      </div>
      <Link to="/contests" className="text-xs font-medium text-primary-700 hover:underline dark:text-primary-300">
        Ver edital
      </Link>
      <button type="button" onClick={() => setActiveContestId(null)} aria-label="Ver todos os estudos" title="Ver todos os estudos" className="rounded p-1 text-gray-500 hover:bg-primary-100 dark:hover:bg-primary-900/40">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
