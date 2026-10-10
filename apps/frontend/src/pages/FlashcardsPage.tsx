import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Trash2, Loader2, RotateCcw, Sparkles, FileUp } from 'lucide-react';
import { contentService, type SubjectDTO } from '@/features/content/services/content.service';
import { flashcardService, type FlashcardDTO } from '@/features/flashcards/services/flashcard.service';
import { GenerateFlashcardsForm } from '@/features/flashcards/components/GenerateFlashcardsForm';
import { ImportFlashcardsForm } from '@/features/flashcards/components/ImportFlashcardsForm';
import { ReviewMode } from '@/features/flashcards/components/ReviewMode';

type View = 'list' | 'review' | 'create' | 'generate' | 'import';

export function FlashcardsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>('list');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [createSubject, setCreateSubject] = useState('');

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: contentService.getSubjects,
  });

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['flashcards', subjectFilter],
    queryFn: () => flashcardService.list(subjectFilter || undefined),
    enabled: view === 'list',
  });

  const { data: dueCards = [], refetch: refetchDue } = useQuery({
    queryKey: ['flashcards-due'],
    queryFn: () => flashcardService.getDue(),
    enabled: view === 'review',
  });

  const { data: stats } = useQuery({
    queryKey: ['flashcard-stats'],
    queryFn: flashcardService.getStats,
  });

  const createMutation = useMutation({
    mutationFn: () => flashcardService.create({ subjectId: createSubject, front, back }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-stats'] });
      setFront('');
      setBack('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: flashcardService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-stats'] });
    },
  });

  const flatSubjects = flattenSubjects(subjects);

  if (view === 'review') {
    return <ReviewMode cards={dueCards} onBack={() => { setView('list'); refetchDue(); }} />;
  }

  if (view === 'generate') {
    return (
      <GenerateFlashcardsForm
        onBack={() => setView('list')}
        onDone={() => {
          queryClient.invalidateQueries({ queryKey: ['flashcards'] });
          setView('list');
        }}
      />
    );
  }

  if (view === 'import') {
    return (
      <ImportFlashcardsForm
        onBack={() => setView('list')}
        onDone={() => {
          queryClient.invalidateQueries({ queryKey: ['flashcards'] });
          setView('list');
        }}
      />
    );
  }

  if (view === 'create') {
    return (
      <div className="mx-auto max-w-xl">
        <button onClick={() => setView('list')} className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          ← Voltar
        </button>
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Novo Flashcard</h2>
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Disciplina *</label>
            <select value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="">Selecione...</option>
              {flatSubjects.map((s) => <option key={s.id} value={s.id}>{s.prefix}{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Frente (pergunta)</label>
            <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Verso (resposta)</label>
            <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!createSubject || !front.trim() || !back.trim() || createMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar Flashcard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            O app repete mais o que você erra e menos o que já sabe
          </p>
        </div>
        <div className="flex gap-2">
          {(stats?.due ?? 0) > 0 && (
            <button onClick={() => setView('review')} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              <RotateCcw className="h-4 w-4" />
              Revisar ({stats?.due})
            </button>
          )}
          <button onClick={() => setView('generate')} className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            <Sparkles className="h-4 w-4" />
            Gerar com IA
          </button>
          <button onClick={() => setView('import')} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            <FileUp className="h-4 w-4" />
            Importar
          </button>
          <button onClick={() => setView('create')} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            <Plus className="h-4 w-4" />
            Manual
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex gap-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Total: <strong className="text-gray-900 dark:text-white">{stats?.total ?? 0}</strong></span>
          <span className="text-gray-500 dark:text-gray-400">Para revisar: <strong className="text-orange-600">{stats?.due ?? 0}</strong></span>
        </div>
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="ml-auto rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
          <option value="">Todas</option>
          {flatSubjects.map((s) => <option key={s.id} value={s.id}>{s.prefix}{s.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : cards.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <Layers className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Nenhum flashcard ainda</p>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Cole o que estudou e deixe a IA criar seus cartões de revisão automaticamente
          </p>
          <button
            onClick={() => setView('generate')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Sparkles className="h-4 w-4" />
            Gerar com IA
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card: FlashcardDTO) => (
            <div key={card.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                  {card.subject?.name}
                </span>
                <button onClick={() => deleteMutation.mutate(card.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mb-1 text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{card.front}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{card.back}</p>
              {card.source && (
                <p className="mt-2 truncate text-[11px] text-gray-400">Fonte: {card.source}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Próxima revisão: {new Date(card.nextReview).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function flattenSubjects(subjects: SubjectDTO[], prefix = ''): Array<SubjectDTO & { prefix: string }> {
  const result: Array<SubjectDTO & { prefix: string }> = [];
  for (const s of subjects) {
    result.push({ ...s, prefix });
    if (s.children && s.children.length > 0) {
      result.push(...flattenSubjects(s.children, prefix + '— '));
    }
  }
  return result;
}
