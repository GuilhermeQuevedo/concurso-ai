import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Trash2, ArrowLeft, Plus, Loader2, Upload } from 'lucide-react';
import { apiMessage } from '@/features/games/services/game.service';
import { deckService, flashcardService, type DeckDTO, type FlashcardDTO } from '../services/flashcard.service';
import { DeckFields } from './DeckFormFields';
import { fieldClass, type DeckForm } from './deckForm';

export function EditDeckModal({ deck, onClose, onChanged }: { deck: DeckDTO; onClose: () => void; onChanged: () => void }) {
  const [form, setForm] = useState<DeckForm>({
    name: deck.name,
    subjectName: deck.subject?.name ?? '',
    topic: deck.topic ?? '',
    color: deck.color,
  });
  const [managing, setManaging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      deckService.update(deck.id, {
        name: form.name,
        subjectName: form.subjectName || undefined,
        topic: form.topic || undefined,
        color: form.color,
      }),
    onSuccess: onChanged,
  });

  const remove = useMutation({ mutationFn: () => deckService.remove(deck.id), onSuccess: onChanged });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-5 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        {managing ? (
          <CardManager deck={deck} onBack={() => setManaging(false)} onChanged={onChanged} />
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Editar deck</h2>
              <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <DeckFields value={form} onChange={setForm} />
            <button onClick={() => setManaging(true)} className="mt-3 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
              Editar ou adicionar flashcards ({deck.total} cards) →
            </button>
            {(save.isError || remove.isError) && <p className="mt-3 text-sm text-red-500">{apiMessage(save.error ?? remove.error)}</p>}
            <div className="mt-5 flex items-center justify-between gap-2">
              {confirmDelete ? (
                <button onClick={() => remove.mutate()} disabled={remove.isPending} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
                  <Trash2 className="h-4 w-4" /> Confirmar exclusão
                </button>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" /> Excluir
                </button>
              )}
              <div className="flex gap-2">
                <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                  Cancelar
                </button>
                <button
                  onClick={() => save.mutate()}
                  disabled={form.name.trim().length < 2 || save.isPending}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CardManager({ deck, onBack, onChanged }: { deck: DeckDTO; onBack: () => void; onChanged: () => void }) {
  const queryClient = useQueryClient();
  const key = ['deck-cards', deck.id];
  const { data: cards = [], isLoading } = useQuery({ queryKey: key, queryFn: () => deckService.cards(deck.id) });
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: key });
    onChanged();
  };

  const add = useMutation({
    mutationFn: () => deckService.addCard(deck.id, { front: front.trim(), back: back.trim() }),
    onSuccess: () => { setFront(''); setBack(''); refresh(); },
  });
  const importMutation = useMutation({
    mutationFn: () => deckService.importCards(deck.id, importText),
    onSuccess: () => { setImportText(''); setShowImport(false); refresh(); },
  });

  return (
    <div>
      <button onClick={onBack} className="mb-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o deck
      </button>
      <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">{deck.name}</h2>

      <div className="rounded-xl border border-dashed border-primary-400/50 bg-primary-600/5 p-3">
        <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} placeholder="Pergunta (frente)" className={`${fieldClass} mb-2 resize-none`} />
        <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={2} placeholder="Resposta (verso)" className={`${fieldClass} mb-2 resize-none`} />
        <div className="flex items-center justify-between">
          <button
            onClick={() => add.mutate()}
            disabled={!front.trim() || !back.trim() || add.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Adicionar flashcard
          </button>
          <button onClick={() => setShowImport((v) => !v)} className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">
            <Upload className="h-3.5 w-3.5" /> Importar texto
          </button>
        </div>
        {showImport && (
          <div className="mt-2">
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={4} placeholder={'Uma linha por cartão: frente;verso'} className={`${fieldClass} mb-2 resize-none`} />
            <button onClick={() => importMutation.mutate()} disabled={importText.trim().length < 3 || importMutation.isPending} className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40">
              Importar
            </button>
            {importMutation.isError && <p className="mt-1 text-xs text-red-500">{apiMessage(importMutation.error)}</p>}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {isLoading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
        ) : (
          cards.map((card, i) => <CardRow key={card.id} card={card} index={i} onChanged={refresh} />)
        )}
      </div>
    </div>
  );
}

function CardRow({ card, index, onChanged }: { card: FlashcardDTO; index: number; onChanged: () => void }) {
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const dirty = front !== card.front || back !== card.back;

  const save = useMutation({ mutationFn: () => deckService.updateCard(card.id, { front: front.trim(), back: back.trim() }), onSuccess: onChanged });
  const remove = useMutation({ mutationFn: () => flashcardService.delete(card.id), onSuccess: onChanged });

  return (
    <div className="rounded-lg border border-gray-200 p-2.5 dark:border-gray-800">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
        <span>#{index + 1}</span>
        <div className="flex items-center gap-2">
          {dirty && (
            <button onClick={() => save.mutate()} disabled={!front.trim() || !back.trim() || save.isPending} className="font-medium text-primary-600 hover:underline">
              Salvar
            </button>
          )}
          <button onClick={() => remove.mutate()} disabled={remove.isPending} className="text-red-400 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} className={`${fieldClass} mb-1.5 resize-none py-1.5`} />
      <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={2} className={`${fieldClass} resize-none py-1.5`} />
    </div>
  );
}
