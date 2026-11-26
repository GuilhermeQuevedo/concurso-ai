import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, PencilLine, Loader2, FileQuestion, LayoutGrid, Folder, SlidersHorizontal } from 'lucide-react';
import {
  questionSetService,
  type QuestionSetSummary,
} from '@/features/questions/services/question-set.service';
import { useScheduleTarget } from '@/features/content/hooks/useScheduleTarget';
import { QuestionSetCard } from '@/features/questions/components/QuestionSetCard';
import { BankQuestionsModal } from '@/features/questions/components/BankQuestionsModal';
import { GenerateAIModal } from '@/features/questions/components/GenerateAIModal';
import { QuestionSourceChooser } from '@/features/questions/components/QuestionSourceChooser';
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
  const [showChooser, setShowChooser] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const target = useScheduleTarget();
  const autoOpened = useRef(false);
  useEffect(() => {
    if (!target.name || !target.ready || autoOpened.current) return;
    autoOpened.current = true;
    setShowAI(true);
  }, [target.name, target.ready]);
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
    setShowBank(false);
    setShowChooser(false);
    setShowManual(false);
    queryClient.invalidateQueries({ queryKey: ['question-sets'] });
  };

  const openFolder = (key: string) => {
    setFilter(key);
    changeView('cards');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-fast">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Questões & Simulados</h1>
          <p className="max-w-xl text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
            Nossa IA gera questões e simulados personalizados no padrão da sua banca examinadora, preparando você exatamente para o estilo de cobrança da prova.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xs">
            {(['cards', 'folders'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => changeView(mode)}
                title={mode === 'cards' ? 'Ver em cards' : 'Ver em pastas'}
                aria-label={mode === 'cards' ? 'Ver em cards' : 'Ver em pastas'}
                aria-pressed={view === mode}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  view === mode
                    ? 'bg-primary-600/10 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300 font-bold'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                }`}
              >
                {mode === 'cards' ? <LayoutGrid className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <SubjectFilter subjects={subjects} total={sets.length} value={filter} onChange={setFilter} />
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all duration-fast hover:bg-gray-100 dark:hover:bg-gray-700 shadow-xs touch-manipulation cursor-pointer active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <PencilLine className="h-4 w-4 text-gray-500" /> Criar Manual
          </button>
          <button
            type="button"
            onClick={() => setShowChooser(true)}
            className="min-h-[44px] flex items-center gap-2 rounded-xl bg-[#2E8C82] px-4 py-2 text-sm font-bold text-white transition-all duration-fast hover:bg-[#26776f] shadow-xs touch-manipulation cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            <Sparkles className="h-4 w-4" /> Gerar questões
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[#2E8C82]" />
        </div>
      ) : sets.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <FileQuestion className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mb-1 text-base font-bold text-slate-800 dark:text-slate-200">Nenhum simulado ainda</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
            Clique em “Gerar questões” para criar seu primeiro caderno de questões no estilo da sua prova ou usar o banco de bancas.
          </p>
          <button
            type="button"
            onClick={() => setShowChooser(true)}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#26776f] cursor-pointer transition-all duration-fast touch-manipulation active:scale-95"
          >
            <Sparkles className="h-4 w-4" /> Gerar Primeiro Simulado
          </button>
        </div>
      ) : view === 'folders' && filter === 'all' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {subjects.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => openFolder(s.key)}
              className="flex flex-col items-center rounded-2xl border border-gray-200/70 bg-white p-4 text-center transition-all duration-fast hover:shadow-sm hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 cursor-pointer touch-manipulation active:scale-98"
            >
              <Folder className="mb-2 h-12 w-12" style={{ color: subjectColor(s.key) }} fill="currentColor" fillOpacity={0.25} />
              <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-full">{s.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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

      {showChooser && (
        <QuestionSourceChooser
          onClose={() => setShowChooser(false)}
          onChoose={(source) => {
            setShowChooser(false);
            if (source === 'ai') setShowAI(true);
            else setShowBank(true);
          }}
        />
      )}
      {showBank && <BankQuestionsModal onClose={() => setShowBank(false)} onCreated={refresh} />}
      {showAI && <GenerateAIModal onClose={() => setShowAI(false)} onCreated={refresh} initialSubjectId={target.subject?.id} />}
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
      type="button"
      onClick={() => { onChange(key); setOpen(false); }}
      className={`min-h-[40px] flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
        value === key ? 'font-bold text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'
      }`}
    >
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dot ?? '#9ca3af' }} />
      <span className="flex-1 truncate">{label}</span>
      <span className="text-xs text-gray-400 font-medium">{count}</span>
    </button>
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 shadow-xs touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <SlidersHorizontal className="h-4 w-4 text-gray-500" /> Filtrar
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 animate-in fade-in duration-fast">
          <p className="px-3.5 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Filtrar por Matéria</p>
          {row('all', 'Todas as matérias', total)}
          {subjects.map((s) => row(s.key, s.name, s.decks, subjectColor(s.key)))}
        </div>
      )}
    </div>
  );
}
