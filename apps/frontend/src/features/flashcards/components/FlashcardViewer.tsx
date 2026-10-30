import { useState, useEffect, useCallback } from 'react';
import { RotateCw, Check, X, ArrowLeft, ArrowRight, Lightbulb, Sparkles } from 'lucide-react';

export interface ViewerCard {
  id?: string;
  front: string;
  back: string;
  explanation?: string;
  status?: 'correct' | 'incorrect' | 'neutral';
}

export interface FlashcardViewerProps {
  cards: ViewerCard[];
  onFinish?: () => void;
  onRate?: (cardIndex: number, rating: number) => void;
  title?: string;
}

export function FlashcardViewer({ cards, onFinish, onRate, title }: FlashcardViewerProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    setFlipped(false);
    setFeedback(null);
  }, [index]);

  const currentCard = cards[index];
  const isCloze = Boolean(currentCard?.front?.match(/_{2,}/));

  const handleNext = useCallback(() => {
    if (index < cards.length - 1) {
      setIndex((prev) => prev + 1);
    } else if (onFinish) {
      onFinish();
    }
  }, [index, cards.length, onFinish]);

  const handlePrev = useCallback(() => {
    if (index > 0) {
      setIndex((prev) => prev - 1);
    }
  }, [index]);

  const handleRating = useCallback((rating: number) => {
    const isSuccess = rating >= 4;
    setFeedback(isSuccess ? 'correct' : 'incorrect');
    if (onRate) onRate(index, rating);

    setTimeout(() => {
      setFlipped(false);
      handleNext();
    }, 450);
  }, [index, onRate, handleNext]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (flipped) {
        if (e.key === '1') handleRating(1);
        if (e.key === '2') handleRating(3);
        if (e.key === '3') handleRating(5);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, handleNext, handlePrev, handleRating]);

  if (!cards || cards.length === 0 || !currentCard) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Nenhum flashcard disponível para visualização.
      </div>
    );
  }

  const renderClozeText = (text: string, answer: string) => {
    const parts = text.split(/((?:_{2,}\s*)+_{2,}|_{2,})/g);
    const answerWords = answer ? answer.replace(/\*\*/g, '').trim().split(/\s+/) : ['___'];

    return parts.map((part, pIdx) => {
      if (/_{2,}/.test(part)) {
        return (
          <span key={pIdx} className="inline-flex gap-1.5 mx-1.5 align-middle">
            {answerWords.map((word, wIdx) => {
              const width = Math.max(word.length * 13, 34);
              return (
                <span
                  key={wIdx}
                  style={{ width: `${width}px` }}
                  className="inline-block h-6 border-b-2 border-dashed border-primary-500 bg-primary-500/10 rounded-t-sm"
                />
              );
            })}
          </span>
        );
      }

      return (
        <span key={pIdx}>
          {part.split(/(\*\*.*?\*\*)/g).map((sub, sIdx) => {
            if (sub.startsWith('**') && sub.endsWith('**')) {
              return (
                <strong key={sIdx} className="font-bold text-primary-600 dark:text-primary-400">
                  {sub.slice(2, -2)}
                </strong>
              );
            }
            return sub;
          })}
        </span>
      );
    });
  };

  const progress = Math.round(((index + 1) / cards.length) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Top Bar with title & progress */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="font-semibold text-gray-900 dark:text-white">
            {title ?? (isCloze ? 'Complete a Lacuna' : 'Flashcard')}
          </span>
          <span className="ml-2 text-xs text-gray-400">
            {index + 1} de {cards.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{progress}%</span>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={() => setFlipped((f) => !f)}
        className="relative min-h-[320px] w-full cursor-pointer select-none perspective-1000 transition-transform duration-150 hover:scale-[1.01]"
      >
        <div
          className={`w-full min-h-[320px] rounded-2xl border bg-white dark:bg-gray-900 p-8 shadow-sm flex flex-col justify-between transition-all duration-300 ${
            feedback === 'correct'
              ? 'border-emerald-500 ring-2 ring-emerald-500/30'
              : feedback === 'incorrect'
                ? 'border-red-500 ring-2 ring-red-500/30'
                : 'border-gray-200 dark:border-gray-800 hover:border-primary-500/60'
          }`}
        >
          {/* Card Badge */}
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            <span className="flex items-center gap-1.5">
              {flipped ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Gabarito & Fundamentação
                </>
              ) : (
                <>
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  {isCloze ? 'Preencha mentalmente a lacuna' : 'Pergunta'}
                </>
              )}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-primary-500">
              <RotateCw className="w-3 h-3" />
              Girar (Espaço)
            </span>
          </div>

          {/* Card Body */}
          <div className="my-auto py-4 text-center">
            {flipped ? (
              <div className="space-y-4 text-left">
                <div className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed">
                  {currentCard.back}
                </div>
                {currentCard.explanation && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    <p className="font-semibold text-xs text-gray-400 uppercase tracking-wider mb-1">
                      Por que está correto?
                    </p>
                    <p>{currentCard.explanation}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-lg md:text-xl font-medium text-gray-900 dark:text-white leading-relaxed text-left">
                {isCloze
                  ? renderClozeText(currentCard.front, currentCard.back)
                  : currentCard.front}
              </div>
            )}
          </div>

          {/* Card Footer Hint */}
          <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-800/60">
            {flipped ? 'Avalie seu domínio abaixo para agendar a próxima revisão' : 'Clique no card ou pressione Espaço para ver a resposta'}
          </div>
        </div>
      </div>

      {/* Action Rating Buttons */}
      {flipped ? (
        <div className="grid grid-cols-3 gap-3 animate-in fade-in duration-200">
          <button
            onClick={() => handleRating(1)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 text-sm font-semibold transition-colors"
          >
            <X className="w-4 h-4" /> Errei (1)
          </button>
          <button
            onClick={() => handleRating(3)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400 text-sm font-semibold transition-colors"
          >
            Em dúvida (2)
          </button>
          <button
            onClick={() => handleRating(5)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400 text-sm font-semibold transition-colors"
          >
            <Check className="w-4 h-4" /> Acertei (3)
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={index === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Anterior
          </button>
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            Revelar Resposta
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
          >
            Pular <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
