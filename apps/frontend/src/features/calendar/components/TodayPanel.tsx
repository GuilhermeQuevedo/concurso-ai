import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { studyTaskService, type StudyTask } from '../services/study-task.service';
import { TaskList } from './TaskList';

export function TodayPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['study-tasks-today'],
    queryFn: studyTaskService.today,
  });

  const toggleMutation = useMutation({
    mutationFn: (task: StudyTask) => studyTaskService.setCompleted(task.id, !task.completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['study-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    },
  });

  if (tasks.length === 0) return null;

  const done = tasks.filter((t) => t.completed).length;

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Para estudar hoje</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {done}/{tasks.length}
          </span>
        </div>
        <button
          onClick={() => navigate('/calendar')}
          className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Ver calendário
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <TaskList
        tasks={tasks}
        emptyMessage=""
        onToggle={(task) => toggleMutation.mutate(task)}
      />
    </div>
  );
}
