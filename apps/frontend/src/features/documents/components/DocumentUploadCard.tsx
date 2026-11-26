import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Loader2, Upload } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { invalidateDocuments } from '@/lib/query-invalidation';
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
  'w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 transition-colors focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white touch-manipulation';

/**
 * Card recolhível para envio de novos documentos integrado ao Astryx Design System.
 */
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
      toast.success('Documento enviado com sucesso.');
      setName('');
      setNameMissing(false);
      void invalidateDocuments(queryClient);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error) =>
      toast.error(
        getErrorMessage(
          error,
          'Erro ao enviar arquivo. Verifique o formato (PDF, TXT, MD, HTML) e o tamanho (máx 10MB).'
        )
      ),
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
    <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs transition-all duration-fast">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-[44px] w-full items-center justify-between px-6 py-4 text-left cursor-pointer"
      >
        <span className="text-sm font-bold text-slate-900 dark:text-white">Enviar documento</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
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
              <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                Tipo do documento
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as DocumentKind | '')}
                className={FIELD_CLASS}
              >
                <option value="">Detectar automaticamente</option>
                {KIND_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                Disciplina (opcional)
              </label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={FIELD_CLASS}>
                <option value="">Sem disciplina vinculada</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.prefix}
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.html"
                onChange={onFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={upload.isPending}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#26776f] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer touch-manipulation active:scale-[0.99]"
              >
                {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{upload.isPending ? 'Enviando...' : 'Enviar arquivo'}</span>
              </button>
            </div>
          </div>
          {upload.isSuccess && lastUpload && (
            <p className="mt-3 text-sm font-medium text-[#1b5e56] dark:text-[#52b3a8]">
              Documento enviado! Identificado como <strong>{KIND_LABELS[lastUpload.kind]}</strong>
              {lastUpload.kindAutoDetected ? ' (detectado automaticamente).' : '.'}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-400">Formatos aceitos: PDF, TXT, Markdown, HTML · Limite de 10MB</p>
        </div>
      )}
    </div>
  );
}
