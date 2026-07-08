import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Clock, Loader2, Sparkles } from 'lucide-react';
import { studyTaskService, type StudyTask } from '@/features/calendar/services/study-task.service';
import { contestService } from '@/features/contests/services/contest.service';
import { GeneratePlanForm } from '@/features/calendar/components/GeneratePlanForm';
import { MonthGrid, dayKey } from '@/features/calendar/components/MonthGrid';
import { TaskList } from '@/features/calendar/components/TaskList';
import { daysUntil } from '@/features/contests/components/ContestCard';

export function CalendarPage() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(dayKey(now));
  const [showGenerate, setShowGenerate] = useState(false);

  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['study-tasks', from, to],
    queryFn: () => studyTaskService.list(from, to),
  });

  const { data: contests = [] } = useQuery({
    queryKey: ['contests'],
    queryFn: contestService.list,
  });

  const toggleMutation = useMutation({
    mutationFn: (task: StudyTask) => studyTaskService.setCompleted(task.id, !task.completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    },
  });

  const tasksByDay = useMemo(() => {
    const map = new Map<string, StudyTask[]>();
    for (const task of tasks) {
      const key = task.date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const examDays = useMemo(() => {
    const map = new Map<string, string>();
    for (const contest of contests) {
      if (contest.examDate) map.set(contest.examDate.slice(0, 10), contest.name);
    }
    return map;
  }, [contests]);

  const upcomingExams = contests
    .filter((c) => c.examDate && (daysUntil(c.examDate) ?? -1) >= 0)
    .sort((a, b) => (a.examDate! < b.examDate! ? -1 : 1));

  const navigate = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const selectedTasks = tasksByDay.get(selectedDay) ?? [];
  const todayKey = dayKey(new Date());
  const selectedLabel =
    selectedDay === todayKey
      ? 'Hoje'
      : new Date(`${selectedDay}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendário de Estudo</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Seu plano diário até o dia da prova
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(!showGenerate)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Sparkles className="h-4 w-4" />
          Gerar Plano
        </button>
      </div>

      {upcomingExams.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {upcomingExams.map((contest) => {
            const days = daysUntil(contest.examDate)!;
            const color = days <= 14 ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300' : days <= 45 ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300';
            return (
              <div key={contest.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${color}`}>
                <Clock className="h-4 w-4" />
                <span className="font-bold">{days} dias</span>
                <span className="max-w-56 truncate text-xs opacity-80">{contest.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {showGenerate && <GeneratePlanForm onClose={() => setShowGenerate(false)} />}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : tasks.length === 0 && !showGenerate ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <CalendarClock className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Nenhuma tarefa neste mês
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Clique em "Gerar Plano" para distribuir o conteúdo do edital até o dia da prova
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <MonthGrid
            year={year}
            month={month}
            tasksByDay={tasksByDay}
            selectedDay={selectedDay}
            examDays={examDays}
            onSelectDay={setSelectedDay}
            onNavigate={navigate}
          />

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold capitalize text-gray-900 dark:text-white">{selectedLabel}</h3>
            <TaskList
              tasks={selectedTasks}
              emptyMessage="Nenhuma tarefa neste dia."
              onToggle={(task) => toggleMutation.mutate(task)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
