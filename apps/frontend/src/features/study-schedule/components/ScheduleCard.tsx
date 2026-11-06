import { useState } from 'react';
import { CalendarDays, Clock, BookOpen, Trash2, Pencil, Check, X } from 'lucide-react';
import { daysUntil, formatExamDate } from '@/features/contests/components/ContestCard';
import type { StudySchedule } from '../types';

export interface ScheduleCardProps {
  schedule: StudySchedule;
  onClick: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export function ScheduleCard({ schedule, onClick, onDelete, onRename }: ScheduleCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const rawExamDate = schedule.examDate || schedule.exam_date || null;
  const currentTitle =
    schedule.schedule?.title ||
    (rawExamDate ? `Prova em ${formatExamDate(rawExamDate)}` : 'Cronograma de Estudos');
  const [draftTitle, setDraftTitle] = useState(currentTitle);

  const days = daysUntil(rawExamDate);
  const dailyHours = schedule.dailyHours || schedule.daily_hours || 3;
  const subjectsCount = schedule.subjects?.length || 0;

  const daysColor =
    days === null
      ? ''
      : days <= 14
      ? 'text-red-600 dark:text-red-400'
      : days <= 45
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-green-600 dark:text-green-400';

  const handleSaveTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = draftTitle.trim();
    if (next && schedule.id) {
      onRename(schedule.id, next);
    }
    setIsEditing(false);
  };

  const handleCancelTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftTitle(currentTitle);
    setIsEditing(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
      }}
      className="flex w-full cursor-pointer flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle(e as unknown as React.MouseEvent);
                  if (e.key === 'Escape') handleCancelTitle(e as unknown as React.MouseEvent);
                }}
                autoFocus
                className="h-8 flex-1 rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                aria-label="Salvar nome"
                className="rounded-md bg-primary-50 p-1.5 text-primary-600 hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-300"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCancelTitle}
                aria-label="Cancelar"
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-gray-900 dark:text-white">{currentTitle}</h3>
              {schedule.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  aria-label="Renomear cronograma"
                  title="Renomear"
                  className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:text-gray-700 group-hover:opacity-100 hover:opacity-100 dark:hover:text-gray-200"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {days !== null && days >= 0 && (
            <div className="text-right">
              <span className={`text-2xl font-bold ${daysColor}`}>{days}</span>
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">dias</span>
            </div>
          )}

          {schedule.id && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (schedule.id) onDelete(schedule.id);
              }}
              aria-label="Excluir cronograma"
              title="Excluir"
              className="ml-2 rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          {dailyHours}h por dia
        </span>
        <span className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <BookOpen className="h-3 w-3" />
          {subjectsCount} {subjectsCount === 1 ? 'matéria' : 'matérias'}
        </span>
        {rawExamDate && (
          <span className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            <CalendarDays className="h-3 w-3" />
            Prova: {formatExamDate(rawExamDate)}
          </span>
        )}
      </div>
    </div>
  );
}
