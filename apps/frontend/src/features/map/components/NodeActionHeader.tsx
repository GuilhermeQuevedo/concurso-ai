import { memo } from 'react';
import { X, CheckCircle, Clock, CircleAlert, TrendingUp } from 'lucide-react';
import { Badge } from '@astryxdesign/core';
import { isFeatureEnabled } from '@/config/feature-flags';
import type { GraphNode, UserTopicMastery } from '../types/map.types';

export interface NodeActionHeaderProps {
  readonly topic: GraphNode;
  readonly mastery?: UserTopicMastery;
  readonly onClose: () => void;
}

/**
 * Retorna o ícone e a descrição não-cromática acessível para o estado de domínio.
 */
function getMasteryVisual(score: number, stateLabel: string) {
  if (score >= 75) {
    return {
      icon: CheckCircle,
      label: `${stateLabel} (Alto domínio: ${Math.round(score)}%)`,
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
      barClass: 'bg-teal-600',
    };
  }

  if (score > 0) {
    return {
      icon: Clock,
      label: `${stateLabel} (Em evolução: ${Math.round(score)}%)`,
      badgeClass: 'bg-teal-50/70 text-teal-700 border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900',
      barClass: 'bg-teal-500',
    };
  }

  return {
    icon: CircleAlert,
    label: 'Não estudado (0% de domínio)',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    barClass: 'bg-slate-300 dark:bg-slate-700',
  };
}

/**
 * Cabeçalho do Painel de Ação do Nó.
 * Exibe o nome do tópico, nível na hierarquia do edital, incidência na banca-alvo
 * e indicador não-cromático de domínio (ícone + rótulo textual + barra de progresso).
 */
export const NodeActionHeader = memo(function NodeActionHeader({
  topic,
  mastery,
  onClose,
}: NodeActionHeaderProps) {
  const isAstryxChrome = isFeatureEnabled('ASTRYX_MAP_CHROME');
  const score = mastery?.masteryScore ?? 0;
  const stateLabel = mastery?.stateLabel ?? 'Não estudado';
  const visual = getMasteryVisual(score, stateLabel);
  const StatusIcon = visual.icon;

  return (
    <header className="border-b border-hairline p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {/* Breadcrumbs de Nível e Incidência na Banca */}
          <div className="flex flex-wrap items-center gap-2">
            {isAstryxChrome ? (
              <Badge variant="neutral" label={topic.levelLabel} />
            ) : (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {topic.levelLabel}
              </span>
            )}

            <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/20">
              <TrendingUp className="h-3 w-3 stroke-[1.75px]" aria-hidden="true" />
              <span>{`Incidência: ${topic.incidenceWeight}x na banca`}</span>
            </span>
          </div>

          <h2 className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">
            {topic.name}
          </h2>
          {topic.description && (
            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
              {topic.description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel do tópico"
          className="rounded-xl p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-elevated-2)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer shrink-0"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Indicador Não-Cromático de Domínio (Forma + Texto + Barra) */}
      <div className="mt-4 rounded-xl border border-hairline p-3 bg-[var(--color-surface-elevated-2)]">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)]">
            <StatusIcon className="h-4 w-4 shrink-0 stroke-[1.75px] text-[var(--color-brand)]" aria-hidden="true" />
            <span>{visual.label}</span>
          </div>

          <span className="font-bold text-[var(--color-text-primary)]">
            {`${Math.round(score)}%`}
          </span>
        </div>

        {/* Barra de Progresso Acessível */}
        <div
          role="progressbar"
          aria-valuenow={Math.round(score)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Nível de domínio no tópico"
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-canvas)] border border-hairline"
        >
          <div
            className={
              isAstryxChrome
                ? 'h-full transition-all duration-300 bg-[var(--map-mastery-3)]'
                : `h-full transition-all duration-300 ${visual.barClass}`
            }
            style={{ width: `${Math.max(4, Math.round(score))}%` }}
          />
        </div>

        {mastery && mastery.attemptsCount > 0 && (
          <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)]">
            <span>{`${mastery.attemptsCount} questões respondidas`}</span>
            <span>{`Acurácia: ${Math.round(mastery.accuracy * 100)}%`}</span>
          </div>
        )}
      </div>
    </header>
  );
});
