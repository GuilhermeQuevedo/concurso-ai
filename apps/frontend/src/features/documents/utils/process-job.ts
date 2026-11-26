import { documentService, type ProcessJobDTO } from '../services/document.service';

const POLL_MS = 1500;
const MAX_WAIT_MS = 15 * 60 * 1000;
const MAX_POLL_FAILURES = 6;

export class JobStoppedError extends Error {}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
  });

// Pronto para o aluno seguir: terminou, ou o edital já foi criado com a primeira parte (o restante continua sozinho).
export function isUsable(job: ProcessJobDTO): boolean {
  return job.status === 'DONE' || (job.status === 'RUNNING' && job.partsDone >= 1 && job.result !== null);
}

interface RunOptions {
  signal?: AbortSignal;
  onJob?: (job: ProcessJobDTO) => void;
}

// Inicia a leitura e acompanha pelo servidor. Como só consulta o andamento, nenhum tempo limite derruba o envio.
export async function runProcessJob(documentId: string, focus: string | undefined, options: RunOptions = {}): Promise<ProcessJobDTO> {
  const { signal, onJob } = options;
  let job = await documentService.startProcess(documentId, focus);
  onJob?.(job);
  const startedAt = Date.now();
  let failures = 0;

  while (!isUsable(job)) {
    if (job.status === 'FAILED' || job.status === 'CANCELED') throw new JobStoppedError(job.message ?? 'A leitura foi interrompida.');
    if (signal?.aborted) throw new JobStoppedError('Leitura cancelada.');
    if (Date.now() - startedAt > MAX_WAIT_MS) throw new JobStoppedError('A leitura está demorando mais que o normal. Veja em Meus Editais em alguns minutos.');

    await sleep(POLL_MS, signal);
    if (signal?.aborted) throw new JobStoppedError('Leitura cancelada.');
    try {
      job = await documentService.getJob(job.id);
      failures = 0;
      onJob?.(job);
    } catch (error) {
      failures += 1;
      if (failures >= MAX_POLL_FAILURES) throw error;
    }
  }
  return job;
}
