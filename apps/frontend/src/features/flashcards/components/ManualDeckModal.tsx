import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Plus, Trash2, ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { apiMessage } from '@/features/games/services/game.service';
import { deckService } from '../services/flashcard.service';
import { DeckFields } from './DeckFormFields';
import { EMPTY_DECK_FORM, fieldClass, type DeckForm } from './deckForm';

interface Draft {
  front: string;
  back: string;
}

export function ManualDeckModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<DeckForm>(EMPTY_DECK_FORM);
  const [cards, setCards] = useState<Draft[]>([]);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [open, setOpen] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      deckService.create({
        name: form.name,
        subjectName: form.subjectName || undefined,
        topic: form.topic || undefined,
        color: form.color,
        cards,
      }),
    onSuccess: onCreated,
  });

  const addCard = () => {
    if (!front.trim() || !back.trim()) return;
    setCards((prev) => [...prev, { front: front.trim(), back: back.trim() }]);
    setFront('');
    setBack('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-5 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        {step === 1 ? (
          <>
            <div className="mb-1 flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Criar deck manual</h2>
              <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Configure o deck e depois escreva seus próprios flashcards.</p>
            <DeckFields value={form} onChange={setForm} />
            <button
              onClick={() => setStep(2)}
              disabled={form.name.trim().length < 2}
              className="mt-5 w-full rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Próximo: Escrever flashcards
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setStep(1)} className="mb-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para configuração
            </button>
            <div className="mb-1 flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{form.name}</h2>
              <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">Escreva pergunta e resposta de cada flashcard.</p>

            <div className="rounded-xl border border-dashed border-primary-400/50 bg-primary-600/5 p-3">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">Pergunta (frente)</label>
              <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} placeholder="Digite a pergunta..." className={`${fieldClass} mb-2 resize-none`} />
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">Resposta (verso)</label>
              <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={2} placeholder="Digite a resposta..." className={`${fieldClass} mb-2 resize-none`} />
              <button
                onClick={addCard}
                disabled={!front.trim() || !back.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" /> Adicionar flashcard
              </button>
            </div>

            {cards.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {cards.length} {cards.length === 1 ? 'flashcard adicionado' : 'flashcards adicionados'}
                </p>
                {cards.map((c, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setOpen(open === i ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-gray-800 dark:text-gray-200">
                        <span className="text-xs text-gray-400">#{i + 1}</span>
                        <span className="truncate font-medium">{c.front}</span>
                        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
                      </button>
                      <button onClick={() => setCards((prev) => prev.filter((_, idx) => idx !== i))} className="rounded p-1 text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {open === i && <p className="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">{c.back}</p>}
                  </div>
                ))}
              </div>
            )}

            {mutation.isError && <p className="mt-3 text-sm text-red-500">{apiMessage(mutation.error)}</p>}

            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">{cards.length} {cards.length === 1 ? 'flashcard' : 'flashcards'}</span>
              <button
                onClick={() => mutation.mutate()}
                disabled={cards.length === 0 || mutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Salvar deck
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
