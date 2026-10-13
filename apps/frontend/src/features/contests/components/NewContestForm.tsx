import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, FileText, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { contestService } from '../services/contest.service';
import {
  documentService,
  type DocumentKind,
  KIND_LABELS,
  KIND_OPTIONS,
} from '@/features/documents/services/document.service';

type Mode = 'edital' | 'manual';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const OBJETIVO_KINDS: DocumentKind[] = ['EDITAL', 'EMENTA', 'CRONOGRAMA'];
const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'text/html', 'text/markdown', ''];

const KIND_INFO: Record<DocumentKind, string> = {
  EDITAL: 'A IA lê o edital e extrai órgão, banca, cargo, data da prova e o conteúdo programático como checklist.',
  EMENTA: 'A IA lê a ementa/plano de ensino e monta seu checklist de estudo com as disciplinas e tópicos.',
  CRONOGRAMA: 'A IA lê o cronograma e monta seu objetivo de estudo com os tópicos e a contagem regressiva.',
  MATERIAL: 'A IA gera um kit de estudo a partir do material: resumo, flashcards e questões.',
  LISTA_QUESTOES: 'A IA extrai as questões prontas do arquivo e importa para o seu banco de questões.',
  OUTRO: 'A IA gera um kit de estudo a partir do conteúdo: resumo, flashcards e questões.',
};

const KIND_ACTION: Record<DocumentKind, string> = {
  EDITAL: 'Analisar e Criar Objetivo',
  EMENTA: 'Analisar e Criar Objetivo',
  CRONOGRAMA: 'Analisar e Criar Objetivo',
  MATERIAL: 'Gerar Kit de Estudo',
  LISTA_QUESTOES: 'Importar Questões',
  OUTRO: 'Gerar Kit de Estudo',
};

export function NewContestForm({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const [mode, setMode] = useState<Mode>('edital');

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <ChevronLeft className="mr-1 inline h-4 w-4" />
        Voltar
      </button>

      <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Novo Objetivo de Estudo</h2>

      <div className="mb-4 flex gap-2">
        <ModeButton active={mode === 'edital'} onClick={() => setMode('edital')} label="A partir de um arquivo (IA)" />
        <ModeButton active={mode === 'manual'} onClick={() => setMode('manual')} label="Cadastro manual" />
      </div>

      {mode === 'edital' ? <EditalUpload onCreated={onCreated} /> : <ManualForm onCreated={onCreated} />}
    </div>
  );
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function EditalUpload({ onCreated }: { onCreated: (id: string) => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [kind, setKind] = useState<DocumentKind>('EDITAL');
  const [file, setFile] = useState<File | null>(null);
  const [focus, setFocus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isObjetivo = OBJETIVO_KINDS.includes(kind);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione o arquivo');
      const uploaded = await documentService.upload(file, { kind });
      return documentService.process(uploaded.id, isObjetivo ? focus || undefined : undefined);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (result.pipeline === 'objetivo') {
        onCreated(result.contestId);
      } else if (result.pipeline === 'kit') {
        navigate('/flashcards');
      } else {
        navigate('/generate');
      }
    },
  });

  const handleFiles = (files: FileList | null) => {
    setFileError('');
    if (!files || files.length === 0) return;
    const f = files[0];
    const okExt = /\.(pdf|txt|md|html?)$/i.test(f.name);
    if (!ALLOWED_TYPES.includes(f.type) && !okExt) {
      setFileError('Formatos aceitos: PDF, TXT, Markdown, HTML.');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError('Arquivo muito grande. Tamanho máximo: 10MB.');
      return;
    }
    setFile(f);
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          O que é este arquivo?
        </label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as DocumentKind)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          {KIND_OPTIONS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{KIND_INFO[kind]}</p>
      </div>

      {isObjetivo && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Qual o seu foco? <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Ex: Professor de Sociologia, Analista Judiciário, Área de TI..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Informe o cargo ou área que vai prestar. A IA monta o cronograma só com as disciplinas
            exigidas para o seu foco.
          </p>
        </div>
      )}

      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
          <FileText className="h-8 w-8 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            onClick={() => setFile(null)}
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={`mb-2 h-8 w-8 ${dragOver ? 'text-primary-500' : 'text-gray-400'}`} />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Arraste o arquivo aqui ou clique para selecionar
          </p>
          <p className="mt-1 text-xs text-gray-500">PDF, TXT, Markdown ou HTML · Máximo 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.html"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {fileError && <p className="text-xs text-red-500">{fileError}</p>}

      {mutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Erro ao processar o arquivo. Verifique se ele contém texto e tente novamente.
        </div>
      )}

      <button
        onClick={() => mutation.mutate()}
        disabled={!file || mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processando com IA...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {KIND_ACTION[kind]}
          </>
        )}
      </button>
    </div>
  );
}

function ManualForm({ onCreated }: { onCreated: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [examBoard, setExamBoard] = useState('');
  const [role, setRole] = useState('');
  const [examDate, setExamDate] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      contestService.create({
        name,
        organization: organization || undefined,
        examBoard: examBoard || undefined,
        role: role || undefined,
        examDate: examDate || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      onCreated(data.id);
    },
  });

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <Field label="Nome do objetivo *" value={name} onChange={setName} placeholder="Ex: SEEDF — Professor de Sociologia" />
      <Field label="Órgão" value={organization} onChange={setOrganization} placeholder="Ex: Secretaria de Educação do DF" />
      <Field label="Banca" value={examBoard} onChange={setExamBoard} placeholder="Ex: CESPE/CEBRASPE" />
      <Field label="Cargo" value={role} onChange={setRole} placeholder="Ex: Professor de Educação Básica" />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Data da prova</label>
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {mutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Erro ao criar. Tente novamente. Tente novamente.
        </div>
      )}

      <button
        onClick={() => mutation.mutate()}
        disabled={name.trim().length < 3 || mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Criar Objetivo
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );
}
