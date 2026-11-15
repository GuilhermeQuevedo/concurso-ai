import type { QueryClient } from '@tanstack/react-query';

// Cada ação invalida só o que ela realmente muda, em vez de recarregar o app inteiro.
function invalidate(queryClient: QueryClient, keys: string[]): Promise<void> {
  return Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] }))).then(() => undefined);
}

// Subir, apagar ou trocar o tipo de um documento: só a lista de documentos muda.
export const invalidateDocuments = (queryClient: QueryClient) => invalidate(queryClient, ['documents']);

// Processar um documento pode criar edital, disciplinas e questões a partir dele.
export const invalidateAfterDocumentProcessed = (queryClient: QueryClient) =>
  invalidate(queryClient, ['documents', 'contests', 'subjects', 'question-sets']);

// Criar um edital a partir de um documento.
export const invalidateAfterContestCreated = (queryClient: QueryClient) =>
  invalidate(queryClient, ['documents', 'contests', 'subjects']);

// Apagar um edital leva junto tarefas, revisões e (opcionalmente) documentos.
export const invalidateAfterContestDeleted = (queryClient: QueryClient) =>
  invalidate(queryClient, ['contests', 'contest', 'documents', 'study-tasks', 'study-schedules', 'due-reviews']);
