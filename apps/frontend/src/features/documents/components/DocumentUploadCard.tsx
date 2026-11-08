import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Loader2, Upload } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import {
  KIND_LABELS,
  KIND_OPTIONS,
  documentService,
  type DocumentKind,
  type UploadedDocumentDTO,
} from '../services/document.service';
import type { FlatSubject } from '../utils/flatten-subjects';
import { DocumentNameInput } from './DocumentNameInput';

export interface DocumentUploadCardProps {
  subjects: FlatSubject[];
}

const FIELD_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white';

// Cartão de envio: recolhível, para não ocupar a tela de quem já tem muitos documentos.
export function DocumentUploadCard({ subjects }: DocumentUploadCardProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(true);
  const [subjectId, setSubjectId] = useState('');
  const [kind, setKind] = useState<DocumentKind | ''>('');
  const [name, setName] = useState('');
  const [nameMissing, setNameMissing] = useState(false);
  const [lastUpload, setLastUpload] = useState<UploadedDocumentDTO | null>(null);

  const upload = useMutation({
    mutationFn: (file: File) =>
      documentService.upload(file, { subjectId: subjectId || undefined, kind: kind || undefined, name }),
    onSuccess: (uploaded) => {
      setLastUpload(uploaded);
      setName('');
      setNameMissing(false);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Erro ao enviar arquivo. Verifique o formato (PDF, TXT, MD, HTML) e o tamanho (máx 10MB).')),
  });

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!name.trim()) {
      setNameMissing(true);
      event.target.value = '';
      return;
    }
    upload.mutate(file);
  };

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">Enviar documento</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <DocumentNameInput
              value={name}
              onChange={(value) => {
                setName(value);
                if (value.trim()) setNameMissing(false);
              }}
              showError={nameMissing}
            />
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">O que é este arquivo?</label>
              <select value={kind} onChange={(e) => setKind(e.target.value as DocumentKind | '')} className={FIELD_CLASS}>
                <option value="">Detectar automaticamente</option>
                {KIND_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Disciplina (opcional)</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={FIELD_CLASS}>
                <option value="">Sem disciplina</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.prefix}
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.html" onChange={onFileChange} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={upload.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {upload.isPending ? 'Enviando...' : 'Enviar arquivo'}
              </button>
            </div>
          </div>
          {upload.isSuccess && lastUpload && (
            <p className="mt-2 text-sm text-green-600">
              Documento enviado! Identificado como <strong>{KIND_LABELS[lastUpload.kind]}</strong>
              {lastUpload.kindAutoDetected ? ' (detectado automaticamente — ajuste no menu "⋯" se precisar).' : '.'}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">Formatos: PDF, TXT, Markdown, HTML. Máximo 10MB.</p>
        </div>
      )}
    </div>
  );
}
