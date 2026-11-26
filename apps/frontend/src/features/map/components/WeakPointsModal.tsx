import { memo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  X,
  Flame,
  ArrowRight,
  TrendingUp,
  Layers,
  HelpCircle,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { calculateWeakPoints, type WeakPointItem } from '../utils/weak-points';
import type { GraphNode, UserTopicMastery } from '../types/map.types';

export interface WeakPointsModalProps {
  readonly isOpen: boolean;
  readonly nodes: readonly GraphNode[];
  readonly overlay: Record<string, UserTopicMastery>;
  readonly onClose: () => void;
  readonly onFocusTopicOnMap: (topicId: string) => void;
}

/**
 * Modal do Modo "Revisar Meus Pontos Fracos".
 *
 * Ranqueia e conduz o estudante pelos tópicos de maior risco no edital,
 * calculados matematicamente pelo cruzamento de alta incidência na banca
 * com baixa taxa de domínio pessoal (Prioridade = Incidência × Lacuna).
 */
export const WeakPointsModal = memo(function WeakPointsModal({
  isOpen,
  nodes,
  overlay,
  onClose,
  onFocusTopicOnMap,
}: WeakPointsModalProps) {
  const navigate = useNavigate();

  // Fecha no Escape
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

  if (!isOpen) return null;

  const weakPoints = calculateWeakPoints(nodes, overlay, 5);

  const handleStudyQuestions = (topicId: string) => {
    onClose();
    navigate(`/study?topicId=${topicId}`);
  };

  const handleReviewFlashcards = (topicId: string) => {
    onClose();
    navigate(`/flashcards?topicId=${topicId}`);
  };

  const handleFocus = (topicId: string) => {
    onClose();
    onFocusTopicOnMap(topicId);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="weak-points-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
    >
      {/* Backdrop com fechamento */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Conteúdo do Modal */}
      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <Flame className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="weak-points-title" className="text-base font-bold text-slate-900 dark:text-white">
                Revisar Meus Pontos Fracos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tópicos ordenados por urgência didática (Incidência na banca × Lacuna de domínio).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de pontos fracos"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Lista de Pontos Críticos */}
        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {weakPoints.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/70 p-8 text-center space-y-2 dark:border-slate-800">
              <CheckCircle2 className="mx-auto h-8 w-8 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Parabéns! Nenhum ponto fraco crítico detectado.
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Você mantém boa cobertura em todos os tópicos prioritários do edital.
              </p>
            </div>
          ) : (
            weakPoints.map((item: WeakPointItem) => {
              const isNotStarted = item.masteryScore === 0;

              return (
                <div
                  key={item.node.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-rose-200 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-rose-900/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[10px] font-extrabold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        {item.rank}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.node.name}
                        </h3>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {item.node.levelLabel}
                        </span>
                      </div>
                    </div>

                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/40 shrink-0">
                      {`Prioridade: ${item.priorityScore}`}
                    </span>
                  </div>

                  {/* Métricas: Domínio e Incidência */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      Domínio atual:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {isNotStarted ? 'Não estudado' : `${Math.round(item.masteryScore)}%`}
                      </strong>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      <span>{`Incidência: ${item.node.incidenceWeight}x na prova`}</span>
                    </span>
                    {item.dueFlashcardsCount > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                          <Layers className="h-3 w-3" aria-hidden="true" />
                          <span>{`${item.dueFlashcardsCount} cards vencidos`}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Ações Rápidas */}
                  <div className="mt-1 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleFocus(item.node.id)}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <MapPin className="h-3 w-3 text-primary-600" aria-hidden="true" />
                      <span>Ver no Mapa</span>
                    </button>

                    {item.dueFlashcardsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleReviewFlashcards(item.node.id)}
                        className="flex items-center gap-1 rounded-xl bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-700 cursor-pointer"
                      >
                        <Layers className="h-3 w-3" aria-hidden="true" />
                        <span>Revisar Flashcards</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStudyQuestions(item.node.id)}
                      className="flex items-center gap-1 rounded-xl bg-primary-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary-700 cursor-pointer"
                    >
                      <HelpCircle className="h-3 w-3" aria-hidden="true" />
                      <span>Resolver Questões</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});
