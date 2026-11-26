import { memo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Layers,
  HelpCircle,
  Network,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  BookOpen,
} from 'lucide-react';
import { Button, Badge } from '@astryxdesign/core';
import { isFeatureEnabled } from '@/config/feature-flags';
import type { TopicFocusData, ConnectedTopic, SatelliteFlashcard, SatelliteErrorQuestion } from '../types/map.types';

export interface NodeActionSatellitesSectionProps {
  readonly focusData: TopicFocusData | null;
  readonly isLoading: boolean;
  readonly onSelectConnectedTopic: (topicId: string) => void;
}

type TabKey = 'flashcards' | 'errors' | 'connections';

/**
 * Seções e Abas de Ação do Nó Selecionado (Engrama / Astryx).
 * Permite alternar entre Flashcards Vencidos, Caderno de Erros e Tópicos Conexos,
 * com microtransição BlurSwap (140ms / 3px blur) e deep links diretos para estudo focado.
 */
export const NodeActionSatellitesSection = memo(function NodeActionSatellitesSection({
  focusData,
  isLoading,
  onSelectConnectedTopic,
}: NodeActionSatellitesSectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('flashcards');
  const [isBlurSwapping, setIsBlurSwapping] = useState<boolean>(false);
  const isAstryxChrome = isFeatureEnabled('ASTRYX_MAP_CHROME');
  const navigate = useNavigate();

  const handleTabChange = (newTab: TabKey) => {
    if (newTab === activeTab) return;
    setIsBlurSwapping(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsBlurSwapping(false);
    }, 140); // 140ms orçamento rígido de microtransição
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--color-text-tertiary)]">
        <Clock className="h-6 w-6 animate-spin text-[var(--color-brand)] mb-2" aria-hidden="true" />
        <span>Carregando itens de revisão e conexões...</span>
      </div>
    );
  }

  if (!focusData) {
    return null;
  }

  const { topic, satellites } = focusData;
  const { dueFlashcards, errorQuestions, connectedTopics, dueFlashcardsTotal, errorQuestionsTotal } = satellites;

  const handleStartFlashcards = () => {
    navigate(`/flashcards?topicId=${topic.id}`);
  };

  const handleStartErrorTraining = () => {
    navigate(`/error-notebook?topicId=${topic.id}`);
  };

  const handleStartGeneralPractice = () => {
    navigate(`/study?topicId=${topic.id}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Barra de Abas de Navegação */}
      <nav
        aria-label="Abas de ações do tópico"
        className="flex items-center border-b border-hairline px-5 text-xs font-semibold"
      >
        <button
          type="button"
          onClick={() => handleTabChange('flashcards')}
          className={`flex items-center gap-1.5 border-b-2 py-3 px-2 transition-all cursor-pointer ${
            activeTab === 'flashcards'
              ? isAstryxChrome
                ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
                : 'border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Layers className="h-4 w-4 stroke-[1.75px]" aria-hidden="true" />
          <span>Flashcards</span>
          {dueFlashcardsTotal > 0 && (
            isAstryxChrome ? (
              <Badge variant="warning" label={dueFlashcardsTotal} />
            ) : (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {dueFlashcardsTotal}
              </span>
            )
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('errors')}
          className={`flex items-center gap-1.5 border-b-2 py-3 px-2 transition-all cursor-pointer ${
            activeTab === 'errors'
              ? isAstryxChrome
                ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
                : 'border-rose-500 text-rose-700 dark:border-rose-400 dark:text-rose-300'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <HelpCircle className="h-4 w-4 stroke-[1.75px]" aria-hidden="true" />
          <span>Caderno de Erros</span>
          {errorQuestionsTotal > 0 && (
            isAstryxChrome ? (
              <Badge variant="error" label={errorQuestionsTotal} />
            ) : (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                {errorQuestionsTotal}
              </span>
            )
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('connections')}
          className={`flex items-center gap-1.5 border-b-2 py-3 px-2 transition-all cursor-pointer ${
            activeTab === 'connections'
              ? isAstryxChrome
                ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
                : 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Network className="h-4 w-4 stroke-[1.75px]" aria-hidden="true" />
          <span>Conexões</span>
          {connectedTopics.length > 0 && (
            isAstryxChrome ? (
              <Badge variant="neutral" label={connectedTopics.length} />
            ) : (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {connectedTopics.length}
              </span>
            )
          )}
        </button>
      </nav>

      {/* Conteúdo da Aba Ativa com microtransição BlurSwap */}
      <div className={`flex-1 overflow-y-auto p-5 space-y-4 blur-swap-transition ${isBlurSwapping ? 'blur-swap-animating' : ''}`}>
        {/* Aba 1: Flashcards Vencidos */}
        {activeTab === 'flashcards' && (
          <div className="space-y-4">
            {dueFlashcardsTotal > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {`${dueFlashcardsTotal} ${dueFlashcardsTotal === 1 ? 'flashcard vencido hoje' : 'flashcards vencidos hoje'}`}
                  </span>

                  {isAstryxChrome ? (
                    <div className="cursor-pointer">
                      <Button
                        variant="primary"
                        size="sm"
                        label={`Revisar agora (${dueFlashcardsTotal})`}
                        onClick={handleStartFlashcards}
                        className="cursor-pointer font-bold"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartFlashcards}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors cursor-pointer"
                    >
                      <span>{`Revisar agora (${dueFlashcardsTotal})`}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <ul className="space-y-2" aria-label="Prévia dos flashcards vencidos">
                  {dueFlashcards.map((card: SatelliteFlashcard) => (
                    <li
                      key={card.id}
                      className="rounded-xl border border-hairline bg-[var(--color-surface-elevated-2)] p-3 text-xs"
                    >
                      <div className="font-semibold text-[var(--color-text-primary)] line-clamp-2">
                        {card.front}
                      </div>
                      <div className="mt-1 text-[11px] text-[var(--color-text-secondary)] line-clamp-1">
                        {card.back}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="rounded-2xl border border-hairline p-6 text-center space-y-3 bg-[var(--color-surface-elevated-2)]">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" aria-hidden="true" />
                <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Nenhum flashcard vencido neste tópico
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] max-w-xs mx-auto">
                  Sua revisão espaçada para este conteúdo está em dia. Você pode praticar novas questões.
                </p>

                {isAstryxChrome ? (
                  <div className="cursor-pointer flex justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      label="Praticar Questões do Tópico"
                      onClick={handleStartGeneralPractice}
                      className="cursor-pointer font-semibold"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartGeneralPractice}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Praticar Questões do Tópico</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Aba 2: Caderno de Erros */}
        {activeTab === 'errors' && (
          <div className="space-y-4">
            {errorQuestionsTotal > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {`${errorQuestionsTotal} ${errorQuestionsTotal === 1 ? 'questão errada registrada' : 'questões erradas registradas'}`}
                  </span>

                  {isAstryxChrome ? (
                    <div className="cursor-pointer">
                      <Button
                        variant="destructive"
                        size="sm"
                        label={`Refazer (${errorQuestionsTotal})`}
                        onClick={handleStartErrorTraining}
                        className="cursor-pointer font-bold"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartErrorTraining}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      <span>{`Refazer (${errorQuestionsTotal})`}</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <ul className="space-y-2" aria-label="Histórico de erros no tópico">
                  {errorQuestions.map((err: SatelliteErrorQuestion) => (
                    <li
                      key={err.id}
                      className="rounded-xl border border-hairline bg-[var(--color-surface-elevated-2)] p-3 text-xs"
                    >
                      <div className="font-semibold text-[var(--color-text-primary)] line-clamp-2">
                        {err.statement}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)]">
                        <span>{`Sua resposta: ${err.userAnswer}`}</span>
                        <span>{new Date(err.attemptedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="rounded-2xl border border-hairline p-6 text-center space-y-2 bg-[var(--color-surface-elevated-2)]">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" aria-hidden="true" />
                <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Caderno de erros limpo
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] max-w-xs mx-auto">
                  Nenhuma questão marcada com erro recente para este tópico.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Aba 3: Conexões Conceituais */}
        {activeTab === 'connections' && (
          <div className="space-y-3">
            {connectedTopics.length > 0 ? (
              <ul className="space-y-2.5" aria-label="Relações semânticas do tópico">
                {connectedTopics.map((conn: ConnectedTopic) => (
                  <li
                    key={conn.id}
                    className="rounded-xl border border-hairline bg-[var(--color-surface-elevated-2)] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-[var(--color-brand-subtle)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)] border border-hairline">
                        {conn.relationLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectConnectedTopic(conn.id)}
                        className="flex items-center gap-1 font-semibold text-[var(--color-brand)] hover:underline text-xs cursor-pointer"
                      >
                        <span>Focar no mapa</span>
                        <ArrowRight className="h-3 w-3 stroke-[1.75px]" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-1.5 font-bold text-[var(--color-text-primary)]">
                      {conn.name}
                    </div>

                    {conn.evidence && (
                      <p className="mt-1 text-[11px] text-[var(--color-text-secondary)] italic">
                        {`"${conn.evidence}"`}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-hairline p-6 text-center text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated-2)]">
                Nenhuma relação semântica cadastrada para este tópico ainda.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
