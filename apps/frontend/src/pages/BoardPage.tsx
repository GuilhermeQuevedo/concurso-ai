import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, Loader2, Clock, BookOpen, PenLine, Repeat, GraduationCap } from 'lucide-react';
import {
  studyTaskService,
  type StudyTask,
  type StudyTaskType,
} from '@/features/calendar/services/study-task.service';

type ColumnKey = 'todo' | 'due' | 'done';

const COLUMNS: { key: ColumnKey; label: string; accent: string }[] = [
  { key: 'due', label: 'Hoje / Atrasadas', accent: 'border-t-amber-500' },
  { key: 'todo', label: 'A fazer', accent: 'border-t-blue-500' },
  { key: 'done', label: 'Concluídas', accent: 'border-t-green-500' },
];

const TYPE_META: Record<StudyTaskType, { label: string; icon: typeof BookOpen; color: string }> = {
  STUDY: { label: 'Estudo', icon: BookOpen, color: 'text-blue-600' },
  REVIEW: { label: 'Revisão', icon: Repeat, color: 'text-amber-600' },
  ESSAY: { label: 'Redação', icon: PenLine, color: 'text-rose-600' },
  MOCK_EXAM: { label: 'Simulado', icon: GraduationCap, color: 'text-purple-600' },
};

function wideRange(): { from: string; to: string } {
  const from = new Date();
  from.setDate(from.getDate() - 180);
  const to = new Date();
  to.setDate(to.getDate() + 365);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function columnOf(task: StudyTask): ColumnKey {
  if (task.completed) return 'done';
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return new Date(task.date) <= end ? 'due' : 'todo';
}

export function BoardPage() {
  const queryClient = useQueryClient();
  const [range] = useState(wideRange);
  const [dragId, setDragId] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['board-tasks'],
    queryFn: () => studyTaskService.list(range.from, range.to),
  });

  const mutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      studyTaskService.setCompleted(id, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board-tasks'] }),
  });

  const onDrop = (target: ColumnKey) => {
    if (!dragId) return;
    const task = tasks.find((t) => t.id === dragId);
    setDragId(null);
    if (!task) return;
    const wantCompleted = target === 'done';
    if (task.completed !== wantCompleted) {
      mutation.mutate({ id: task.id, completed: wantCompleted });
    }
  };

  const grouped: Record<ColumnKey, StudyTask[]> = { todo: [], due: [], done: [] };
  for (const t of tasks) grouped[columnOf(t)].push(t);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-gray-50 p-2 text-primary-600 dark:bg-gray-800">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quadro de tarefas</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Arraste os cartões entre as colunas. Solte em "Concluídas" para marcar como feito.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-sm text-gray-400 dark:border-gray-700">
          Nenhuma tarefa ainda. Gere um plano de estudos a partir de um objetivo para preencher o quadro.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col.key)}
              className={`rounded-xl border border-t-4 border-gray-200 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-900/40 ${col.accent}`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{col.label}</h2>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {grouped[col.key].length}
                </span>
              </div>
              <div className="space-y-2">
                {grouped[col.key].map((task) => (
                  <TaskCard key={task.id} task={task} onDragStart={() => setDragId(task.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onDragStart }: { task: StudyTask; onDragStart: () => void }) {
  const meta = TYPE_META[task.type];
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm active:cursor-grabbing dark:border-gray-800 dark:bg-gray-900 ${
        task.completed ? 'opacity-70' : ''
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <meta.icon className={`h-3.5 w-3.5 ${meta.color}`} />
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{meta.label}</span>
      </div>
      <p className={`text-sm text-gray-900 dark:text-white ${task.completed ? 'line-through' : ''}`}>
        {task.title}
      </p>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(task.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
        </span>
        <span>{task.duration} min</span>
        {task.discipline && <span className="truncate">{task.discipline}</span>}
      </div>
    </div>
  );
}
