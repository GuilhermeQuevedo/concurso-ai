import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Layers,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Button, Badge } from '@astryxdesign/core';
import { isFeatureEnabled } from '@/config/feature-flags';
import { mapService } from '../services/map.service';
import type { UserTopicMastery, ConnectedTopic } from '../types/map.types';

export interface ConstellationSatellitesProps {
  readonly topicId: string;
  readonly topicName: string;
  readonly mastery?: UserTopicMastery;
  readonly onClose: () => void;
  readonly onSelectConnectedTopic?: (targetId: string) => void;
  readonly onOpenDrawer?: () => void;
}

/**
 * Painel Flutuante de Satélites do Tópico em Foco.
 *
 * Princípio Arquitetural: Nem tudo é nó no grafo. Flashcards vencidos,
 * questões erradas e relações semânticas só materializam-se como satélites
 * quando o tópico é colocado em foco ativo.
 *
 * Modernizado com Astryx e Especificação Visual Engrama:
 * - Microtransição BlurSwap (max 3px blur / 140ms de orçamento) ao trocar de foco
 * - Hairlines translúcidos com alfa adaptável
 * - Ações via Astryx Button com contraste mínimo 4.5:1
 */
export const ConstellationSatellites = memo(function ConstellationSatellites({
  topicId,
  topicName,
  mastery,
  onClose,
  onSelectConnectedTopic,
  onOpenDrawer,
}: ConstellationSatellitesProps) {
  const navigate = useNavigate();
  const isAstryxChrome = isFeatureEnabled('ASTRYX_MAP_CHROME');
  const [isBlurSwapping, setIsBlurSwapping] = useState<boolean>(false);

  // Microinteração BlurSwap ao trocar de tópico
  useEffect(() => {
    setIsBlurSwapping(true);
    const timer = setTimeout(() => {
      setIsBlurSwapping(false);
    }, 140); // 140ms: orçamento rígido de microtransição
    return () => clearTimeout(timer);
  }, [topicId]);

  // Fecha o painel com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Busca dados de foco do backend (/api/map/topics/:id/focus)
  const { data: focusData, isLoading } = useQuery({
    queryKey: ['review-map-topic-focus', topicId],
    queryFn: () => mapService.getFocus(topicId, { cardsLimit: 3, errorsLimit: 3, relationsLimit: 4 }),
    staleTime: 1000 * 30, // 30 segundos
  });

  const dueCardsCount = focusData?.satellites.dueFlashcardsTotal ?? mastery?.dueFlashcardsCount ?? 0;
  const errorQuestionsCount = focusData?.satellites.errorQuestionsTotal ?? 0;
  const connectedTopics = focusData?.satellites.connectedTopics ?? [];

  const handleReviewFlashcards = () => {
    navigate('/flashcards');
  };

  const handleReviewErrors = () => {
    navigate('/error-notebook');
  };

  return (
    <aside
      aria-label={`Satélites e ações para o tópico ${topicName}`}
      className={
        isAstryxChrome
          ? 'absolute bottom-6 right-6 z-30 max-w-sm w-[calc(100%-48px)] sm:w-96 rounded-2xl border border-hairline bg-[var(--color-surface-elevated-1)] p-4 shadow-xl backdrop-blur-md transition-all'
          : 'absolute bottom-6 right-6 z-30 max-w-sm w-[calc(100%-48px)] sm:w-96 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md transition-all dark:border-slate-800 dark:bg-slate-900/95'
      }
    >
      {/* Cabeçalho do Foco */}
      <div className="flex items-start justify-between gap-2 border-b border-hairline pb-3">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--color-brand)]">
            Tópico em Foco
          </span>
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-2">
            {topicName}
          </h2>
          {mastery && (
            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className="font-medium">
                Domínio: <strong className="text-[var(--color-text-primary)]">{`${Math.round(mastery.masteryScore)}%`}</strong>
              </span>
              <span>·</span>
              {isAstryxChrome ? (
                <Badge variant="neutral" label={mastery.stateLabel} />
              ) : (
                <span>{mastery.stateLabel}</span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar foco do tópico"
          className="rounded-lg p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-elevated-2)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Conteúdo dos Satélites com transição BlurSwap controlada */}
      <div className={`mt-3 space-y-3 blur-swap-transition ${isBlurSwapping ? 'blur-swap-animating' : ''}`}>
        {/* 1. Satélite Flashcards Vencidos */}
        {dueCardsCount > 0 ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                  <Layers className="h-3.5 w-3.5 stroke-[1.75px]" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {`${dueCardsCount} ${dueCardsCount === 1 ? 'flashcard vencido' : 'flashcards vencidos'}`}
                  </span>
                </div>
              </div>

              {isAstryxChrome ? (
                <div className="cursor-pointer">
                  <Button
                    variant="primary"
                    size="sm"
                    label="Revisar"
                    onClick={handleReviewFlashcards}
                    className="cursor-pointer"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleReviewFlashcards}
                  className="flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  <span>Revisar</span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="py-2 text-center text-xs text-[var(--color-text-tertiary)] animate-pulse">
            Carregando conexões e caderno de erros...
          </div>
        ) : (
          <>
            {/* 2. Satélite Caderno de Erros */}
            {errorQuestionsCount > 0 ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500 text-white shadow-xs">
                      <HelpCircle className="h-3.5 w-3.5 stroke-[1.75px]" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        {`${errorQuestionsCount} ${errorQuestionsCount === 1 ? 'questão errada' : 'questões erradas'}`}
                      </span>
                    </div>
                  </div>

                  {isAstryxChrome ? (
                    <div className="cursor-pointer">
                      <Button
                        variant="destructive"
                        size="sm"
                        label="Treinar"
                        onClick={handleReviewErrors}
                        className="cursor-pointer"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReviewErrors}
                      className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      <span>Treinar</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {/* 3. Sem pendências urgentes */}
            {dueCardsCount === 0 && errorQuestionsCount === 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                <span className="text-xs text-emerald-950 dark:text-emerald-200">
                  Sem revisões vencidas hoje neste tópico. Excelente ritmo!
                </span>
              </div>
            )}

            {/* 4. Satélites de Tópicos Conexos */}
            {connectedTopics.length > 0 && (
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                  Relações conceituais ({connectedTopics.length}):
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {connectedTopics.map((conn: ConnectedTopic) => (
                    <button
                      key={conn.id}
                      type="button"
                      onClick={() => onSelectConnectedTopic?.(conn.id)}
                      title={`${conn.relationLabel}: ${conn.evidence}`}
                      className="group flex items-center gap-1 rounded-lg border border-hairline bg-[var(--color-surface-elevated-2)] px-2 py-1 text-[11px] text-[var(--color-text-primary)] hover:border-[var(--color-brand)] transition-all cursor-pointer"
                    >
                      <span className="text-[9px] font-bold uppercase text-[var(--color-text-tertiary)] group-hover:text-[var(--color-brand)]">
                        {conn.relationLabel}
                      </span>
                      <span className="font-medium truncate max-w-[120px]">{conn.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Ação para Abrir Painel Completo do Tópico */}
            {onOpenDrawer && (
              <div className="pt-2 border-t border-hairline">
                {isAstryxChrome ? (
                  <div className="cursor-pointer">
                    <Button
                      variant="secondary"
                      size="md"
                      label="Abrir Painel Completo de Estudo"
                      onClick={onOpenDrawer}
                      className="w-full cursor-pointer flex justify-center"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenDrawer}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span>Abrir Painel Completo de Estudo</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
});
