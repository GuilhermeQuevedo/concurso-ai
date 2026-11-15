import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { contentService, type SubjectDTO, type ExamBoardDTO } from '@/features/content/services/content.service';
import { documentService } from '@/features/documents/services/document.service';
import {
  questionSetService,
  type QuestionType,
  type Difficulty,
} from '../services/question-set.service';
import { GenerationProgressModal } from './GenerationProgressModal';
import { PdfDropzone } from '@/components/ui/PdfDropzone';

const MAX_CHARS = 100000;
const QUANTITIES = [5, 10, 15, 20, 30];

const POPULAR_BANCAS = [
  'CEBRASPE',
  'FGV',
  'FCC',
  'VUNESP',
  'CESGRANRIO',
  'QUADRIX',
  'IBFC',
  'AOCP',
] as const;

const BANCA_TIPS: Record<string, string> = {
  CEBRASPE: 'Padrão Certo/Errado automático, âncora anti-alucinação, pegadinhas de restrição e inversão conceitual.',
  CESPE: 'Padrão Certo/Errado automático, âncora anti-alucinação, pegadinhas de restrição e inversão conceitual.',
  QUADRIX: 'Padrão Certo/Errado automático, foco em legislação do órgão e informática avançada.',
  FGV: 'Casos concretos extensos, raciocínio aplicado, alternativas longas e foco nas exceções à regra.',
  FCC: 'Literalidade cirúrgica da lei, troca de prazos, conjunções ("e" por "ou") e termos processuais.',
  VUNESP: 'Rotinas administrativas do servidor, situações pragmáticas de repartição e aplicação direta de deveres.',
  CESGRANRIO: 'Forte contextualização de mercado de trabalho (bancária/engenharia), teoria e prática balanceadas.',
  IBFC: 'Questões secas, literais e diretas, com foco em memorização de listas e enumerações da lei.',
  AOCP: 'Cobrança objetiva e literal de conceitos da legislação e regimentos.',
};

const DIFFICULTIES: Array<{ value: Difficulty | ''; label: string }> = [
  { value: 'EASY', label: 'Fácil' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HARD', label: 'Difícil' },
  { value: '', label: 'Aleatório' },
];

const field = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none';
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

export function GenerateAIModal({ onClose, onCreated, initialSubjectId = '' }: { onClose: () => void; onCreated: () => void; initialSubjectId?: string }) {
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [examBoardId, setExamBoardId] = useState('');
  const [customBanca, setCustomBanca] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [cloneStyle, setCloneStyle] = useState(false);
  const [quantity, setQuantity] = useState(10);

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: contentService.getSubjects });
  const { data: boards = [] } = useQuery({ queryKey: ['exam-boards'], queryFn: contentService.getExamBoards });
  const flatSubjects = flatten(subjects);
  const subjectName = flatSubjects.find((s) => s.id === subjectId)?.name;

  const handleBancaSelect = (bancaName: string) => {
    setCustomBanca(bancaName);
    const matchedBoard = boards.find(
      (b: ExamBoardDTO) => b.name.toUpperCase().includes(bancaName) || bancaName.includes(b.name.toUpperCase())
    );
    if (matchedBoard) {
      setExamBoardId(matchedBoard.id);
    } else {
      setExamBoardId('');
    }
  };

  const handleCustomBancaInput = (value: string) => {
    setCustomBanca(value);
    const upper = value.trim().toUpperCase();
    const matchedBoard = boards.find(
      (b: ExamBoardDTO) => b.name.toUpperCase() === upper || b.slug.toUpperCase() === upper
    );
    if (matchedBoard) {
      setExamBoardId(matchedBoard.id);
    } else {
      setExamBoardId('');
    }
  };

  // Determina automaticamente o formato pelo perfil da banca (Zion engine)
  const computedQuestionType: QuestionType = useMemo(() => {
    const upper = customBanca.trim().toUpperCase();
    if (upper.includes('CESPE') || upper.includes('CEBRASPE') || upper.includes('QUADRIX')) {
      return 'TRUE_FALSE';
    }
    return 'MULTIPLE_5';
  }, [customBanca]);

  const activeBancaTip = useMemo(() => {
    const current = customBanca.trim().toUpperCase();
    for (const [key, tip] of Object.entries(BANCA_TIPS)) {
      if (current.includes(key)) return tip;
    }
    return null;
  }, [customBanca]);

  const mutation = useMutation({
    mutationFn: async () => {
      const documentId = file ? (await documentService.upload(file, { kind: 'MATERIAL', subjectId: subjectId || undefined })).id : undefined;
      return questionSetService.generate({
        subjectId: subjectId || undefined,
        examBoardId: examBoardId || undefined,
        examBoardName: customBanca.trim() || undefined,
        difficulty: difficulty || undefined,
        documentId,
        content: !file && content.trim() ? content.trim() : undefined,
        questionType: computedQuestionType,
        cloneStyle: cloneStyle && (!!file || content.trim().length > 0),
        quantity,
      });
    },
    onSuccess: () => onCreated(),
  });

  const canGenerate = !mutation.isPending && (!!subjectId || !!file || content.trim().length > 0 || customBanca.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={onClose}>
      <GenerationProgressModal open={mutation.isPending} quantity={quantity} subjectName={subjectName ?? (customBanca || 'Simulado')} />
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-2xl bg-white p-6 dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gerador de Simulados Especialistas</h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Engenharia de IA com perfil e malícia específicos por banca examinadora (Padrão Zion).
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Matéria */}
          <div>
            <label className={label}>Matéria ou Conteúdo</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={field}>
              <option value="">Geral / Conforme Material Base</option>
              {flatSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.prefix}{s.name}</option>
              ))}
            </select>
          </div>

          {/* Banca Examinadora com Pills do Zion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={label}>
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-primary-500" />
                  Banca Examinadora (Opcional)
                </span>
              </label>
              {customBanca && (
                <button
                  type="button"
                  onClick={() => { setCustomBanca(''); setExamBoardId(''); }}
                  className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Pills de Bancas Principais */}
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_BANCAS.map((banca) => {
                const isSelected = customBanca.toUpperCase() === banca;
                return (
                  <button
                    key={banca}
                    type="button"
                    onClick={() => handleBancaSelect(banca)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30'
                    }`}
                  >
                    {banca}
                  </button>
                );
              })}
            </div>

            {/* Input customizável de Banca */}
            <div className="relative">
              <input
                type="text"
                value={customBanca}
                onChange={(e) => handleCustomBancaInput(e.target.value)}
                placeholder="Ou digite o nome de outra banca (ex: SELECON, CONSULPLAN, FUNDATEC)..."
                className={`${field} pr-8`}
              />
              {computedQuestionType === 'TRUE_FALSE' && (
                <span className="absolute right-2.5 top-2.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400" title="Padrão Certo/Errado configurado automaticamente">
                  <CheckCircle2 className="h-4 w-4" /> C/E
                </span>
              )}
            </div>

            {/* Dica de Especialidade da Banca selecionada */}
            {activeBancaTip && (
              <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-2.5 text-xs text-primary-900 dark:border-primary-900/40 dark:bg-primary-950/30 dark:text-primary-200 flex items-start gap-2 animate-in fade-in">
                <Sparkles className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400 mt-0.5" />
                <div>
                  <span className="font-bold">Perfil Zion {customBanca.toUpperCase()}: </span>
                  {activeBancaTip}
                </div>
              </div>
            )}
          </div>

          {/* Material Base (PDF) */}
          <div>
            <label className={label}>Material Base (PDF de Apostila, Doutrina ou Lei)</label>
            <PdfDropzone
              file={file}
              onFileSelect={setFile}
              title="Material Base do Simulado"
              subtitle="PDF, até 50MB — apostilas, doutrina, resumos ou questões"
            />
          </div>

          {file && (
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
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
                placeholder="Cole aqui o trecho da lei, resumo ou notas que a IA vai usar para criar as questões..."
                className={`${field} resize-none`}
              />
              <p className="mt-1 text-xs text-gray-400">{content.length.toLocaleString('pt-BR')}/{MAX_CHARS.toLocaleString('pt-BR')} caracteres</p>
            </div>
          )}

          {/* Dificuldade */}
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

          {/* Quantidade (Zion: 5, 10, 15, 20, 30) */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade de Questões:</span>
            <div className="flex gap-1.5">
              {QUANTITIES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuantity(n)}
                  className={`h-8 w-11 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    quantity === n
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Botão de Geração */}
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canGenerate}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary-700 disabled:opacity-50 transition-all mt-4 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" /> Gerar Simulado Especialista
          </button>
        </div>
      </div>
    </div>
  );
}
