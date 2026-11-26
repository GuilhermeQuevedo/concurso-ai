import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  Clock,
  Loader2,
  Target,
  Trash2,
} from 'lucide-react';
import { useContestDetail } from '../hooks/useContestDetail';
import { useContestReading } from '../hooks/useContestReading';
import { ReadingRestBanner } from './ReadingRestBanner';
import { daysUntil, formatExamDate } from './ContestCard';
import { DeleteContestDialog } from './DeleteContestDialog';
import { DisciplineGroup } from './DisciplineGroup';
import { StatusFilter, type DisciplineStatus } from './DisciplineStatus';

export function ContestDetailView({ contestId, onBack }: { contestId: string; onBack: () => void }) {
  const [statusFilter, setStatusFilter] = useState<DisciplineStatus | 'all'>('all');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const navigate = useNavigate();
  const { contest, isLoading, linkedSchedules, disciplines, deleteContest, toggleTopic, completeReview, setImportance } =
    useContestDetail(contestId, onBack);
  const { readingRest } = useContestReading(contestId);

  const statusCounts = useMemo(() => {
    const counts: Record<DisciplineStatus, number> = { in_progress: 0, pending: 0, completed: 0 };
    for (const d of disciplines) counts[d.status] += 1;
    return counts;
  }, [disciplines]);
  const shownDisciplines = statusFilter === 'all' ? disciplines : disciplines.filter((d) => d.status === statusFilter);

  if (isLoading || !contest) {
    return (
      <div className="flex justify-center py-16" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-[#2E8C82]" />
      </div>
    );
  }

  const days = daysUntil(contest.examDate);
  const total = contest.syllabus.length;
  const studied = contest.syllabus.filter((s) => s.studied).length;
  const progress = total > 0 ? Math.round((studied / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Voltar aos objetivos</span>
        </button>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Excluir objetivo</span>
        </button>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">{contest.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {contest.organization && <span>{contest.organization}</span>}
          {contest.role && <span>· {contest.role}</span>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {contest.examBoard && (
            <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-[#2E8C82] dark:text-[#52b3a8]" />
              {contest.examBoard}
            </span>
          )}
          {contest.examDate && (
            <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              <CalendarDays className="h-3.5 w-3.5 text-[#2E8C82] dark:text-[#52b3a8]" />
              Prova: {formatExamDate(contest.examDate)}
            </span>
          )}
          {contest.focus && (
            <span className="flex items-center gap-1.5 rounded-lg border border-[#2E8C82]/30 bg-[#2E8C82]/10 px-2.5 py-1 text-xs font-semibold text-[#1b5e56] dark:border-[#2E8C82]/40 dark:bg-[#2E8C82]/20 dark:text-[#52b3a8]">
              <Target className="h-3.5 w-3.5" />
              Foco: {contest.focus}
            </span>
          )}
        </div>
      </div>

      {days !== null && days >= 0 && (
        <div className="mb-4 flex items-center justify-center gap-3.5 rounded-2xl border border-[#2E8C82]/30 bg-[#2E8C82]/10 p-5 dark:border-[#2E8C82]/30 dark:bg-[#2E8C82]/15 shadow-2xs">
          <Clock className="h-8 w-8 text-[#2E8C82] dark:text-[#52b3a8]" />
          <div>
            <p className="text-3xl font-extrabold text-[#1b5e56] dark:text-[#52b3a8]">{days} dias</p>
            <p className="text-xs font-semibold text-[#2E8C82] dark:text-[#52b3a8]">até a data da prova</p>
          </div>
        </div>
      )}

      {readingRest && <ReadingRestBanner />}

      {total > 0 && (
        <button
          type="button"
          onClick={() => navigate(`/cronograma?prova=${contest.id}`)}
          className="mb-3.5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-3 text-sm sm:text-base font-bold text-white shadow-md transition-all hover:bg-[#26776f] hover:shadow-lg active:scale-[0.99] touch-manipulation cursor-pointer"
        >
          <CalendarDays className="h-5 w-5" />
          <span>Estruturar cronograma para este edital</span>
        </button>
      )}

      {linkedSchedules.length > 0 && (
        <button
          type="button"
          onClick={() => navigate(`/cronograma?edital=${contest.id}`)}
          className="mb-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#2E8C82]/40 bg-white px-5 py-2.5 text-sm font-semibold text-[#1b5e56] transition-all hover:bg-[#2E8C82]/10 dark:bg-slate-900 dark:text-[#52b3a8] dark:hover:bg-[#2E8C82]/20 active:scale-[0.99] touch-manipulation cursor-pointer"
        >
          <CalendarDays className="h-4 w-4" />
          <span>Ver cronogramas vinculados a este edital ({linkedSchedules.length})</span>
        </button>
      )}

      {total > 0 && (
        <div className="mb-5 rounded-2xl border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="mb-2.5 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-900 dark:text-white">Progresso do conteúdo programático</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {studied}/{total} ({progress}%)
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-[#2E8C82] transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {disciplines.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 shadow-xs">
          Nenhum conteúdo programático cadastrado para este objetivo.
        </div>
      ) : (
        <div className="space-y-3.5">
          <StatusFilter counts={statusCounts} value={statusFilter} onChange={setStatusFilter} />
          {shownDisciplines.map(({ stat, items }) => (
            <DisciplineGroup
              key={stat.discipline}
              stat={stat}
              items={items}
              onToggle={(itemId, value) => toggleTopic.mutate({ itemId, studied: value })}
              onReview={(reviewId, completed) => completeReview.mutate({ reviewId, completed })}
              onSetImportance={(importance) =>
                setImportance.mutate({ discipline: stat.discipline, importance })
              }
            />
          ))}
        </div>
      )}
      {confirmingDelete && (
        <DeleteContestDialog
          contestName={contest.name}
          editalDocumentId={contest.editalDocumentId}
          isDeleting={deleteContest.isPending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={(options) => deleteContest.mutate(options)}
        />
      )}
    </div>
  );
}
