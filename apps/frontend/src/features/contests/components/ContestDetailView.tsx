import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Circle,
  Clock,
  Loader2,
  Target,
  Trash2,
} from 'lucide-react';
import { contestService, type SyllabusItem, type DisciplineStat } from '../services/contest.service';
import { daysUntil, formatExamDate } from './ContestCard';
import { TopicContent } from './TopicContent';
import { TopicReviews } from './TopicReviews';
import { PriorityBadge, ImportanceSelect } from './DisciplineHeaderMeta';

export function ContestDetailView({ contestId, onBack }: { contestId: string; onBack: () => void }) {
  const queryClient = useQueryClient();

  const { data: contest, isLoading } = useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestService.getById(contestId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => contestService.delete(contestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      onBack();
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
    queryClient.invalidateQueries({ queryKey: ['contests'] });
    queryClient.invalidateQueries({ queryKey: ['due-reviews'] });
  };

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, studied }: { itemId: string; studied: boolean }) =>
      contestService.setTopicStudied(itemId, studied),
    onSuccess: invalidate,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ reviewId, completed }: { reviewId: string; completed: boolean }) =>
      contestService.completeReview(reviewId, completed),
    onSuccess: invalidate,
  });

  const importanceMutation = useMutation({
    mutationFn: ({ discipline, importance }: { discipline: string; importance: number }) =>
      contestService.setImportance(contestId, discipline, importance),
    onSuccess: invalidate,
  });

  const disciplines = useMemo(() => {
    if (!contest) return [];
    const groups = new Map<string, SyllabusItem[]>();
    for (const item of contest.syllabus) {
      const list = groups.get(item.discipline) ?? [];
      list.push(item);
      groups.set(item.discipline, list);
    }
    // Ordena pela prioridade calculada no backend
    return contest.disciplines
      .map((stat) => ({ stat, items: groups.get(stat.discipline) ?? [] }))
      .filter((d) => d.items.length > 0);
  }, [contest]);

  if (isLoading || !contest) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
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
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <ChevronLeft className="mr-1 inline h-4 w-4" />
          Voltar
        </button>
        <button
          onClick={() => deleteMutation.mutate()}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </button>
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{contest.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {contest.organization && <span>{contest.organization}</span>}
          {contest.role && <span>· {contest.role}</span>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {contest.examBoard && (
            <span className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Building2 className="h-3 w-3" />
              {contest.examBoard}
            </span>
          )}
          {contest.examDate && (
            <span className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <CalendarDays className="h-3 w-3" />
              Prova: {formatExamDate(contest.examDate)}
            </span>
          )}
          {contest.focus && (
            <span className="flex items-center gap-1 rounded bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              <Target className="h-3 w-3" />
              Foco: {contest.focus}
            </span>
          )}
        </div>
      </div>

      {days !== null && days >= 0 && (
        <div className="mb-4 flex items-center justify-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-5 dark:border-primary-800 dark:bg-primary-950">
          <Clock className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          <div>
            <p className="text-3xl font-bold text-primary-700 dark:text-primary-300">{days} dias</p>
            <p className="text-xs text-primary-600 dark:text-primary-400">até a prova</p>
          </div>
        </div>
      )}

      {total > 0 && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-900 dark:text-white">Progresso do conteúdo programático</span>
            <span className="text-gray-500 dark:text-gray-400">
              {studied}/{total} ({progress}%)
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {disciplines.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          Nenhum conteúdo programático cadastrado para este objetivo.
        </div>
      ) : (
        <div className="space-y-3">
          {disciplines.map(({ stat, items }) => (
            <DisciplineGroup
              key={stat.discipline}
              stat={stat}
              items={items}
              onToggle={(itemId, value) => toggleMutation.mutate({ itemId, studied: value })}
              onReview={(reviewId, completed) => reviewMutation.mutate({ reviewId, completed })}
              onSetImportance={(importance) =>
                importanceMutation.mutate({ discipline: stat.discipline, importance })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DisciplineGroup({
  stat,
  items,
  onToggle,
  onReview,
  onSetImportance,
}: {
  stat: DisciplineStat;
  items: SyllabusItem[];
  onToggle: (itemId: string, studied: boolean) => void;
  onReview: (reviewId: string, completed: boolean) => void;
  onSetImportance: (importance: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const done = stat.studied === items.length;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white dark:bg-gray-900 ${
        stat.inFocus ? 'border-gray-200 dark:border-gray-800' : 'border-gray-200 opacity-60 dark:border-gray-800'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex min-w-0 items-center gap-2">
          {done ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 shrink-0 text-gray-300 dark:text-gray-600" />
          )}
          <span className="truncate font-medium text-gray-900 dark:text-white">{stat.discipline}</span>
          {!stat.inFocus && (
            <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              fora do foco
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {stat.dueReviews > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {stat.dueReviews} revisão{stat.dueReviews > 1 ? 'ões' : ''}
            </span>
          )}
          <PriorityBadge priority={stat.priority} />
          <ImportanceSelect value={stat.importance} onChange={onSetImportance} />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {stat.studied}/{items.length}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-200 dark:border-gray-800">
          {items.map((item) => (
            <div key={item.id} className="border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-800">
              <button
                onClick={() => onToggle(item.id, !item.studied)}
                className="flex w-full items-start gap-3 text-left"
              >
                {item.studied ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                )}
                <span
                  className={`text-sm ${
                    item.studied
                      ? 'text-gray-500 dark:text-gray-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {item.topic}
                </span>
              </button>
              <div className="pl-7">
                <TopicReviews item={item} onComplete={onReview} />
                <TopicContent itemId={item.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
