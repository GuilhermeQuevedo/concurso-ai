import { useMutation, useQueryClient } from '@tanstack/react-query';

import { documentService } from '../services/document.service';

export function useRenameDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => documentService.rename(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}
