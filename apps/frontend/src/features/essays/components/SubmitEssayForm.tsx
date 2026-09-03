import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Send, Loader2, ChevronLeft, FileText, Image, X, PenLine, ClipboardList, Shuffle } from 'lucide-react';
import { essayService, type EssayType } from '@/features/essays/services/essay.service';
import { pickRandomTheme, type EssayTheme } from '@/features/essays/data/essayThemes';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type AnswerMode = 'text' | 'file';

export function SubmitEssayForm({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<EssayType>('DISSERTATIVA');
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState('');
  const [role, setRole] = useState('');
  const [examBoard, setExamBoard] = useState('');
  const [caseStatement, setCaseStatement] = useState('');
  const [answerKey, setAnswerKey] = useState('');
  const [lineLimit, setLineLimit] = useState('');

  const [generated, setGenerated] = useState<EssayTheme | null>(null);

  const [answerMode, setAnswerMode] = useState<AnswerMode>('text');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCase = type === 'ESTUDO_CASO';

  const generateTheme = () => {
    const picked = pickRandomTheme(theme);
    setGenerated(picked);
    setTheme(picked.theme);
    if (!title.trim()) setTitle(`Redação — ${picked.category}`);
  };

  const mutation = useMutation({
    mutationFn: () =>
      essayService.submit({
        type,
        title,
        theme,
        content: answerMode === 'text' ? content : undefined,
        file: answerMode === 'file' ? file ?? undefined : undefined,
        role: role || undefined,
        examBoard: examBoard || undefined,
        caseStatement: isCase ? caseStatement : undefined,
        answerKey: isCase ? answerKey : undefined,
        lineLimit: lineLimit ? Number(lineLimit) : undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['essays'] });
      onCreated(data.id);
    },
  });

  const handleFiles = (files: FileList | null) => {
    setFileError('');
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError('Tipo não suportado. Use PDF, JPG, PNG ou WebP.');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError('Arquivo muito grande. Máximo: 10MB.');
      return;
    }
    setFile(f);
  };

  const answerOk = answerMode === 'text' ? content.trim().length >= 30 : file !== null;
  const caseOk = !isCase || caseStatement.trim().length >= 10;
  const canSubmit = title.trim().length >= 3 && theme.trim().length >= 3 && answerOk && caseOk;

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <ChevronLeft className="mr-1 inline h-4 w-4" />
        Voltar
      </button>

      <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Nova Correção</h2>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            <TypeButton
              active={type === 'DISSERTATIVA'}
              onClick={() => setType('DISSERTATIVA')}
              icon={PenLine}
              title="Dissertativa"
              subtitle="Redação argumentativa (CAC/OT/DLP)"
            />
            <TypeButton
              active={type === 'ESTUDO_CASO'}
              onClick={() => setType('ESTUDO_CASO')}
              icon={ClipboardList}
              title="Estudo de caso"
              subtitle="Correção por aspectos do espelho"
            />
          </div>
        </div>

        <Field label="Título *" value={title} onChange={setTitle} placeholder="Ex: Estudo de caso — Licitações" />

        {isCase ? (
          <Field
            label="Tema/assunto *"
            value={theme}
            onChange={setTheme}
            placeholder="Ex: Gestão de contratos administrativos"
          />
        ) : (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tema da redação *</label>
              <button
                type="button"
                onClick={generateTheme}
                className="flex items-center gap-1.5 rounded-lg bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-200 dark:bg-primary-950 dark:text-primary-300 dark:hover:bg-primary-900"
              >
                <Shuffle className="h-3.5 w-3.5" />
                Gerar tema
              </button>
            </div>
            <input
              value={theme}
              onChange={(e) => { setTheme(e.target.value); setGenerated(null); }}
              placeholder="Digite um tema ou clique em “Gerar tema”"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {generated && (
              <div className="mt-2 space-y-2 rounded-lg border border-primary-100 bg-primary-50/50 p-3 text-xs dark:border-primary-900 dark:bg-primary-950/30">
                <span className="inline-block rounded bg-primary-100 px-1.5 py-0.5 text-[11px] font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                  {generated.category}
                </span>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">Comando: </span>
                  {generated.command}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">O que a banca espera: </span>
                  {generated.aspects}
                </p>
              </div>
            )}
          </div>
        )}

        {isCase && (
          <div className="space-y-4 rounded-lg border border-primary-100 bg-primary-50/40 p-4 dark:border-primary-900 dark:bg-primary-950/20">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Cargo/área" value={role} onChange={setRole} placeholder="Ex: Analista Administrativo" />
              <Field label="Banca" value={examBoard} onChange={setExamBoard} placeholder="Ex: Cebraspe, FGV" />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Limite de linhas</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={lineLimit}
                  onChange={(e) => setLineLimit(e.target.value)}
                  placeholder="Ex: 30"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <TextArea
              label="Enunciado do caso *"
              value={caseStatement}
              onChange={setCaseStatement}
              rows={4}
              placeholder="Cole o comando/enunciado do estudo de caso..."
            />
            <TextArea
              label="Espelho de correção (opcional)"
              value={answerKey}
              onChange={setAnswerKey}
              rows={4}
              placeholder="Cole o gabarito com os aspectos esperados e a pontuação. Sem ele, a IA monta um espelho de referência."
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Resposta {isCase ? 'do candidato' : 'da redação'} *
          </label>
          <div className="mb-2 flex gap-2">
            <ModeButton active={answerMode === 'text'} onClick={() => setAnswerMode('text')} icon={PenLine} label="Digitar" />
            <ModeButton active={answerMode === 'file'} onClick={() => setAnswerMode('file')} icon={Upload} label="Enviar arquivo" />
          </div>

          {answerMode === 'text' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="Cole ou digite aqui a resposta..."
              className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm leading-relaxed dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          ) : file ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
              {file.type === 'application/pdf' ? <FileText className="h-8 w-8 text-red-500" /> : <Image className="h-8 w-8 text-blue-500" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => { setFile(null); setFileError(''); }} className="rounded p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-gray-300 hover:border-gray-400 dark:border-gray-700'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className={`mb-2 h-8 w-8 ${dragOver ? 'text-primary-500' : 'text-gray-400'}`} />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Arraste o arquivo ou clique para selecionar</p>
              <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG ou WebP — máx 10MB</p>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </div>
          )}
          {fileError && <p className="mt-1.5 text-xs text-red-500">{fileError}</p>}
        </div>

        {mutation.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            Erro ao enviar. Verifique os campos e tente novamente.
          </div>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Corrigindo com IA...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar para Correção
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function TypeButton({ active, onClick, icon: Icon, title, subtitle }: { active: boolean; onClick: () => void; icon: typeof PenLine; title: string; subtitle: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
        active
          ? 'border-primary-500 bg-primary-50 dark:border-primary-600 dark:bg-primary-950'
          : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
      }`}
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
        <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        {title}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</span>
    </button>
  );
}

function ModeButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof PenLine; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
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

function TextArea({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows: number; placeholder: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );
}
