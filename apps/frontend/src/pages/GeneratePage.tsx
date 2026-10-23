import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, PencilLine, Loader2, FileQuestion, LayoutGrid, Folder, SlidersHorizontal } from 'lucide-react';
import {
  questionSetService,
  type QuestionSetSummary,
} from '@/features/questions/services/question-set.service';
import { QuestionSetCard } from '@/features/questions/components/QuestionSetCard';
import { GenerateAIModal } from '@/features/questions/components/GenerateAIModal';
import { CreateManualModal } from '@/features/questions/components/CreateManualModal';
import { subjectColor } from '@/features/questions/subjectColor';

type ViewMode = 'cards' | 'folders';

const VIEW_KEY = 'questions-view';
const NO_SUBJECT = 'none';

function loadView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === 'folders' ? 'folders' : 'cards';
  } catch {
    return 'cards';
  }
}

function subjectKey(set: QuestionSetSummary): string {
  return set.subject?.id ?? NO_SUBJECT;
}

export function GeneratePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAI, setShowAI] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>(loadView);
  const [filter, setFilter] = useState<string>('all');

  const { data: sets = [], isLoading } = useQuery({
    queryKey: ['question-sets'],
    queryFn: questionSetService.list,
  });

  const subjects = useMemo(() => {
    const map = new Map<string, { key: string; name: string; decks: number; questions: number }>();
    for (const s of sets) {
      const key = subjectKey(s);
      const entry = map.get(key) ?? { key, name: s.subject?.name ?? 'Sem matéria', decks: 0, questions: 0 };
      entry.decks += 1;
      entry.questions += s.total;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [sets]);

  const visible = filter === 'all' ? sets : sets.filter((s) => subjectKey(s) === filter);

  const changeView = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* sem armazenamento: segue só em memória */
    }
  };

  const start = useMutation({
    mutationFn: (id: string) => questionSetService.getById(id),
    onMutate: (id) => setStartingId(id),
    onSuccess: (detail) => navigate('/study', { state: { questions: detail.questions, mode: detail.mode, title: detail.name } }),
    onSettled: () => setStartingId(null),
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => questionSetService.rename(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question-sets'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => questionSetService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question-sets'] }),
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Excluir o simulado "${name}"?`)) remove.mutate(id);
  };

  const refresh = () => {
    setShowAI(false);
    setShowManual(false);
    queryClient.invalidateQueries({ queryKey: ['question-sets'] });
  };

  const openFolder = (key: string) => {
    setFilter(key);
    changeView('cards');
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Questões</h1>
          <p className="max-w-xl text-sm text-gray-600 dark:text-gray-400">
            Nossa IA gera questões e simulados personalizados pra você. Ela analisa o estilo da sua prova e cria
            questões parecidas, praticamente prevendo o que você vai encontrar no dia! 🎯
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {(['cards', 'folders'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => changeView(mode)}
                title={mode === 'cards' ? 'Ver em cards' : 'Ver em pastas'}
                className={`px-2.5 py-2 ${
                  view === mode
                    ? 'bg-primary-600/10 text-primary-600'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {mode === 'cards' ? <LayoutGrid className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <SubjectFilter subjects={subjects} total={sets.length} value={filter} onChange={setFilter} />
          <button
            onClick={() => setShowManual(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <PencilLine className="h-4 w-4" /> Criar Manual
          </button>
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Sparkles className="h-4 w-4" /> Gerar com IA
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : sets.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <FileQuestion className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Nenhum simulado ainda</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Clique em “Gerar com IA” para criar seu primeiro simulado no estilo da sua prova.
          </p>
        </div>
      ) : view === 'folders' && filter === 'all' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {subjects.map((s) => (
            <button
              key={s.key}
              onClick={() => openFolder(s.key)}
              className="flex flex-col items-center rounded-xl p-3 text-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/60"
            >
              <Folder className="mb-1 h-14 w-14" style={{ color: subjectColor(s.key) }} fill="currentColor" fillOpacity={0.25} />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {s.decks} {s.decks === 1 ? 'deck' : 'decks'} · {s.questions} questões
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <QuestionSetCard
              key={s.id}
              set={s}
              onStart={(id) => start.mutate(id)}
              onRename={(id, name) => rename.mutate({ id, name })}
              onDelete={handleDelete}
              starting={startingId === s.id}
            />
          ))}
        </div>
      )}

      {showAI && <GenerateAIModal onClose={() => setShowAI(false)} onCreated={refresh} />}
      {showManual && <CreateManualModal onClose={() => setShowManual(false)} onCreated={refresh} />}
    </div>
  );
}

function SubjectFilter({
  subjects,
  total,
  value,
  onChange,
}: {
  subjects: Array<{ key: string; name: string; decks: number }>;
  total: number;
  value: string;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const row = (key: string, label: string, count: number, dot?: string) => (
    <button
      key={key}
      onClick={() => { onChange(key); setOpen(false); }}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
        value === key ? 'font-semibold text-primary-600' : 'text-gray-700 dark:text-gray-200'
      }`}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot ?? '#9ca3af' }} />
      <span className="flex-1 truncate">{label}</span>
      <span className="text-xs text-gray-400">{count}</span>
    </button>
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <SlidersHorizontal className="h-4 w-4" /> Filtrar
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Matéria</p>
          {row('all', 'Todas as matérias', total)}
          {subjects.map((s) => row(s.key, s.name, s.decks, subjectColor(s.key)))}
        </div>
      )}
    </div>
  );
}
