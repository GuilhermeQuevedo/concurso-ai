import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Sparkles } from 'lucide-react';
import { contentService, type SubjectDTO, type ExamBoardDTO } from '@/features/content/services/content.service';
import { documentService } from '@/features/documents/services/document.service';
import { questionSetService, type SetMode, type Difficulty } from '../services/question-set.service';
import { GenerationProgressModal } from './GenerationProgressModal';

function flatten(subjects: SubjectDTO[], prefix = ''): Array<SubjectDTO & { prefix: string }> {
  const out: Array<SubjectDTO & { prefix: string }> = [];
  for (const s of subjects) {
    out.push({ ...s, prefix });
    if (s.children?.length) out.push(...flatten(s.children, prefix + '— '));
  }
  return out;
}

const field = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white';
const label = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300';

export function GenerateAIModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examBoardId, setExamBoardId] = useState('');
  const [topic, setTopic] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [mode, setMode] = useState<SetMode>('STUDY');

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: contentService.getSubjects });
  const { data: boards = [] } = useQuery({ queryKey: ['exam-boards'], queryFn: contentService.getExamBoards });
  const { data: documents = [] } = useQuery({ queryKey: ['documents'], queryFn: () => documentService.list() });

  const flatSubjects = flatten(subjects);
  const subjectName = flatSubjects.find((s) => s.id === subjectId)?.name;

  const mutation = useMutation({
    mutationFn: () =>
      questionSetService.generate({
        name: name.trim() || undefined,
        subjectId,
        quantity,
        examBoardId: examBoardId || undefined,
        difficulty: (difficulty as Difficulty) || undefined,
        topic: topic.trim() || undefined,
        documentId: documentId || undefined,
        mode,
      }),
    onSuccess: () => onCreated(),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <GenerationProgressModal open={mutation.isPending} quantity={quantity} subjectName={subjectName ?? ''} />
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <Sparkles className="h-5 w-5 text-primary-600" /> Gerar com IA
          </h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={label}>Nome do simulado <span className="font-normal text-gray-400">(opcional)</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Direito Constitucional — revisão" className={field} />
          </div>
          <div>
            <label className={label}>Disciplina *</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={field}>
              <option value="">Selecione...</option>
              {flatSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.prefix}{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Banca</label>
              <select value={examBoardId} onChange={(e) => setExamBoardId(e.target.value)} className={field}>
                <option value="">Qualquer</option>
                {boards.map((b: ExamBoardDTO) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Dificuldade</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={field}>
                <option value="">Qualquer</option>
                <option value="EASY">Fácil</option>
                <option value="MEDIUM">Média</option>
                <option value="HARD">Difícil</option>
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Tópico <span className="font-normal text-gray-400">(opcional)</span></label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Princípios fundamentais" className={field} />
          </div>
          <div>
            <label className={label}>Fonte das questões</label>
            <select value={documentId} onChange={(e) => setDocumentId(e.target.value)} className={field}>
              <option value="">Banco oficial de questões</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>Minhas anotações: {d.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Quantidade</label>
              <input type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={field} />
            </div>
            <div>
              <label className={label}>Modo</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as SetMode)} className={field}>
                <option value="STUDY">Estudo (feedback na hora)</option>
                <option value="EXAM">Simulado (gabarito no fim)</option>
              </select>
            </div>
          </div>
        </div>

        {mutation.isError && <p className="mt-3 text-sm text-red-500">Erro ao gerar. Tente novamente.</p>}

        <button
          onClick={() => mutation.mutate()}
          disabled={!subjectId || mutation.isPending}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" /> Gerar simulado
        </button>
      </div>
    </div>
  );
}
