import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ChevronRight, BookOpen } from 'lucide-react';
import { contentService, type SubjectDTO } from '@/features/content/services/content.service';

export function SubjectsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [addingParentId, setAddingParentId] = useState<string | null | undefined>(undefined);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: contentService.getSubjects,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; parentId?: string | null }) => contentService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setNewName('');
      setAddingParentId(undefined);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => contentService.updateSubject(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: contentService.deleteSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim(), parentId: addingParentId ?? null });
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    updateMutation.mutate({ id, name: editName.trim() });
  };

  const renderSubject = (subject: SubjectDTO, depth: number = 0) => {
    const isExpanded = expandedIds.has(subject.id);
    const hasChildren = subject.children && subject.children.length > 0;
    const isEditing = editingId === subject.id;
    const isAddingChild = addingParentId === subject.id;

    return (
      <div key={subject.id}>
        <div
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
          style={{ marginLeft: depth * 24 }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(subject.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <span className="w-4" />
          )}

          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(subject.id); }} className="flex flex-1 items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                autoFocus
              />
              <button type="submit" className="text-sm text-primary-600 hover:text-primary-500">Salvar</button>
              <button type="button" onClick={() => setEditingId(null)} className="text-sm text-gray-500 hover:text-gray-400">Cancelar</button>
            </form>
          ) : (
            <>
              <BookOpen className="h-4 w-4 text-primary-500" />
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{subject.name}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setAddingParentId(subject.id); setNewName(''); }}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  title="Adicionar subdisciplina"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setEditingId(subject.id); setEditName(subject.name); }}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(subject.id)}
                  className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                  disabled={hasChildren}
                  title={hasChildren ? 'Remova as subdisciplinas primeiro' : 'Excluir'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {isAddingChild && (
          <form
            onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
            className="mt-1 flex items-center gap-2"
            style={{ marginLeft: (depth + 1) * 24 }}
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da subdisciplina"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              autoFocus
            />
            <button type="submit" className="rounded-lg bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700">Criar</button>
            <button type="button" onClick={() => setAddingParentId(undefined)} className="text-sm text-gray-500">Cancelar</button>
          </form>
        )}

        {isExpanded && hasChildren && (
          <div className="mt-1 space-y-1">
            {subject.children!.map((child) => renderSubject(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Disciplinas</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Organize suas disciplinas e subassuntos</p>
        </div>
        <button
          onClick={() => { setAddingParentId(null); setNewName(''); }}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> Nova disciplina
        </button>
      </div>

      {addingParentId === null && (
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="mb-4 flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da disciplina"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            autoFocus
          />
          <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm text-white hover:bg-primary-700">Criar</button>
          <button type="button" onClick={() => setAddingParentId(undefined)} className="text-sm text-gray-500">Cancelar</button>
        </form>
      )}

      <div className="space-y-1">
        {subjects.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma disciplina cadastrada</p>
          </div>
        ) : (
          subjects.map((subject) => renderSubject(subject))
        )}
      </div>
    </div>
  );
}
