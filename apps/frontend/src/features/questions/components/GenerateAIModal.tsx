import { useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Sparkles, Upload, FileText } from 'lucide-react';
import { contentService, type SubjectDTO, type ExamBoardDTO } from '@/features/content/services/content.service';
import { documentService } from '@/features/documents/services/document.service';
import {
  questionSetService,
  QUESTION_TYPE_LABELS,
  type QuestionType,
  type Difficulty,
} from '../services/question-set.service';
import { GenerationProgressModal } from './GenerationProgressModal';

const MAX_CHARS = 80000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const TYPE_ORDER: QuestionType[] = ['MULTIPLE_4', 'MULTIPLE_5', 'TRUE_FALSE', 'ESSAY', 'MIXED'];
const DIFFICULTIES: Array<{ value: Difficulty | ''; label: string }> = [
  { value: 'EASY', label: 'Fácil' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HARD', label: 'Difícil' },
  { value: '', label: 'Aleatório' },
];

const field = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white';
const label = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300';

function flatten(subjects: SubjectDTO[], prefix = ''): Array<SubjectDTO & { prefix: string }> {
  const out: Array<SubjectDTO & { prefix: string }> = [];
  for (const s of subjects) {
    out.push({ ...s, prefix });
    if (s.children?.length) out.push(...flatten(s.children, prefix + '— '));
  }
  return out;
}

function Segment({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
        active
          ? 'border-primary-500 bg-primary-600/10 font-medium text-primary-600 dark:text-primary-400'
          : 'border-gray-300 text-gray-700 hover:border-primary-300 dark:border-gray-700 dark:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export function GenerateAIModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [subjectId, setSubjectId] = useState('');
  const [examBoardId, setExamBoardId] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [cloneStyle, setCloneStyle] = useState(false);
  const [questionType, setQuestionType] = useState<QuestionType>('MULTIPLE_5');
  const [quantity, setQuantity] = useState(10);
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: contentService.getSubjects });
  const { data: boards = [] } = useQuery({ queryKey: ['exam-boards'], queryFn: contentService.getExamBoards });
  const flatSubjects = flatten(subjects);
  const subjectName = flatSubjects.find((s) => s.id === subjectId)?.name;

  const mutation = useMutation({
    mutationFn: async () => {
      const documentId = file ? (await documentService.upload(file, { kind: 'MATERIAL', subjectId: subjectId || undefined })).id : undefined;
      return questionSetService.generate({
        subjectId: subjectId || undefined,
        examBoardId: examBoardId || undefined,
        difficulty: difficulty || undefined,
        documentId,
        content: !file && content.trim() ? content.trim() : undefined,
        questionType,
        cloneStyle: cloneStyle && (!!file || content.trim().length > 0),
        quantity,
      });
    },
    onSuccess: () => onCreated(),
  });

  const pickFile = (f: File | undefined) => {
    setFileError('');
    if (!f) return;
    if (!/\.(pdf|txt|md|html?)$/i.test(f.name)) return setFileError('Envie um PDF, TXT, Markdown ou HTML.');
    if (f.size > MAX_FILE_BYTES) return setFileError('Arquivo muito grande (máx. 10MB).');
    setFile(f);
  };

  const canGenerate = !mutation.isPending && (!!subjectId || !!file || content.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <GenerationProgressModal open={mutation.isPending} quantity={quantity} subjectName={subjectName ?? ''} />
      <div
        className="max-h-[92vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-5 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gerar Questões com IA</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Matéria</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={field}>
                <option value="">Selecione (opcional)</option>
                {flatSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.prefix}{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Banca</label>
              <select value={examBoardId} onChange={(e) => setExamBoardId(e.target.value)} className={field}>
                <option value="">Qualquer (opcional)</option>
                {boards.map((b: ExamBoardDTO) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Cole o conteúdo base</label>
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
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="rounded p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <input ref={fileInput} type="file" accept=".pdf,.txt,.md,.html" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
            </div>
            {fileError && <p className="mb-1 text-xs text-red-500">{fileError}</p>}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
              disabled={!!file}
              rows={4}
              placeholder="Cole aqui o conteúdo que a IA vai usar para gerar questões..."
              className={`${field} resize-none disabled:opacity-50`}
            />
            <p className="mt-1 text-xs text-gray-400">{content.length.toLocaleString('pt-BR')}/{MAX_CHARS.toLocaleString('pt-BR')} caracteres</p>
          </div>

          <div>
            <label className={label}>Dificuldade</label>
            <div className="grid grid-cols-4 gap-2">
              {DIFFICULTIES.map((d) => (
                <Segment key={d.label} active={difficulty === d.value} onClick={() => setDifficulty(d.value)}>
                  {d.label}
                </Segment>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Clonador de Prova</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Clone o estilo da sua banca (use com um conteúdo base)</p>
            </div>
            <button
              role="switch"
              aria-checked={cloneStyle}
              onClick={() => setCloneStyle((v) => !v)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${cloneStyle ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${cloneStyle ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          <div>
            <label className={label}>Tipo de questão</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_ORDER.map((t) => (
                <Segment key={t} active={questionType === t} onClick={() => setQuestionType(t)}>
                  {QUESTION_TYPE_LABELS[t]}
                </Segment>
              ))}
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 dark:border-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300">Qtd.</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-full bg-transparent text-sm text-gray-900 outline-none dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {mutation.isError && <p className="mt-3 text-sm text-red-500">Erro ao gerar. Tente novamente.</p>}

        <button
          onClick={() => mutation.mutate()}
          disabled={!canGenerate}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" /> Gerar Questões
        </button>
      </div>
    </div>
  );
}
