import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Sparkles, Loader2, Target } from 'lucide-react';
import { documentService } from '@/features/documents/services/document.service';
import { apiMessage } from '@/features/games/services/game.service';
import { deckService } from '../services/flashcard.service';
import { DeckFields } from './DeckFormFields';
import { EMPTY_DECK_FORM, fieldClass, labelClass, type DeckForm } from './deckForm';
import { PdfDropzone } from '@/components/ui/PdfDropzone';

const MAX_CHARS = 80000;

export function GenerateDeckModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<DeckForm>(EMPTY_DECK_FORM);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [studyMode, setStudyMode] = useState<'standard' | 'cloze'>('standard');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [customFocus, setCustomFocus] = useState('');
  const [count, setCount] = useState(10);

  const mutation = useMutation({
    mutationFn: async () => {
      const documentId = file ? (await documentService.upload(file, { kind: 'MATERIAL' })).id : undefined;
      return deckService.generate({
        name: form.name,
        color: form.color,
        documentId,
        text: !file && text.trim() ? text.trim() : undefined,
        count,
        mode: studyMode,
        difficulty,
        customFocus: customFocus.trim() || undefined,
      });
    },
    onSuccess: onCreated,
  });

  const canGenerate = form.name.trim().length >= 2 && (!!file || text.trim().length > 0) && !mutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 dark:bg-gray-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Criar novo deck inteligente</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Envie seu material ou cole um texto para gerar flashcards de alto rendimento.
        </p>

        <DeckFields value={form} onChange={setForm} hideSubject hideTopic />

        {/* Study Mode, Difficulty & Quantity */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Modo de Estudo</label>
            <select
              value={studyMode}
              onChange={(e) => setStudyMode(e.target.value as 'standard' | 'cloze')}
              className={fieldClass}
            >
              <option value="standard">Padrão</option>
              <option value="cloze">Lacuna (Cloze)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Dificuldade</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
              className={fieldClass}
            >
              <option value="EASY">Fácil</option>
              <option value="MEDIUM">Média</option>
              <option value="HARD">Difícil</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Quantidade</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className={fieldClass}
            >
              <option value={5}>5 Cards</option>
              <option value={10}>10 Cards</option>
              <option value={15}>15 Cards</option>
              <option value={20}>20 Cards</option>
              <option value={30}>30 Cards</option>
            </select>
          </div>
        </div>

        {/* Dropzone */}
        <div className="mt-4">
          <label className={labelClass}>Material de Estudo (PDF)</label>
          <PdfDropzone
            file={file}
            onFileSelect={setFile}
            title="Enviar Apostila ou Resumo"
            subtitle="PDF, até 50MB com texto selecionável"
          />
        </div>

        {!file && (
          <div className="mt-4">
            <label className={labelClass}>Ou cole o texto aqui</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              rows={4}
              placeholder="Cole aqui o conteúdo do qual deseja gerar flashcards..."
              className={`${fieldClass} resize-none`}
            />
            <p className="mt-1 text-xs text-gray-400">
              {text.length.toLocaleString('pt-BR')} / {MAX_CHARS.toLocaleString('pt-BR')} caracteres
            </p>
          </div>
        )}

        {/* Custom Focus */}
        <div className="mt-4">
          <label className={`${labelClass} flex items-center gap-1.5`}>
            <Target className="w-3.5 h-3.5 text-primary-600" /> Foco Específico (Opcional)
          </label>
          <input
            type="text"
            value={customFocus}
            onChange={(e) => setCustomFocus(e.target.value)}
            placeholder="Ex: Foque no Artigo 5º, ignore introdução..."
            className={fieldClass}
          />
        </div>

        {mutation.isError && <p className="mt-3 text-sm text-red-500">{apiMessage(mutation.error)}</p>}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canGenerate}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Gerar com IA
          </button>
        </div>
      </div>
    </div>
  );
}
