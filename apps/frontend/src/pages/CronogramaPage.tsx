import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Loader2, Plus } from 'lucide-react';
import { studyScheduleService } from '@/features/study-schedule/services/study-schedule.service';
import { ScheduleCard } from '@/features/study-schedule/components/ScheduleCard';
import { NewScheduleView } from '@/features/study-schedule/components/NewScheduleView';
import { ScheduleDetailView } from '@/features/study-schedule/components/ScheduleDetailView';
import type { StudySchedule } from '@/features/study-schedule/types';

type View = 'list' | 'new' | 'detail';

export interface ScheduleListProps {
  schedules: StudySchedule[];
  isLoading: boolean;
  onNew: () => void;
  onOpen: (schedule: StudySchedule) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

function ScheduleList({
  schedules,
  isLoading,
  onNew,
  onOpen,
  onDelete,
  onRename,
}: ScheduleListProps) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cronograma de Estudos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monte ciclos semanais inteligentes com divisão por blocos, revisões espaçadas e resolução de questões
          </p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Novo Cronograma
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Nenhum cronograma cadastrado
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Crie seu primeiro cronograma personalizado e a IA organizará suas sessões de estudo
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule, idx) => (
            <ScheduleCard
              key={schedule.id || idx}
              schedule={schedule}
              onClick={() => onOpen(schedule)}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CronogramaPage() {
  const [searchParams] = useSearchParams();
  const initialProva = searchParams.get('prova');
  const [view, setView] = useState<View>(initialProva ? 'new' : 'list');
  const [selectedSchedule, setSelectedSchedule] = useState<StudySchedule | null>(null);

  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['study-schedules'],
    queryFn: studyScheduleService.listSchedules,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studyScheduleService.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-schedules'] });
      setView('list');
      setSelectedSchedule(null);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      studyScheduleService.updateName(id, title),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['study-schedules'] });
      if (selectedSchedule?.id === updated.id) {
        setSelectedSchedule(updated);
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: (sched: StudySchedule) => studyScheduleService.saveSchedule(sched),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['study-schedules'] });
      setSelectedSchedule(saved);
    },
  });

  const toggleDayMutation = useMutation({
    mutationFn: ({ id, weekIndex, dayIndex }: { id: string; weekIndex: number; dayIndex: number }) =>
      studyScheduleService.toggleDayCompletion(id, weekIndex, dayIndex),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['study-schedules'] });
      setSelectedSchedule(updated);
    },
  });

  const openDetail = (sched: StudySchedule) => {
    setSelectedSchedule(sched);
    setView('detail');
  };

  const handleToggleDay = (weekIndex: number, dayIndex: number) => {
    if (!selectedSchedule?.schedule?.weeks) return;
    const clone = { ...selectedSchedule };
    const day = clone.schedule.weeks[weekIndex]?.days[dayIndex];
    if (!day) return;
    day.completed = !day.completed;
    setSelectedSchedule({ ...clone });

    if (clone.id) {
      toggleDayMutation.mutate({ id: clone.id, weekIndex, dayIndex });
    }
  };

  if (view === 'new') {
    return (
      <NewScheduleView
        onBack={() => setView('list')}
        onCreated={(newSched) => openDetail(newSched)}
      />
    );
  }

  if (view === 'detail' && selectedSchedule) {
    return (
      <ScheduleDetailView
        schedule={selectedSchedule}
        isSaving={saveMutation.isPending}
        onBack={() => setView('list')}
        onSave={async (sched) => {
          await saveMutation.mutateAsync(sched);
        }}
        onDelete={async (id) => {
          if (window.confirm('Tem certeza que deseja excluir este cronograma?')) {
            await deleteMutation.mutateAsync(id);
          }
        }}
        onToggleDayCompletion={handleToggleDay}
      />
    );
  }

  return (
    <ScheduleList
      schedules={schedules}
      isLoading={isLoading}
      onNew={() => setView('new')}
      onOpen={openDetail}
      onDelete={(id) => {
        if (window.confirm('Tem certeza que deseja excluir este cronograma?')) {
          deleteMutation.mutate(id);
        }
      }}
      onRename={(id, title) => renameMutation.mutate({ id, title })}
    />
  );
}

export default CronogramaPage;
