import { createPortal } from 'react-dom';
import type { TourStep } from './tourSteps';

const CARD_W = 320;
const CARD_H = 180;
const GAP = 12;

function cardPosition(rect: DOMRect | null): { top: number; left: number } {
  if (!rect) {
    return { top: window.innerHeight / 2 - CARD_H / 2, left: window.innerWidth / 2 - CARD_W / 2 };
  }
  const clampLeft = (left: number) => Math.max(GAP, Math.min(left, window.innerWidth - CARD_W - GAP));
  const clampTop = (top: number) => Math.max(GAP, Math.min(top, window.innerHeight - CARD_H - GAP));

  if (rect.right + CARD_W + GAP < window.innerWidth && rect.width < 300) {
    return { top: clampTop(rect.top), left: rect.right + GAP };
  }
  if (rect.bottom + CARD_H + GAP < window.innerHeight) {
    return { top: rect.bottom + GAP, left: clampLeft(rect.left) };
  }
  return { top: clampTop(rect.top - CARD_H - GAP), left: clampLeft(rect.left) };
}

export function TourOverlay({
  step,
  rect,
  index,
  total,
  onPrev,
  onNext,
  onSkip,
}: {
  step: TourStep;
  rect: DOMRect | null;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const pos = cardPosition(rect);
  const isLast = index === total - 1;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-lg ring-2 ring-primary-400 transition-all"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/60" />
      )}

      <div
        className="fixed w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        style={{ top: pos.top, left: pos.left }}
      >
        <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-white">{step.title}</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{step.text}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {index + 1} / {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onSkip}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Pular
            </button>
            {index > 0 && (
              <button
                onClick={onPrev}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Anterior
              </button>
            )}
            <button
              onClick={onNext}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
            >
              {isLast ? 'Concluir' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
