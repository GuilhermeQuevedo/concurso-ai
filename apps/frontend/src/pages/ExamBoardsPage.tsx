import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import { contentService, type ExamBoardDTO } from '@/features/content/services/content.service';

export function ExamBoardsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['exam-boards'],
    queryFn: contentService.getExamBoards,
  });

  const createMutation = useMutation({
    mutationFn: contentService.createExamBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-boards'] });
      setNewName('');
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => contentService.updateExamBoard(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-boards'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: contentService.deleteExamBoard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exam-boards'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bancas</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Gerencie as bancas examinadoras</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setNewName(''); }}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> Nova banca
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createMutation.mutate({ name: newName.trim() }); }}
          className="mb-4 flex items-center gap-2"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da banca"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            autoFocus
          />
          <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm text-white hover:bg-primary-700">Criar</button>
          <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-gray-500">Cancelar</button>
        </form>
      )}

      {boards.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma banca cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board: ExamBoardDTO) => (
            <div
              key={board.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              {editingId === board.id ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); if (editName.trim()) updateMutation.mutate({ id: board.id, name: editName.trim() }); }}
                  className="flex flex-1 items-center gap-2"
                >
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    autoFocus
                  />
                  <button type="submit" className="text-sm text-primary-600">Salvar</button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-sm text-gray-500">Cancelar</button>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{board.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{board.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingId(board.id); setEditName(board.name); }}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(board.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
