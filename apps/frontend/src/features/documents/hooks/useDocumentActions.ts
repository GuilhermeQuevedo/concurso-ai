import { useState } from 'react';
import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast-store';
import { rankingService } from '@/features/rankings/services/ranking.service';
import { getErrorMessage } from '@/utils/error-message';

import { documentService, type DocumentDTO, type DocumentKind, type ProcessResult } from '../services/document.service';

const PROCESS_KEY = ['documents', 'process'];

function describeResult(result: ProcessResult): string {
  if (result.pipeline === 'objetivo') return `Edital "${result.title}" criado com o conteúdo programático.`;
  if (result.pipeline === 'questoes') return `${result.imported} questões importadas da lista.`;
  return 'Documento processado.';
}

// Ações sobre os documentos da lista: apagar, trocar o tipo, sugerir ranking e processar. Erros viram toast.
export function useDocumentActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['documents'] });

  const [suggestedIds, setSuggestedIds] = useState<Set<string>>(new Set());
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => documentService.delete(id),
    onSuccess: () => {
      refresh();
      toast.success('Documento apagado.');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível apagar o documento.')),
  });

  const changeKind = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: DocumentKind }) => documentService.updateKind(id, kind),
    onSuccess: refresh,
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível mudar o tipo do documento.')),
  });

  const suggest = useMutation({
    mutationFn: (doc: DocumentDTO) => rankingService.suggest({ documentId: doc.id, title: doc.name }),
    onSuccess: (_data, doc) => {
      setSuggestedIds((prev) => new Set(prev).add(doc.id));
      toast.success('Sugestão enviada ao administrador.');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível sugerir o ranking.')),
  });

  const process = useMutation({
    mutationKey: PROCESS_KEY,
    mutationFn: (doc: DocumentDTO) => documentService.process(doc.id),
    onMutate: () => setProcessResult(null),
    // O toast aparece mesmo se a pessoa já saiu da tela: a IA pode demorar e a navegação não fica presa.
    onSuccess: (result) => {
      setProcessResult(result);
      refresh();
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      toast.success(describeResult(result));
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Não foi possível processar o documento. Verifique se ele tem texto suficiente e tente de novo.')),
  });

  const processing = useMutationState({
    filters: { mutationKey: PROCESS_KEY, status: 'pending' },
    select: (mutation) => (mutation.state.variables as DocumentDTO).id,
  });
  const processingId = processing[0] ?? null;

  return {
    remove,
    changeKind,
    suggest,
    process,
    suggestedIds,
    processingId,
    processResult,
    dismissResult: () => setProcessResult(null),
  };
}
