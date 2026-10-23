import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Lightbulb, BookMarked, Check, Loader2 } from 'lucide-react';
import { flashcardService, type DeckDTO, type FlashcardDTO } from '../services/flashcard.service';

const RATINGS = [
  { quality: 0, key: '1', label: 'Errei completamente', color: '#ef4444' },
  { quality: 2, key: '2', label: 'Quase não sabia', color: '#f97316' },
  { quality: 3, key: '3', label: 'Fiquei em dúvida', color: '#eab308' },
  { quality: 4, key: '4', label: 'Sabia bem', color: '#22c55e' },
  { quality: 5, key: '5', label: 'Sabia perfeitamente', color: '#10b981' },
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

  useEffect(() => {
    setFlipped(false);
    setHintLevel(0);
    setElab(card?.elaboration ?? '');
  }, [card?.id]);

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
    return (
      <Shell onClose={onExit}>
        <div className="mx-auto mt-24 max-w-xs text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-green-500">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sessão concluída!</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Você revisou <strong>{total}</strong> {total === 1 ? 'card' : 'cards'}
          </p>
          <p className="text-xs text-gray-400">Tempo de estudo: {clock(elapsed)}</p>
          <ul className="my-5 space-y-1.5 text-left text-sm text-gray-700 dark:text-gray-300">
            <Row color="#22c55e" label="Sabia bem/perfeitamente" value={tally.good} />
            <Row color="#eab308" label="Em dúvida" value={tally.doubt} />
            <Row color="#ef4444" label="Errou/quase não sabia" value={tally.bad} />
          </ul>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            Taxa de acerto: <strong className="text-gray-900 dark:text-white">{total ? Math.round((tally.good / total) * 100) : 0}%</strong>
          </p>
          <button onClick={onExit} className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
            Voltar aos decks
          </button>
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
        <p className="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">{deck.name}</p>
        <div
          onClick={() => !flipped && setFlipped(true)}
          className={`flex min-h-[210px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900 ${flipped ? '' : 'cursor-pointer'}`}
          style={{ borderTop: `3px solid ${flipped ? '#22c55e' : '#3b82f6'}` }}
        >
          <p className={`mb-3 text-[10px] font-semibold uppercase tracking-widest ${flipped ? 'text-green-500' : 'text-blue-500'}`}>
            {flipped ? 'Resposta' : 'Pergunta'}
          </p>
          <p className="whitespace-pre-line text-lg font-medium text-gray-900 dark:text-white">{flipped ? card.back : card.front}</p>
          {!flipped && hintLevel > 0 && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">{hintText(card.back, hintLevel)}</p>
          )}
          {flipped && card.source && (
            <p className="mt-4 inline-flex items-center gap-1 text-[11px] text-gray-400">
              <BookMarked className="h-3 w-3" /> Fonte: {card.source}
            </p>
          )}
          {!flipped && <p className="mt-5 text-xs text-gray-400">Toque para ver a resposta</p>}
        </div>

        {!flipped ? (
          <div className="mt-3 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-400">Clique no card (ou aperte espaço) para revelar a resposta</p>
            {hintLevel < MAX_HINT_LEVEL && (
              <button
                onClick={() => setHintLevel((l) => l + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-950/30"
              >
                <Lightbulb className="h-3.5 w-3.5" /> Dica gradual ({hintLevel}/{MAX_HINT_LEVEL})
              </button>
            )}
          </div>
        ) : (
          <>
            <details className="mt-3 rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
              <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-400">
                Elaboração ativa (opcional — ajuda a memorizar)
              </summary>
              <textarea
                value={elab}
                onChange={(e) => setElab(e.target.value)}
                rows={2}
                placeholder="Explique com suas palavras ou dê um exemplo da sua vida…"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </details>
            <p className="mb-2 mt-4 text-center text-xs text-gray-500 dark:text-gray-400">Como foi sua resposta?</p>
            <div className="grid grid-cols-5 gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r.quality}
                  onClick={() => rate(r.quality)}
                  disabled={review.isPending}
                  className="flex flex-col items-center gap-1.5 rounded-lg border px-1 py-2.5 text-center text-[11px] font-medium leading-tight transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ color: r.color, borderColor: `${r.color}55`, backgroundColor: `${r.color}14` }}
                >
                  {review.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />}
                  {r.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <li className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1">{label}</span>
      <strong>{value}</strong>
    </li>
  );
}

function Shell({
  onClose,
  center,
  progress,
  children,
}: {
  onClose: () => void;
  center?: React.ReactNode;
  progress?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <header className="relative flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
        <button onClick={onClose} title="Sair" className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X className="h-5 w-5" />
        </button>
        {center}
        <span className="w-8" />
        {progress !== undefined && (
          <div className="absolute inset-x-0 -bottom-px h-0.5 bg-gray-200 dark:bg-gray-800">
            <div className="h-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>
      {children}
    </div>
  );
}
