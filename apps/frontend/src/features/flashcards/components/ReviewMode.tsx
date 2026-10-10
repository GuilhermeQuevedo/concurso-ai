import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Eye, Lightbulb, Check, BookMarked, Loader2 } from 'lucide-react';
import { flashcardService, type FlashcardDTO } from '@/features/flashcards/services/flashcard.service';

const QUALITY_BUTTONS = [
  { quality: 0, key: '1', label: 'De novo', color: 'bg-red-500 hover:bg-red-600' },
  { quality: 3, key: '2', label: 'Difícil', color: 'bg-orange-500 hover:bg-orange-600' },
  { quality: 4, key: '3', label: 'Bom', color: 'bg-blue-500 hover:bg-blue-600' },
  { quality: 5, key: '4', label: 'Fácil', color: 'bg-green-500 hover:bg-green-600' },
];

const ELABORATION_PLACEHOLDER = 'Explique com suas palavras ou dê um exemplo da sua vida…';

function previewInterval(card: FlashcardDTO, quality: number): string {
  if (quality < 3) return '< 1 dia';
  let interval: number;
  if (card.repetition === 0) interval = 1;
  else if (card.repetition === 1) interval = 6;
  else interval = Math.round(card.interval * card.easeFactor);
  if (interval <= 1) return '1 dia';
  if (interval < 30) return `${interval} dias`;
  const months = Math.round(interval / 30);
  return months <= 1 ? '1 mês' : `${months} meses`;
}

function hintText(back: string, level: number): string {
  if (level <= 0) return '';
  const chars = Math.ceil((back.length * level) / 3);
  return back.slice(0, chars) + (chars < back.length ? '…' : '');
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement;
}

export function ReviewMode({ cards, onBack }: { cards: FlashcardDTO[]; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [elab, setElab] = useState('');
  const [savedElab, setSavedElab] = useState(false);

  const card = cards[index];
  const done = cards.length === 0 || index >= cards.length;

  useEffect(() => {
    setFlipped(false);
    setHintLevel(0);
    setElab(card?.elaboration ?? '');
    setSavedElab(false);
  }, [card?.id]);

  const reviewMutation = useMutation({
    mutationFn: ({ id, quality }: { id: string; quality: number }) => flashcardService.review(id, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-stats'] });
      setIndex((prev) => prev + 1);
    },
  });

  const elaborateMutation = useMutation({
    mutationFn: () => flashcardService.saveElaboration(card.id, elab),
    onSuccess: () => setSavedElab(true),
  });

  const rate = useCallback(
    (quality: number) => {
      if (!card || reviewMutation.isPending) return;
      if (elab.trim() && elab.trim() !== (card.elaboration ?? '') && !savedElab) {
        elaborateMutation.mutate();
      }
      reviewMutation.mutate({ id: card.id, quality });
    },
    [card, reviewMutation, elab, savedElab, elaborateMutation],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || isTyping(e.target)) return;
      if (!flipped && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        setFlipped(true);
        return;
      }
      if (flipped) {
        const btn = QUALITY_BUTTONS.find((b) => b.key === e.key);
        if (btn) {
          e.preventDefault();
          rate(btn.quality);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, done, rate]);

  if (done) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <RotateCcw className="mx-auto mb-3 h-10 w-10 text-green-500" />
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Revisão concluída!</h2>
        <p className="mb-4 text-sm text-gray-500">Você revisou {index} card(s).</p>
        <button onClick={onBack} className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">← Voltar</button>
        <span className="text-sm text-gray-500">{index + 1} / {cards.length}</span>
      </div>

      <div
        onClick={() => !flipped && setFlipped(true)}
        className="mb-3 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900"
      >
        {!flipped ? (
          <>
            <p className="text-lg text-gray-900 dark:text-white">{card.front}</p>
            {hintLevel > 0 && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                {hintText(card.back, hintLevel)}
              </p>
            )}
            <p className="mt-4 flex items-center gap-1 text-xs text-gray-400">
              <Eye className="h-3 w-3" /> Clique ou aperte espaço para ver a resposta
            </p>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{card.front}</p>
            <hr className="mb-3 w-16 border-gray-200 dark:border-gray-700" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">{card.back}</p>
            {card.source && (
              <p className="mt-4 inline-flex items-center gap-1 text-[11px] text-gray-400">
                <BookMarked className="h-3 w-3" /> Fonte: {card.source}
              </p>
            )}
          </>
        )}
      </div>

      {!flipped && hintLevel < 3 && (
        <button
          onClick={() => setHintLevel((l) => l + 1)}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-950/30"
        >
          <Lightbulb className="h-3.5 w-3.5" /> Dica gradual ({hintLevel}/3)
        </button>
      )}

      {flipped && (
        <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Elaboração ativa (opcional — ajuda a memorizar)
          </label>
          <textarea
            value={elab}
            onChange={(e) => { setElab(e.target.value); setSavedElab(false); }}
            rows={2}
            placeholder={ELABORATION_PLACEHOLDER}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={() => elaborateMutation.mutate()}
            disabled={!elab.trim() || savedElab || elaborateMutation.isPending}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline disabled:opacity-50 dark:text-primary-400"
          >
            {elaborateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedElab ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
            {savedElab ? 'Salva (também é salva ao avaliar)' : 'Salvar elaboração'}
          </button>
        </div>
      )}

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {QUALITY_BUTTONS.map((btn) => (
            <button
              key={btn.quality}
              onClick={() => rate(btn.quality)}
              disabled={reviewMutation.isPending}
              className={`flex flex-col items-center rounded-lg px-2 py-2 text-white ${btn.color} disabled:opacity-50`}
            >
              <span className="text-sm font-medium">{btn.label}</span>
              <span className="text-[10px] opacity-80">{previewInterval(card, btn.quality)}</span>
              <span className="mt-0.5 rounded bg-white/20 px-1 text-[10px]">{btn.key}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className="w-full rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          Mostrar resposta <span className="opacity-70">(espaço)</span>
        </button>
      )}
    </div>
  );
}
