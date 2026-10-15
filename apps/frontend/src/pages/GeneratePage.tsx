import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, PencilLine, Loader2, FileQuestion } from 'lucide-react';
import { questionSetService } from '@/features/questions/services/question-set.service';
import { QuestionSetCard } from '@/features/questions/components/QuestionSetCard';
import { GenerateAIModal } from '@/features/questions/components/GenerateAIModal';
import { CreateManualModal } from '@/features/questions/components/CreateManualModal';

export function GeneratePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAI, setShowAI] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const { data: sets = [], isLoading } = useQuery({
    queryKey: ['question-sets'],
    queryFn: questionSetService.list,
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => questionSetService.getById(id),
    onMutate: (id) => setStartingId(id),
    onSuccess: (detail) => {
      navigate('/study', { state: { questions: detail.questions, mode: detail.mode } });
    },
    onSettled: () => setStartingId(null),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => questionSetService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question-sets'] }),
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Excluir o simulado "${name}"?`)) removeMutation.mutate(id);
  };

  const refresh = () => {
    setShowAI(false);
    setShowManual(false);
    queryClient.invalidateQueries({ queryKey: ['question-sets'] });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Questões</h1>
          <p className="max-w-xl text-sm text-gray-600 dark:text-gray-400">
            Monte simulados com IA no estilo da sua banca ou crie os seus manualmente, e pratique quando quiser.
          </p>
        </div>
        <div className="flex gap-2">
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((s) => (
            <QuestionSetCard
              key={s.id}
              set={s}
              onStart={(id) => startMutation.mutate(id)}
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
