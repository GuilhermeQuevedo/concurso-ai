import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Sparkles } from 'lucide-react';
import { contentService, type SubjectDTO, type ExamBoardDTO } from '@/features/content/services/content.service';
import { documentService } from '@/features/documents/services/document.service';
import {
  questionSetService,
  QUESTION_TYPE_LABELS,
  type QuestionType,
  type Difficulty,
} from '../services/question-set.service';
import { GenerationProgressModal } from './GenerationProgressModal';
import { PdfDropzone } from '@/components/ui/PdfDropzone';

const MAX_CHARS = 80000;
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
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [cloneStyle, setCloneStyle] = useState(false);
  const [questionType, setQuestionType] = useState<QuestionType>('MULTIPLE_5');
  const [quantity, setQuantity] = useState(10);

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

  const canGenerate = !mutation.isPending && (!!subjectId || !!file || content.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <GenerationProgressModal open={mutation.isPending} quantity={quantity} subjectName={subjectName ?? ''} />
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 dark:bg-gray-900 shadow-xl"
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
              <label className={label}>Banca Examinadora</label>
              <select value={examBoardId} onChange={(e) => setExamBoardId(e.target.value)} className={field}>
                <option value="">Qualquer (ou estilo padrão)</option>
                {boards.map((b: ExamBoardDTO) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Material Base (PDF)</label>
            <PdfDropzone
              file={file}
              onFileSelect={setFile}
              title="Enviar Apostila ou Questões"
              subtitle="PDF, até 50MB"
            />
          </div>

          {file && (
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={cloneStyle}
                onChange={(e) => setCloneStyle(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Mimetizar o estilo das questões deste material (Clonador de Prova)
            </label>
          )}

          {!file && (
            <div>
              <label className={label}>Ou cole o texto base</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
                rows={3}
                placeholder="Cole aqui o conteúdo que a IA vai usar para gerar questões..."
                className={`${field} resize-none`}
              />
              <p className="mt-1 text-xs text-gray-400">{content.length.toLocaleString('pt-BR')}/{MAX_CHARS.toLocaleString('pt-BR')} caracteres</p>
            </div>
          )}

          <div>
            <label className={label}>Dificuldade</label>
            <div className="grid grid-cols-4 gap-2">
              {DIFFICULTIES.map((d) => (
                <Segment key={d.value} active={difficulty === d.value} onClick={() => setDifficulty(d.value)}>
                  {d.label}
                </Segment>
              ))}
            </div>
          </div>

          <div>
            <label className={label}>Tipo de questão</label>
            <div className="flex flex-wrap gap-2">
              {TYPE_ORDER.map((t) => (
                <Segment key={t} active={questionType === t} onClick={() => setQuestionType(t)}>
                  {QUESTION_TYPE_LABELS[t]}
                </Segment>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade:</span>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuantity(n)}
                  className={`h-8 w-11 rounded-lg text-xs font-semibold ${
                    quantity === n
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canGenerate}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary-700 disabled:opacity-50 transition-all mt-4"
          >
            <Sparkles className="h-4 w-4" /> Gerar Questões com IA
          </button>
        </div>
      </div>
    </div>
  );
}
