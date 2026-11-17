import { useRef, useState } from 'react';

import { documentService, type ProcessJobDTO } from '../services/document.service';
import { JobStoppedError, runProcessJob } from '../utils/process-job';

// Estado da leitura pela IA: rodando, erro e cancelar. O trabalho em si roda no servidor.
export function useProcessDocument() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const jobId = useRef<string | null>(null);

  const run = async (documentId: string, focus?: string): Promise<ProcessJobDTO | null> => {
    setError(null);
    setRunning(true);
    controller.current = new AbortController();
    jobId.current = null;
    try {
      return await runProcessJob(documentId, focus, {
        signal: controller.current.signal,
        onJob: (job) => { jobId.current = job.id; },
      });
    } catch (caught: unknown) {
      if (controller.current?.signal.aborted) return null;
      setError(caught instanceof JobStoppedError || caught instanceof Error ? caught.message : 'Não foi possível ler o documento agora.');
      return null;
    } finally {
      setRunning(false);
    }
  };

  const cancel = () => {
    controller.current?.abort();
    if (jobId.current) void documentService.cancelJob(jobId.current).catch(() => undefined);
  };

  return { run, running, error, cancel, clearError: () => setError(null) };
}
