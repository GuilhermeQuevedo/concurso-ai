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
        'group flex flex-col p-4 border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors bg-card/40',
        isToday && 'bg-primary/5 border-l-4 border-l-primary border-b-border/40',
        isCompleted && 'opacity-60'
      )}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleCompletion}
            className="text-muted-foreground hover:text-primary transition-colors focus:outline-none cursor-pointer"
            title={isCompleted ? 'Desmarcar' : 'Marcar como concluído'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          <div
            className={cn(
              'w-[110px] shrink-0 text-sm font-medium capitalize',
              isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
            )}
          >
            {formattedDate}
          </div>
        </div>

        {/* Header summary of the day */}
        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          {day.type === 'descanso' && (
            <span className="text-emerald-500 uppercase tracking-wide font-semibold">Descanso</span>
          )}
          {day.type === 'simulado' && (
            <span className="text-accent uppercase tracking-wide border border-accent/20 px-2 py-0.5 rounded-md font-semibold">
              Simulado
            </span>
          )}
          <div className="flex items-center gap-1.5 bg-secondary/60 px-2.5 py-1 rounded border border-border/40">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{day.totalHours || day.hours || 0}h Total</span>
          </div>

          {!hasBlocks && isSimulado && onGenerate && (
            <button
              type="button"
              onClick={() => onGenerate()}
              disabled={isGenerating}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-accent/30 text-accent hover:bg-accent/10 transition-colors disabled:opacity-50 ml-2"
            >
              {isGenerating ? 'Gerando...' : 'Gerar Simulado'}
            </button>
          )}
        </div>
      </div>

      {/* RENDER MULTIPLE BLOCKS OR LEGACY SINGLE SUBJECT */}
      <div className="mt-3 pl-8 md:pl-28 flex flex-col gap-2">
        {hasBlocks ? (
          day.blocks.map((block, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border border-border/50 bg-background/80 hover:border-primary/40 hover:shadow-sm transition-all gap-3"
            >
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <span
                  className={cn(
                    'text-sm font-semibold text-foreground',
                    isCompleted && 'line-through text-muted-foreground'
                  )}
                >
                  {block.subject}
                </span>

                {block.priority === 'alta' && (
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-sm shrink-0 border border-red-500/20">
                    <Star className="w-3 h-3" /> Foco
                  </span>
                )}
                {block.type === 'revisao' && (
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm shrink-0 border border-primary/20">
                    <BookOpen className="w-3 h-3" /> {block.revisionNumber || 'Revisão'}
                  </span>
                )}
                {block.type === 'questoes' && (
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-sm shrink-0 border border-amber-500/20">
                    <Target className="w-3 h-3" /> Questões
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs justify-between md:justify-end w-full md:w-auto mt-2 md:mt-0">
                <span className="text-muted-foreground font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" /> {block.hours}h
                </span>

                {block.notes && (
                  <span
                    className="text-muted-foreground text-[10px] hidden lg:block italic max-w-[170px] truncate"
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
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded border border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
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
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-medium text-sm',
                  isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                )}
              >
                {day.subject}
              </span>
              {onGenerate && (
                <button
                  type="button"
                  onClick={() => onGenerate()}
                  disabled={isGenerating}
                  className="text-xs font-medium px-3 py-1.5 rounded-md border border-primary/20 text-primary hover:bg-primary/5 transition-colors disabled:opacity-50 ml-auto cursor-pointer"
                >
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
