import { useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';

import { useRenameDocument } from '../hooks/useRenameDocument';

interface EditableDocumentNameProps {
  id: string;
  name: string;
}

export function EditableDocumentName({ id, name }: EditableDocumentNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const rename = useRenameDocument();

  const startEditing = () => {
    setDraft(name);
    setEditing(true);
  };

  const save = () => {
    const next = draft.trim();
    if (!next || next === name) {
      setEditing(false);
      return;
    }
    rename.mutate({ id, name: next }, { onSuccess: () => setEditing(false) });
  };

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{name}</p>
        <button
          type="button"
          onClick={startEditing}
          aria-label="Editar nome do documento"
          title="Editar nome"
          className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        value={draft}
        maxLength={200}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setEditing(false);
        }}
        aria-label="Nome do documento"
        className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
      <button
        type="button"
        onClick={save}
        disabled={rename.isPending || draft.trim().length === 0}
        aria-label="Salvar nome"
        className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-40 dark:hover:bg-green-950"
      >
        {rename.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        aria-label="Cancelar"
        className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
