import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast-store';
import { rankingService } from '@/features/rankings/services/ranking.service';
import { getErrorMessage } from '@/utils/error-message';

import { documentService, type DocumentDTO, type DocumentKind, type ProcessResult } from '../services/document.service';

// Ações sobre os documentos da lista: apagar, trocar o tipo, sugerir ranking e processar. Erros viram toast.
export function useDocumentActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['documents'] });

  const [suggestedIds, setSuggestedIds] = useState<Set<string>>(new Set());
  const [processingId, setProcessingId] = useState<string | null>(null);
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
    mutationFn: (doc: DocumentDTO) => documentService.process(doc.id),
    onMutate: (doc) => {
      setProcessingId(doc.id);
      setProcessResult(null);
    },
    onSuccess: (result) => {
      setProcessResult(result);
      refresh();
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Não foi possível processar o documento. Verifique se ele tem texto suficiente e tente de novo.')),
    onSettled: () => setProcessingId(null),
  });

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
