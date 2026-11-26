import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { X, Lightbulb, BookMarked, Check, AlertTriangle, BookOpen } from 'lucide-react';
import { GroupDoubtButton } from '@/features/groups/components/GroupDoubtButton';

import { flashcardService, type DeckDTO, type FlashcardDTO } from '../services/flashcard.service';

const CARD_CONTEXT_SEPARATOR = '\n';

const RATINGS = [
  {
    quality: 0,
    key: '1',
    label: 'Errei',
    buttonClass:
      'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70 focus-visible:ring-red-500',
  },
  {
    quality: 3,
    key: '2',
    label: 'Em dúvida',
    buttonClass:
      'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-950/70 focus-visible:ring-amber-500',
  },
  {
    quality: 5,
    key: '3',
    label: 'Acertei',
    buttonClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/70 focus-visible:ring-emerald-500',
  },
];

const MAX_HINT_LEVEL = 3;

function clock(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function hintText(back: string, level: number): string {
  const chars = Math.ceil((back.length * level) / MAX_HINT_LEVEL);
  return back.slice(0, chars) + (chars < back.length ? '…' : '');
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement;
}

function renderCloze(text: string, back: string) {
  const parts = text.split(/((?:_{2,}\s*)+_{2,}|_{2,})/g);
  const words = back ? back.replace(/\*\*/g, '').trim().split(/\s+/) : ['___'];

  return parts.map((part, pIdx) => {
    if (/_{2,}/.test(part)) {
      return (
        <span key={pIdx} className="inline-flex gap-1.5 mx-1.5 align-middle">
          {words.map((word, wIdx) => {
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
    return part;
  });
}

export function StudySession({ deck, cards, onExit }: { deck: DeckDTO; cards: FlashcardDTO[]; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [elab, setElab] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [tally, setTally] = useState({ good: 0, doubt: 0, bad: 0 });
  const startedAt = useRef(Date.now());

  const card = cards[index];
  const done = index >= cards.length;
  const isCloze = Boolean(card?.front?.match(/_{2,}/));

  useEffect(() => {
    setFlipped(false);
    setHintLevel(0);
    setElab(card?.elaboration ?? '');
  }, [card?.id, card?.elaboration]);

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [done]);

  const review = useMutation({
    mutationFn: async ({ quality }: { quality: number }) => {
      if (elab.trim() && elab.trim() !== (card.elaboration ?? '')) {
        await flashcardService.saveElaboration(card.id, elab).catch(() => undefined);
      }
      return flashcardService.review(card.id, quality);
    },
    onSuccess: (_res, { quality }) => {
      setTally((t) => ({
        good: t.good + (quality >= 4 ? 1 : 0),
        doubt: t.doubt + (quality === 3 ? 1 : 0),
        bad: t.bad + (quality < 3 ? 1 : 0),
      }));
      setIndex((i) => i + 1);
    },
  });

  const rate = useCallback(
    (quality: number) => {
      if (card && flipped && !review.isPending) review.mutate({ quality });
    },
    [card, flipped, review],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || isTyping(e.target)) return;
      if (!flipped && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped) {
        const rating = RATINGS.find((r) => r.key === e.key);
        if (rating) rate(rating.quality);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, done, rate]);

  if (done) {
    const total = tally.good + tally.doubt + tally.bad;
    const hasErrorsOrDoubts = tally.bad > 0 || tally.doubt > 0;

    return (
      <Shell onClose={onExit}>
        <div className="mx-auto mt-16 max-w-sm text-center animate-in fade-in zoom-in-95 duration-fast px-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600 dark:text-primary-400">
            <Check className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sessão concluída!</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Você revisou <strong>{total}</strong> {total === 1 ? 'card' : 'cards'}
          </p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">Tempo de estudo: {clock(elapsed)}</p>
          <ul className="my-5 space-y-2 text-left text-sm text-gray-700 dark:text-gray-300">
            <Row color="#2E8C82" label="Acertei" value={tally.good} />
            <Row color="#F2A93B" label="Em dúvida" value={tally.doubt} />
            <Row color="#EF4444" label="Errei" value={tally.bad} />
          </ul>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            Taxa de retenção: <strong className="text-gray-900 dark:text-white">{total ? Math.round((tally.good / total) * 100) : 0}%</strong>
          </p>

          {/* Ação direta: Ir para o Caderno de Erros */}
          {hasErrorsOrDoubts && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-left space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                {tally.bad + tally.doubt} cards registrados no Caderno de Erros
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Seus cards errados e em dúvida foram salvos automaticamente para fixação nas próximas sessões.
              </p>
              <Link
                to="/error-notebook"
                className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs transition-all duration-fast touch-manipulation cursor-pointer active:scale-98"
              >
                <BookOpen className="w-4 h-4" /> Ir para o Caderno de Erros
              </Link>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onExit}
              className="min-h-[44px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-fast touch-manipulation cursor-pointer active:scale-98"
            >
              Voltar aos decks
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      onClose={onExit}
      center={
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{index + 1} de {cards.length}</p>
          <p className="font-mono text-xs text-gray-500">{clock(elapsed)}</p>
        </div>
      }
      progress={(index / cards.length) * 100}
    >
      <div className="mx-auto max-w-xl px-4 pt-6">
        <p className="mb-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">{deck.name}</p>
        <div
          role="button"
          tabIndex={0}
          onClick={() => !flipped && setFlipped(true)}
          onKeyDown={(e) => {
            if (!flipped && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setFlipped(true);
            }
          }}
          className={`flex min-h-[260px] flex-col items-center justify-center rounded-2xl border p-6 sm:p-8 text-center transition-all duration-fast ease-standard shadow-xs touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
            flipped
              ? 'border-emerald-500/80 bg-emerald-50/20 dark:border-emerald-900/60 dark:bg-emerald-950/20'
              : 'border-gray-200/90 bg-white hover:-translate-y-0.5 hover:shadow-md hover:border-primary-500/60 active:scale-[0.99] cursor-pointer dark:border-gray-800 dark:bg-gray-900'
          }`}
          style={{ borderTop: `4px solid ${flipped ? '#2E8C82' : '#F2A93B'}` }}
        >
          <p className={`mb-3 text-[11px] font-bold uppercase tracking-wider ${flipped ? 'text-primary-600 dark:text-primary-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {flipped ? (isCloze ? 'Preenchimento Correto' : 'Resposta') : (isCloze ? 'Complete a Lacuna' : 'Pergunta')}
          </p>
          <div className="whitespace-pre-line text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
            {flipped ? card.back : isCloze ? renderCloze(card.front, card.back) : card.front}
          </div>
          {!flipped && hintLevel > 0 && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">{hintText(card.back, hintLevel)}</p>
          )}
          {flipped && card.source && (
            <p className="mt-4 inline-flex items-center gap-1 text-[11px] text-gray-400">
              <BookMarked className="h-3 w-3" /> Fonte: {card.source}
            </p>
          )}
          {!flipped && <p className="mt-5 text-xs text-gray-400">Toque no card ou aperte Espaço para ver a resposta</p>}
          {flipped && (
            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
              <GroupDoubtButton targetType="FLASHCARD" targetId={card.id} context={`Frente: ${card.front}${CARD_CONTEXT_SEPARATOR}Verso: ${card.back}`} />
            </div>
          )}
        </div>

        {!flipped ? (
          <div className="mt-3.5 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-400">Clique no card (ou aperte espaço) para revelar a resposta</p>
            {hintLevel < MAX_HINT_LEVEL && (
              <button
                type="button"
                onClick={() => setHintLevel((l) => l + 1)}
                className="min-h-[44px] sm:min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 active:scale-95 transition-all duration-fast touch-manipulation cursor-pointer dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <Lightbulb className="h-3.5 w-3.5" /> Dica gradual ({hintLevel}/{MAX_HINT_LEVEL})
              </button>
            )}
          </div>
        ) : (
          <>
            <details className="mt-3.5 rounded-xl border border-gray-200 bg-white p-3.5 text-sm dark:border-gray-800 dark:bg-gray-900 shadow-xs">
              <summary className="cursor-pointer text-xs font-semibold text-gray-600 dark:text-gray-400 touch-manipulation select-none">
                Elaboração ativa (opcional — consolidação de memória)
              </summary>
              <textarea
                value={elab}
                onChange={(e) => setElab(e.target.value)}
                rows={2}
                placeholder="Explique com suas palavras ou dê um exemplo prático…"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </details>
            <p className="mb-2.5 mt-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Como foi seu domínio? (SM-2)
            </p>
            <div className="grid grid-cols-3 gap-3">
              {RATINGS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => rate(r.quality)}
                  disabled={review.isPending}
                  className={`min-h-[52px] sm:min-h-[48px] flex flex-col items-center justify-center rounded-xl border p-3 text-xs transition-all duration-fast ease-standard active:scale-95 disabled:opacity-50 touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${r.buttonClass}`}
                >
                  <span className="mb-0.5 text-xs font-bold opacity-80">
                    ({r.key})
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-center">
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children, onClose, center, progress }: { children: React.ReactNode; onClose: () => void; center?: React.ReactNode; progress?: number }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-auto">
      <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar sessão de estudo"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-fast touch-manipulation cursor-pointer dark:hover:bg-gray-800 dark:hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <X className="h-5 w-5" />
        </button>
        {center}
        <div className="w-8" />
      </div>
      {typeof progress === 'number' && (
        <div className="h-1 bg-gray-200 dark:bg-gray-800">
          <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="flex-1 pb-12">{children}</div>
    </div>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <strong className="text-gray-900 dark:text-white font-semibold">{value}</strong>
    </li>
  );
}
