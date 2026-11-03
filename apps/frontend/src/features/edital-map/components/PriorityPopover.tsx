import React, { useState, useEffect, useRef } from 'react';
import { X, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriorityPopoverProps {
  title: string;
  badgeNode: React.ReactNode;
  justification: string | null;
  hasAnalysisRan: boolean;
  align?: 'left' | 'right';
  onAnalyzeProbabilities?: () => void;
  children: (props: { onClick: (e: React.MouseEvent) => void }) => React.ReactNode;
}

export const PriorityPopover = ({
  title,
  badgeNode,
  justification,
  hasAnalysisRan,
  align = 'left',
  onAnalyzeProbabilities,
  children,
}: PriorityPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const togglePopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {children({ onClick: togglePopover })}

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 top-full mt-2 w-72 sm:w-80',
            align === 'right' ? 'right-0' : 'left-0',
            'bg-card/95 backdrop-blur-xl border border-border/80',
            'shadow-2xl rounded-xl p-4',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-3 gap-2">
            <h4 className="font-display font-bold text-foreground text-base leading-tight">
              {title}
            </h4>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1 -mr-1 -mt-1 rounded-full hover:bg-secondary/50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-4 pointer-events-none origin-left transform scale-90 -ml-1">
            {badgeNode}
          </div>

          <div className="text-sm text-foreground/90 leading-relaxed font-sans">
            {!hasAnalysisRan ? (
              <div className="space-y-4">
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Execute a Análise de Probabilidades para ver a justificativa detalhada com base no histórico da banca.
                </p>
                {onAnalyzeProbabilities && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onAnalyzeProbabilities();
                    }}
                    className="flex w-full items-center justify-center gap-2 h-9 px-3 rounded-md bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors text-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" /> Executar Análise
                  </button>
                )}
              </div>
            ) : justification ? (
              <p className="text-xs text-muted-foreground leading-relaxed">{justification}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma justificativa específica disponível para este item.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
