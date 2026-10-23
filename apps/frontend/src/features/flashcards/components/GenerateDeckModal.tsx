import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, FileText, X, Sparkles, Loader2 } from 'lucide-react';
import { documentService } from '@/features/documents/services/document.service';
import { apiMessage } from '@/features/games/services/game.service';
import { deckService } from '../services/flashcard.service';
import { DeckFields } from './DeckFormFields';
import { EMPTY_DECK_FORM, fieldClass, labelClass, type DeckForm } from './deckForm';

const MAX_CHARS = 80000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function GenerateDeckModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<DeckForm>(EMPTY_DECK_FORM);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [chooseCount, setChooseCount] = useState(false);
  const [count, setCount] = useState(10);
  const fileInput = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const documentId = file ? (await documentService.upload(file, { kind: 'MATERIAL' })).id : undefined;
      return deckService.generate({
        name: form.name,
        subjectName: form.subjectName || undefined,
        topic: form.topic || undefined,
        color: form.color,
        documentId,
        text: !file && text.trim() ? text.trim() : undefined,
        count: chooseCount ? count : undefined,
      });
    },
    onSuccess: onCreated,
  });

  const pickFile = (f: File | undefined) => {
    setFileError('');
    if (!f) return;
    if (!/\.(pdf|txt|md|html?)$/i.test(f.name)) return setFileError('Envie um PDF, TXT, Markdown ou HTML.');
    if (f.size > MAX_FILE_BYTES) return setFileError('Arquivo muito grande (máx. 10MB).');
    setFile(f);
  };

  const canGenerate = form.name.trim().length >= 2 && (!!file || text.trim().length > 0) && !mutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-5 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Criar novo deck</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Cole um texto e a IA vai gerar flashcards automaticamente.</p>

        <DeckFields value={form} onChange={setForm} />

        <div className="mt-4">
          <label className={labelClass}>Conteúdo para gerar flashcards</label>
          <div
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
            className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-primary-400/60 bg-primary-600/5 px-3 py-3"
          >
            {file ? <FileText className="h-6 w-6 text-primary-600" /> : <Upload className="h-6 w-6 text-primary-600" />}
            <div className="min-w-0 flex-1 text-sm">
              {file ? (
                <p className="truncate font-medium text-gray-900 dark:text-white">{file.name}</p>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  Arraste um PDF aqui ou <span className="text-primary-600">clique para enviar</span>
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">O arquivo precisa ter texto selecionável</p>
            </div>
            {file && (
              <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="rounded p-1 text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            )}
            <input ref={fileInput} type="file" accept=".pdf,.txt,.md,.html" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
          </div>
          {fileError && <p className="mb-1 text-xs text-red-500">{fileError}</p>}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            disabled={!!file}
            rows={5}
            placeholder="Cole aqui o conteúdo do qual deseja gerar flashcards..."
            className={`${fieldClass} resize-none disabled:opacity-50`}
          />
          <p className="mt-1 text-xs text-gray-400">
            {text.length.toLocaleString('pt-BR')} / {MAX_CHARS.toLocaleString('pt-BR')} caracteres
          </p>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <button
            type="button"
            role="switch"
            aria-checked={chooseCount}
            onClick={() => setChooseCount((v) => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors ${chooseCount ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${chooseCount ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
          Escolher número de flashcards
          {chooseCount && (
            <input
              type="number"
              min={1}
              max={30}
              value={count}
              onChange={(e) => setCount(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
              className="w-16 rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          )}
        </label>

        {mutation.isError && <p className="mt-3 text-sm text-red-500">{apiMessage(mutation.error)}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canGenerate}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Gerar com IA
          </button>
        </div>
      </div>
    </div>
  );
}
