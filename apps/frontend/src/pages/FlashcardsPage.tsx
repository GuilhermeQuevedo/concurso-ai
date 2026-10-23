import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, PencilLine, Loader2, Layers, LayoutGrid, Folder, ArrowLeft } from 'lucide-react';
import { deckService, type DeckDTO, type FlashcardDTO } from '@/features/flashcards/services/flashcard.service';
import { DeckCard } from '@/features/flashcards/components/DeckCard';
import { GenerateDeckModal } from '@/features/flashcards/components/GenerateDeckModal';
import { ManualDeckModal } from '@/features/flashcards/components/ManualDeckModal';
import { EditDeckModal } from '@/features/flashcards/components/EditDeckModal';
import { StudySession } from '@/features/flashcards/components/StudySession';

type ViewMode = 'cards' | 'folders';

const VIEW_KEY = 'flashcards-view';
const NO_SUBJECT = 'none';

function loadView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === 'folders' ? 'folders' : 'cards';
  } catch {
    return 'cards';
  }
}

export function FlashcardsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>(loadView);
  const [folder, setFolder] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [editing, setEditing] = useState<DeckDTO | null>(null);
  const [session, setSession] = useState<{ deck: DeckDTO; cards: FlashcardDTO[] } | null>(null);
  const [notice, setNotice] = useState('');

  const { data: decks = [], isLoading } = useQuery({ queryKey: ['flashcard-decks'], queryFn: deckService.list });

  const refresh = () => {
    setShowAI(false);
    setShowManual(false);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
    queryClient.invalidateQueries({ queryKey: ['flashcard-stats'] });
  };

  const study = useMutation({
    mutationFn: async (deck: DeckDTO) => {
      let cards = await deckService.study(deck.id);
      if (cards.length === 0 && window.confirm('Nenhum card vencido neste deck. Estudar todos mesmo assim?')) {
        cards = await deckService.study(deck.id, true);
      }
      return { deck, cards };
    },
    onSuccess: ({ deck, cards }) => {
      if (cards.length > 0) setSession({ deck, cards });
      else setNotice(`Nada para revisar em "${deck.name}" agora. Volte quando houver cards vencidos.`);
    },
  });

  const folders = useMemo(() => {
    const map = new Map<string, { key: string; name: string; color: string; decks: number; cards: number }>();
    for (const d of decks) {
      const key = d.subject?.id ?? NO_SUBJECT;
      const entry = map.get(key) ?? { key, name: d.subject?.name ?? 'Sem matéria', color: d.color, decks: 0, cards: 0 };
      entry.decks += 1;
      entry.cards += d.total;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [decks]);

  const changeView = (next: ViewMode) => {
    setView(next);
    setFolder(null);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* sem armazenamento: segue só em memória */
    }
  };

  if (session) {
    return (
      <StudySession
        deck={session.deck}
        cards={session.cards}
        onExit={() => {
          setSession(null);
          refresh();
        }}
      />
    );
  }

  const visible = folder ? decks.filter((d) => (d.subject?.id ?? NO_SUBJECT) === folder) : decks;
  const showFolders = view === 'folders' && !folder;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Revisão ativa com repetição espaçada</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {decks.length > 0 && (
            <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              {(['cards', 'folders'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => changeView(mode)}
                  title={mode === 'cards' ? 'Ver em cards' : 'Ver em pastas'}
                  className={`px-2.5 py-2 ${view === mode ? 'bg-primary-600/10 text-primary-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  {mode === 'cards' ? <LayoutGrid className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowManual(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <PencilLine className="h-4 w-4" /> Criar manual
          </button>
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Sparkles className="h-4 w-4" /> Gerar com IA
          </button>
        </div>
      </div>

      {notice && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">{notice}</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : decks.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-5 flex h-20 w-24 items-center justify-center rounded-xl border border-primary-500/40 bg-primary-600/5">
            <Layers className="h-9 w-9 text-primary-500" />
          </div>
          <p className="mb-1 font-semibold text-gray-900 dark:text-white">Nenhum deck criado ainda</p>
          <p className="mx-auto mb-5 max-w-xs text-sm text-gray-500 dark:text-gray-400">
            Crie seu primeiro deck de flashcards e comece a revisar com repetição espaçada inteligente.
          </p>
          <div className="flex justify-center gap-2">
            <button onClick={() => setShowAI(true)} className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              <Sparkles className="h-4 w-4" /> Gerar com IA
            </button>
            <button onClick={() => setShowManual(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
              <PencilLine className="h-4 w-4" /> Criar manual
            </button>
          </div>
        </div>
      ) : showFolders ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {folders.map((f) => (
            <button
              key={f.key}
              onClick={() => setFolder(f.key)}
              className="flex flex-col items-center rounded-xl p-3 text-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/60"
            >
              <Folder className="mb-1 h-14 w-14" style={{ color: f.color }} fill="currentColor" fillOpacity={0.25} />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{f.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {f.decks} {f.decks === 1 ? 'deck' : 'decks'} · {f.cards} cards
              </span>
            </button>
          ))}
        </div>
      ) : (
        <>
          {folder && (
            <button onClick={() => setFolder(null)} className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
              <ArrowLeft className="h-4 w-4" /> Todas as pastas
            </button>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((deck) => (
              <DeckCard key={deck.id} deck={deck} onStudy={(d) => { setNotice(''); study.mutate(d); }} onEdit={setEditing} />
            ))}
          </div>
        </>
      )}

      {showAI && <GenerateDeckModal onClose={() => setShowAI(false)} onCreated={refresh} />}
      {showManual && <ManualDeckModal onClose={() => setShowManual(false)} onCreated={refresh} />}
      {editing && <EditDeckModal deck={editing} onClose={() => setEditing(null)} onChanged={refresh} />}
    </div>
  );
}
