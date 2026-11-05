import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { documentService } from '../services/document.service';

export function useRenameDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => documentService.rename(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível renomear o documento. Tente novamente.')),
  });
}
