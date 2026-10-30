import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Layers, Zap, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { PdfDropzone } from '@/components/ui/PdfDropzone';
import { documentService } from '@/features/documents/services/document.service';
import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';
import { SimuladoViewer, type SimuladoQuestionItem } from '@/features/study/components/SimuladoViewer';

interface SlicedBackendQuestion {
  id?: string;
  statement: string;
  alternatives: Array<{ letter: string; text: string }>;
  correctAnswer: string;
  explanation: string;
}

export function ExamSlicerPage() {
  const [examFile, setExamFile] = useState<File | null>(null);
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [quantity, setQuantity] = useState(10);
  const [subjectName, setSubjectName] = useState('Provas Anteriores');
  const [slicedQuestions, setSlicedQuestions] = useState<SimuladoQuestionItem[] | null>(null);

  const sliceMutation = useMutation({
    mutationFn: async () => {
      if (!examFile) throw new Error('Selecione o arquivo da prova em PDF.');

      // 1. Upload do arquivo da prova para extrair o texto
      const uploadedExam = await documentService.upload(examFile, { kind: 'LISTA_QUESTOES' });

      // 2. Upload do gabarito oficial (opcional)
      let answerKeyText: string | undefined;
      if (answerKeyFile) {
        const uploadedAnswerKey = await documentService.upload(answerKeyFile, { kind: 'OUTRO' });
        // Busca conteúdo do gabarito
        const docRes = await api.get<ApiResponse<{ content: string }>>(`/documents/${uploadedAnswerKey.id}`);
        answerKeyText = unwrapData(docRes).content;
      }

      // Busca conteúdo do documento da prova
      const examDocRes = await api.get<ApiResponse<{ content: string }>>(`/documents/${uploadedExam.id}`);
      const examContent = unwrapData(examDocRes).content;

      // 3. Dispara fatiador com IA
      const sliceRes = await api.post<ApiResponse<SlicedBackendQuestion[]>>('/questions/slice-exam', {
        examContent,
        answerKeyContent: answerKeyText,
        quantity,
        subjectName,
      });

      return unwrapData(sliceRes);
    },
    onSuccess: (data) => {
      setSlicedQuestions(
        data.map((q) => ({
          id: q.id,
          statement: q.statement,
          alternatives: q.alternatives,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      );
    },
  });

  if (slicedQuestions && slicedQuestions.length > 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Prova Fatiada: {examFile?.name ?? 'Simulado'}
            </h2>
            <p className="text-sm text-gray-500">
              {slicedQuestions.length} questões extraídas com gabarito e fundamentação.
            </p>
          </div>
          <button
            onClick={() => setSlicedQuestions(null)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 text-sm font-semibold"
          >
            Fatiar Outra Prova
          </button>
        </div>

        <SimuladoViewer
          questions={slicedQuestions}
          title={`Prova Fatiada - ${examFile?.name ?? ''}`}
          onFinish={() => setSlicedQuestions(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-primary-600" /> Provas Comentadas (Exam Slicer)
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Envie o PDF de uma prova de concurso real e o gabarito oficial. A inteligência artificial fatia os enunciados, extrai as alternativas e gera comentários completos para cada questão.
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
            onFileSelect={setExamFile}
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
            <Layers className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Configurações da Extração
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block">
                Nome da Disciplina / Origem
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Ex: TJ-SP Escrevente, Receita Federal..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block">
                Quantidade de Questões
              </label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value={5}>5 Questões</option>
                <option value={10}>10 Questões</option>
                <option value={15}>15 Questões</option>
                <option value={20}>20 Questões</option>
                <option value={30}>30 Questões</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => sliceMutation.mutate()}
            disabled={sliceMutation.isPending || !examFile}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {sliceMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Fatiando e Comentando Prova...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Extrair Prova Comentada
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
