import { memo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NodeActionHeader } from './NodeActionHeader';
import { NodeActionSatellitesSection } from './NodeActionSatellitesSection';
import { mapService } from '../services/map.service';
import { isReducedMotionPreferred } from '@/lib/motion';
import { isFeatureEnabled } from '@/config/feature-flags';
import type { GraphNode, UserTopicMastery } from '../types/map.types';

export interface NodeActionDrawerProps {
  readonly isOpen: boolean;
  readonly topic: GraphNode | null;
  readonly mastery?: UserTopicMastery;
  readonly onClose: () => void;
  readonly onSelectConnectedTopic: (topicId: string) => void;
}

/**
 * Painel de Ação do Nó Selecionado (Engrama / Astryx).
 *
 * Implementa drawer lateral responsivo (Desktop) e bottom sheet (Mobile).
 * Permite ao concurseiro inspecionar a incidência, o domínio, os flashcards vencidos,
 * as questões erradas e navegar pelas relações conceituais do edital.
 */
export const NodeActionDrawer = memo(function NodeActionDrawer({
  isOpen,
  topic,
  mastery,
  onClose,
  onSelectConnectedTopic,
}: NodeActionDrawerProps) {
  const isAstryxChrome = isFeatureEnabled('ASTRYX_MAP_CHROME');

  // Fecha ao pressionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Carrega os dados satélites do foco
  const { data: focusData, isLoading } = useQuery({
    queryKey: ['review-map-topic-focus', topic?.id],
    queryFn: () => (topic ? mapService.getFocus(topic.id) : null),
    enabled: isOpen && Boolean(topic),
    staleTime: 1000 * 30, // 30s
  });

  if (!isOpen || !topic) {
    return null;
  }

  const isReduced = isReducedMotionPreferred();
  const transitionClass = isReduced ? '' : 'transition-transform duration-300 ease-out';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Ações de estudo para o tópico ${topic.name}`}
      data-astryx-theme={isAstryxChrome ? 'engrama' : undefined}
      className="fixed inset-0 z-50 flex select-none overflow-hidden"
    >
      {/* Backdrop com clique para fechar */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Conteúdo Principal: Drawer Lateral (Desktop) / Bottom Sheet (Mobile) */}
      <aside
        className={
          isAstryxChrome
            ? `relative ml-auto flex h-full w-full flex-col bg-[var(--color-surface-elevated-1)] text-[var(--color-text-primary)] shadow-2xl sm:max-w-md ${transitionClass} max-sm:fixed max-sm:bottom-0 max-sm:h-auto max-sm:max-h-[88vh] max-sm:rounded-t-3xl border-l border-hairline`
            : `relative ml-auto flex h-full w-full flex-col bg-white shadow-2xl dark:bg-slate-900 sm:max-w-md ${transitionClass} max-sm:fixed max-sm:bottom-0 max-sm:h-auto max-sm:max-h-[88vh] max-sm:rounded-t-3xl border-l border-slate-200 dark:border-slate-800`
        }
      >
        {/* Indicador de Arrasto / Puxador no Mobile */}
        <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-[var(--color-text-tertiary)] opacity-40 sm:hidden" aria-hidden="true" />

        {/* Cabeçalho Rico com Indicador Não-Cromático */}
        <NodeActionHeader topic={topic} mastery={mastery} onClose={onClose} />

        {/* Seções e Abas dos Satélites */}
        <NodeActionSatellitesSection
          focusData={focusData ?? null}
          isLoading={isLoading}
          onSelectConnectedTopic={onSelectConnectedTopic}
        />
      </aside>
    </div>
  );
});
