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

  // Semaphoric countdown badge styling matching ContestCard
  const countdownBadge = (() => {
    if (days === null) return null;
    if (days < 0) {
      return {
        label: 'Encerrado',
        className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      };
    }
    if (days === 0) {
      return {
        label: 'Hoje!',
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40 font-bold',
      };
    }
    if (days <= 14) {
      return {
        label: `${days} ${days === 1 ? 'dia' : 'dias'}`,
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40 font-bold',
      };
    }
    if (days <= 45) {
      return {
        label: `${days} dias`,
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40 font-medium',
      };
    }
    return {
      label: `${days} dias`,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40 font-medium',
    };
  })();

  const handleSaveTitle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    const next = draftTitle.trim();
    if (next && schedule.id) {
      onRename(schedule.id, next);
    }
    setIsEditing(false);
  };

  const handleCancelTitle = (e: React.MouseEvent | React.KeyboardEvent) => {
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
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group flex w-full cursor-pointer flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 text-left transition-all duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 touch-manipulation dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-900/90"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle(e);
                  if (e.key === 'Escape') handleCancelTitle(e);
                }}
                aria-label="Editar nome do cronograma"
                autoFocus
                className="h-9 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-all duration-fast ease-standard focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                aria-label="Salvar nome"
                className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors duration-fast hover:bg-primary-100 active:scale-95 touch-manipulation dark:bg-primary-950 dark:text-primary-300"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCancelTitle}
                aria-label="Cancelar edição"
                className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-lg text-gray-400 transition-colors duration-fast hover:bg-gray-100 hover:text-gray-600 active:scale-95 touch-manipulation dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 transition-colors duration-fast">
                {currentTitle}
              </h3>
              {schedule.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  aria-label="Renomear cronograma"
                  title="Renomear"
                  className="min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] flex items-center justify-center rounded-md text-gray-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-gray-700 hover:bg-gray-100 transition-all duration-fast touch-manipulation dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {countdownBadge && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${countdownBadge.className}`}>
              <CalendarDays className="h-3 w-3" />
              {countdownBadge.label}
            </span>
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
              className="min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] flex items-center justify-center rounded-md text-gray-400 transition-all duration-fast hover:bg-red-50 hover:text-red-600 active:scale-95 touch-manipulation dark:hover:bg-red-950/50 dark:hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          {dailyHours}h por dia
        </span>
        <span className="flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
          <BookOpen className="h-3 w-3" />
          {subjectsCount} {subjectsCount === 1 ? 'matéria' : 'matérias'}
        </span>
        {rawExamDate && (
          <span className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            <CalendarDays className="h-3 w-3" />
            Prova: {formatExamDate(rawExamDate)}
          </span>
        )}
      </div>
    </div>
  );
}
