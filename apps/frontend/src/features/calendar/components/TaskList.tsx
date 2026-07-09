import { BookOpen, CheckCircle2, Circle, Clock, FileCheck, PenLine, RotateCcw } from 'lucide-react';
import type { StudyTask, StudyTaskType } from '../services/study-task.service';
import { TopicContent } from '@/features/contests/components/TopicContent';

const TYPE_CONFIG: Record<StudyTaskType, { icon: typeof BookOpen; label: string; color: string }> = {
  STUDY: { icon: BookOpen, label: 'Estudo', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300' },
  REVIEW: { icon: RotateCcw, label: 'Revisão', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-300' },
  ESSAY: { icon: PenLine, label: 'Redação', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300' },
  MOCK_EXAM: { icon: FileCheck, label: 'Simulado', color: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-300' },
};

export function TaskList({
  tasks,
  emptyMessage,
  onToggle,
}: {
  tasks: StudyTask[];
  emptyMessage: string;
  onToggle: (task: StudyTask) => void;
}) {
  if (tasks.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const config = TYPE_CONFIG[task.type];
        const TypeIcon = config.icon;

        const showsContent = task.syllabusItemId && (task.type === 'STUDY' || task.type === 'REVIEW');

        return (
          <div
            key={task.id}
            className="rounded-lg border border-gray-100 p-3 dark:border-gray-800"
          >
            <button onClick={() => onToggle(task)} className="flex w-full items-start gap-3 text-left">
              {task.completed ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-gray-300 dark:text-gray-600" />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm ${
                    task.completed
                      ? 'text-gray-400 line-through dark:text-gray-500'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {task.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${config.color}`}>
                    <TypeIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                  {task.discipline && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {task.discipline}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                    <Clock className="h-3 w-3" />
                    {task.duration}min
                  </span>
                </div>
              </div>
            </button>
            {showsContent && task.syllabusItemId && (
              <div className="pl-8">
                <TopicContent itemId={task.syllabusItemId} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
