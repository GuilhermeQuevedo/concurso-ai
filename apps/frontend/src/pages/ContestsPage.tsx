import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Target } from 'lucide-react';
import { contestService } from '@/features/contests/services/contest.service';
import { ContestCard } from '@/features/contests/components/ContestCard';
import { NewContestForm } from '@/features/contests/components/NewContestForm';
import { ContestDetailView } from '@/features/contests/components/ContestDetailView';

type View = 'list' | 'new' | 'detail';

export function ContestsPage() {
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState('');

  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  if (view === 'new') return <NewContestForm onBack={() => setView('list')} onCreated={openDetail} />;
  if (view === 'detail') return <ContestDetailView contestId={selectedId} onBack={() => setView('list')} />;
  return <ContestList onNew={() => setView('new')} onOpen={openDetail} />;
}

function ContestList({ onNew, onOpen }: { onNew: () => void; onOpen: (id: string) => void }) {
  const { data: contests = [], isLoading } = useQuery({
    queryKey: ['contests'],
    queryFn: contestService.list,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Objetivos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Envie um edital, ementa ou plano de curso e a IA monta seu checklist de estudo com contagem regressiva
          </p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Novo Objetivo
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : contests.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <Target className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Nenhum objetivo cadastrado
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Envie o PDF (edital, ementa, plano de curso) e a IA extrai o conteúdo programático automaticamente
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} onClick={() => onOpen(contest.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ContestsPage;
