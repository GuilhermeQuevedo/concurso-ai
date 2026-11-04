import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Layers,
  Zap,
  Loader2,
  FileText,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  BookOpen,
  Filter,
  Type,
} from 'lucide-react';
import { PdfDropzone } from '@/components/ui/PdfDropzone';
import { documentService } from '@/features/documents/services/document.service';
import { contentService, type SubjectDTO } from '@/features/content/services/content.service';
import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';
import { SimuladoViewer, type SimuladoQuestionItem } from '@/features/study/components/SimuladoViewer';

interface SlicedBackendQuestion {
  id?: string;
  statement: string;
  referenceText?: string | null;
  alternatives: Array<{ letter: string; text: string }>;
  correctAnswer: string;
  explanation: string;
}

const COMMON_SUBJECTS = [
  'Todas as Matérias (Geral da Prova)',
  'Língua Portuguesa',
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Penal',
  'Direito Processual Penal',
  'Legislação Extravagante / Especial',
  'Noções de Informática',
  'Raciocínio Lógico e Matemático',
  'Conhecimentos Específicos',
] as const;

const QUANTITIES = [5, 10, 15, 20, 30];

function formatFriendlyTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const clean = withoutExt.replace(/[_-]+/g, ' ').trim();
  if (!clean) return 'Simulado de Prova Comentada';

  // Capitaliza as palavras principais
  return clean
    .split(' ')
    .filter(Boolean)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (['de', 'da', 'do', 'das', 'dos', 'em', 'e', 'para', 'com'].includes(lower) && i > 0) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function ExamSlicerPage() {
  const [examFile, setExamFile] = useState<File | null>(null);
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('Todas as Matérias (Geral da Prova)');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [slicedQuestions, setSlicedQuestions] = useState<SimuladoQuestionItem[] | null>(null);

  const { data: dbSubjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: contentService.getSubjects,
  });

  const handleExamFileSelect = (file: File | null) => {
    setExamFile(file);
    if (file && !examTitle.trim()) {
      setExamTitle(formatFriendlyTitle(file.name));
    }
  };

  const handleSubjectSelect = (sub: string) => {
    if (sub === '__custom__') {
      setIsCustomSubject(true);
      setSelectedSubject('Outra');
    } else {
      setIsCustomSubject(false);
      setSelectedSubject(sub);
      setCustomSubject('');
    }
  };

  const effectiveSubjectName = isCustomSubject && customSubject.trim()
    ? customSubject.trim()
    : selectedSubject;

  const sliceMutation = useMutation({
    mutationFn: async () => {
      if (!examFile) throw new Error('Selecione o arquivo da prova em PDF.');
      if (!examTitle.trim()) throw new Error('Por favor, informe o título da prova.');

      // 1. Upload do arquivo da prova para extrair o texto
      const uploadedExam = await documentService.upload(examFile, { kind: 'LISTA_QUESTOES' });

      // 2. Upload do gabarito oficial (opcional)
      let answerKeyText: string | undefined;
      if (answerKeyFile) {
        const uploadedAnswerKey = await documentService.upload(answerKeyFile, { kind: 'OUTRO' });
        const docRes = await api.get<ApiResponse<{ content: string }>>(`/documents/${uploadedAnswerKey.id}`);
        answerKeyText = unwrapData(docRes).content;
      }

      // Busca conteúdo integral do documento da prova
      const examDocRes = await api.get<ApiResponse<{ content: string }>>(`/documents/${uploadedExam.id}`);
      const examContent = unwrapData(examDocRes).content;

      // 3. Dispara fatiador com IA com filtragem da matéria e leitura completa
      const sliceRes = await api.post<ApiResponse<SlicedBackendQuestion[]>>('/questions/slice-exam', {
        examContent,
        answerKeyContent: answerKeyText,
        quantity,
        subjectName: effectiveSubjectName,
      });

      return unwrapData(sliceRes);
    },
    onSuccess: (data) => {
      setSlicedQuestions(
        data.map((q) => ({
          id: q.id,
          statement: q.statement,
          referenceText: q.referenceText,
          alternatives: q.alternatives,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      );
    },
  });

  if (slicedQuestions && slicedQuestions.length > 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header Superior Repaginado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="rounded-md bg-primary-600/10 px-2.5 py-0.5 text-xs font-bold text-primary-600 dark:text-primary-400">
                Prova Comentada
              </span>
              {effectiveSubjectName && !effectiveSubjectName.includes('Todas as Matérias') && (
                <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {effectiveSubjectName}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate" title={examTitle}>
              {examTitle}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {slicedQuestions.length} questões extraídas com fundamentação jurídica e doutrinária detalhada.
            </p>
          </div>

          {/* Botão Fatiar Outra Prova estilizado e sem quebra feia */}
          <button
            type="button"
            onClick={() => setSlicedQuestions(null)}
            className="shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-sm font-bold text-gray-700 dark:text-gray-200 shadow-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4 text-primary-500" />
            <span>Fatiar Outra Prova</span>
          </button>
        </div>

        {/* Visualizador de Simulado Especialista */}
        <SimuladoViewer
          questions={slicedQuestions}
          title={examTitle}
          onFinish={() => setSlicedQuestions(null)}
          onRestart={() => {}}
        />
      </div>
    );
  }

  const isFormValid = Boolean(examFile && examTitle.trim() && !sliceMutation.isPending);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-primary-600" /> Provas Comentadas (Exam Slicer)
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Envie o PDF de uma prova de concurso real e o gabarito oficial. A inteligência artificial lê todo o documento, fatia as questões por matéria e gera fundamentação aprofundada com artigos de lei, doutrina e análise de distratores.
        </p>
      </div>

      {/* Dual Dropzones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary-500" /> Arquivo da Prova (PDF) *
          </label>
          <PdfDropzone
            file={examFile}
            onFileSelect={handleExamFileSelect}
            title="Enviar Arquivo da Prova"
            subtitle="PDF com as questões da prova anterior"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Gabarito Oficial (Opcional)
          </label>
          <PdfDropzone
            file={answerKeyFile}
            onFileSelect={setAnswerKeyFile}
            title="Enviar Gabarito Oficial"
            subtitle="PDF com a folha de respostas oficiais"
          />
        </div>
      </div>

      {/* Extraction Options */}
      {examFile && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 md:p-8 space-y-6 shadow-sm animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Configurações da Extração e Fatiamento
            </h3>
          </div>

          <div className="space-y-6">
            {/* Campo Obrigatório: Título da Prova */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-primary-500" /> Título da Prova / Simulado *
                </span>
                <span className="text-[11px] font-semibold text-amber-500 lowercase">(obrigatório)</span>
              </label>
              <input
                type="text"
                required
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="Ex: PCDF 2021 - Escrivão de Polícia Civil"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder:text-gray-400"
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Este nome será exibido com destaque no topo do simulado e nos relatórios de desempenho.
              </p>
            </div>

            {/* Seleção de Matéria Desejada */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-primary-500" /> Matéria Desejada para Extração
                </label>
                <span className="text-[11px] text-gray-400">A IA filtrará o PDF pela disciplina</span>
              </div>

              {/* Pills com Matérias Principais */}
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SUBJECTS.map((sub) => {
                  const isSelected = !isCustomSubject && selectedSubject === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => handleSubjectSelect(sub)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary-600 text-white shadow-xs'
                          : 'border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handleSubjectSelect('__custom__')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    isCustomSubject
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:border-primary-400'
                  }`}
                >
                  Outra Matéria...
                </button>
              </div>

              {/* Campo para Matéria Customizada */}
              {isCustomSubject && (
                <div className="pt-1 animate-in fade-in duration-200">
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Digite o nome exato da disciplina (ex: Direito Previdenciário, Contabilidade Geral, etc.)..."
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              )}

              {/* Se houver matérias cadastradas no banco */}
              {dbSubjects.length > 0 && !isCustomSubject && (
                <div className="pt-1">
                  <select
                    value={selectedSubject}
                    onChange={(e) => handleSubjectSelect(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="Todas as Matérias (Geral da Prova)">Ou selecione das disciplinas da sua conta...</option>
                    {dbSubjects.map((s: SubjectDTO) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                <span>
                  A IA lerá o PDF por completo e isolará apenas as questões de <strong>{effectiveSubjectName}</strong>.
                </span>
              </p>
            </div>

            {/* Quantidade de Questões */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                Quantidade de Questões a Extrair
              </label>
              <div className="flex gap-2">
                {QUANTITIES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuantity(n)}
                    className={`h-9 flex-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      quantity === n
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {n} Questões
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botão de Disparo */}
          <button
            type="button"
            onClick={() => sliceMutation.mutate()}
            disabled={!isFormValid}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer mt-4"
          >
            {sliceMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Lendo todo o PDF e Extraindo Questões Comentadas...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Extrair Prova Comentada com IA</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
