import React, { useState, useEffect, useRef } from 'react';
import { X, Play } from 'lucide-react';

interface PriorityPopoverProps {
  title: string;
  badgeNode: React.ReactNode;
  justification: string | null;
  hasAnalysisRan: boolean;
  onAnalyzeProbabilities?: () => void;
  children: (props: { onClick: (e: React.MouseEvent) => void }) => React.ReactNode;
}

export const PriorityPopover = ({
  title,
  badgeNode,
  justification,
  hasAnalysisRan,
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
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 sm:w-80 
                     bg-card/95 backdrop-blur-xl border border-border 
                     shadow-2xl rounded-xl p-4 
                     animate-in fade-in slide-in-from-bottom-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-3 gap-2">
            <h4 className="font-display font-bold text-foreground text-base leading-tight">
              {title}
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1 -mr-1 -mt-1 rounded-full hover:bg-secondary/50"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onAnalyzeProbabilities();
                    }}
                    className="flex w-full items-center justify-center gap-2 h-9 px-3 rounded-md bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors text-xs"
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
