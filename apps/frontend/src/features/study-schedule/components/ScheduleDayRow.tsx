import React from 'react';
import { cn } from '@/lib/utils';
import type { ScheduleDay, ScheduleBlock } from '../types';
import { Clock, Star, CheckCircle2, Circle, Target, BookOpen, Sparkles } from 'lucide-react';

interface Props {
  day: ScheduleDay;
  onToggleCompletion?: () => void;
  onGenerate?: (block?: ScheduleBlock) => void;
  isGenerating?: boolean;
}

export const ScheduleDayRow: React.FC<Props> = ({
  day,
  onToggleCompletion,
  onGenerate,
  isGenerating,
}) => {
  const isCompleted = day.completed === true;

  const dateObj = new Date(`${day.date}T12:00:00Z`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const isToday = today.getTime() === dateObj.getTime();

  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')
    : day.dayOfWeek || 'Dia';

  const hasBlocks = day.blocks && day.blocks.length > 0;
  const isDescanso = day.type === 'descanso' || day.subject?.toLowerCase().includes('descanso');
  const isSimulado = day.type === 'simulado' || day.subject?.toLowerCase().includes('simulado');

  return (
    <div
      className={cn(
        'group flex flex-col p-4 sm:p-5 transition-colors bg-slate-900/30 hover:bg-slate-900/60',
        isToday && 'bg-teal-500/5 border-l-4 border-l-teal-500',
        isCompleted && 'opacity-60'
      )}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleCompletion}
            className="text-slate-400 hover:text-teal-400 transition-colors focus:outline-none cursor-pointer"
            title={isCompleted ? 'Desmarcar' : 'Marcar como concluído'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          <div
            className={cn(
              'w-[110px] shrink-0 text-sm font-semibold capitalize',
              isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
            )}
          >
            {formattedDate}
          </div>
        </div>

        {/* Resumo do Dia */}
        <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
          {isDescanso && (
            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-semibold">
              Descanso
            </span>
          )}
          {isSimulado && (
            <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-semibold">
              Simulado
            </span>
          )}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60 text-slate-200">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>{day.totalHours || day.hours || 0}h Total</span>
          </div>

          {!hasBlocks && isSimulado && onGenerate && (
            <button
              type="button"
              onClick={() => onGenerate()}
              disabled={isGenerating}
              className="text-xs font-semibold px-3 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 ml-2 cursor-pointer shadow-sm"
            >
              {isGenerating ? 'Gerando...' : 'Gerar Simulado'}
            </button>
          )}
        </div>
      </div>

      {/* BLOCOS POMODORO / MATÉRIAS */}
      <div className="mt-3 pl-8 md:pl-32 flex flex-col gap-2.5">
        {hasBlocks ? (
          day.blocks.map((block, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/90 hover:border-teal-500/40 hover:shadow-md transition-all gap-3"
            >
              <div className="flex items-center gap-2.5 flex-wrap flex-1">
                <span
                  className={cn(
                    'text-sm font-semibold text-white',
                    isCompleted && 'line-through text-slate-500'
                  )}
                >
                  {block.subject}
                </span>

                {block.priority === 'alta' && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 shrink-0">
                    <Star className="w-3 h-3" /> Foco
                  </span>
                )}
                {block.type === 'revisao' && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30 shrink-0">
                    <BookOpen className="w-3 h-3" /> {block.revisionNumber || 'Revisão'}
                  </span>
                )}
                {block.type === 'questoes' && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
                    <Target className="w-3 h-3" /> Questões
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs justify-between md:justify-end w-full md:w-auto mt-1 md:mt-0">
                <span className="text-slate-200 font-medium flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700/60">
                  <Clock className="w-3 h-3 text-teal-400" /> {block.hours}h
                </span>

                {block.notes && (
                  <span
                    className="text-slate-400 text-xs italic hidden lg:block max-w-[200px] truncate"
                    title={block.notes}
                  >
                    {block.notes}
                  </span>
                )}

                {onGenerate && block.type !== 'descanso' && (
                  <button
                    type="button"
                    onClick={() => onGenerate(block)}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-500/40 text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 hover:border-teal-500/60 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGenerating
                      ? '...'
                      : block.type === 'questoes'
                      ? 'Gerar Questões'
                      : 'Gerar Flashcards'}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          !isDescanso &&
          !isSimulado &&
          day.subject && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-800/80 bg-slate-950/60">
              <span
                className={cn(
                  'font-medium text-sm text-white',
                  isCompleted ? 'line-through text-slate-500' : 'text-white'
                )}
              >
                {day.subject}
              </span>
              {onGenerate && (
                <button
                  type="button"
                  onClick={() => onGenerate()}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-500/40 text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 transition-colors disabled:opacity-50 ml-auto cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isGenerating ? 'Gerando...' : 'Gerar Flashcards'}
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};
