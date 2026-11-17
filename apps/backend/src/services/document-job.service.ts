import type { Prisma, ProcessJob } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { logger } from '../utils/logger.js';
import type { ProcessResult } from './document-process.service.js';

const OBJETIVO_KINDS = ['EDITAL', 'EMENTA', 'CRONOGRAMA'];
const STALE_AFTER_MS = 20 * 60 * 1000;

export interface ProcessRunner {
  process(userId: string, documentId: string, focus?: string, options?: { firstPartOnly?: boolean }): Promise<ProcessResult>;
}

export interface ContinuationRunner {
  append(userId: string, contestId: string, documentId: string): Promise<number>;
}

export interface JobView {
  id: string;
  documentId: string;
  status: ProcessJob['status'];
  partsDone: number;
  totalParts: number;
  contestId: string | null;
  result: ProcessResult | null;
  message: string | null;
  errorCode: string | null;
}

const GENERIC_FAILURE = 'Não foi possível ler o documento agora. Tente novamente em instantes.';
const AI_FAILURE = 'A IA não respondeu agora. Tente novamente em instantes. Se continuar, avise o suporte.';

// Mensagens da nossa própria validação (arquivo curto demais etc.) aparecem; erros do fornecedor de IA nunca vão para a tela,
// porque podem trazer pedaços de chave e detalhes de conta. O texto original fica só no log do servidor.
export function userMessageFor(error: unknown): string {
  if (!(error instanceof AppError)) return GENERIC_FAILURE;
  if (error.code.startsWith('AI_')) return AI_FAILURE;
  return /sk-[A-Za-z0-9_*-]{6,}/.test(error.message) ? GENERIC_FAILURE : error.message;
}

const toView = (job: ProcessJob): JobView => ({
  id: job.id,
  documentId: job.documentId,
  status: job.status,
  partsDone: job.partsDone,
  totalParts: job.totalParts,
  contestId: job.contestId,
  result: (job.result as ProcessResult | null) ?? null,
  message: job.message,
  errorCode: job.errorCode,
});

// A leitura pela IA roda em segundo plano: o site só pergunta como está, então o tempo da IA não depende do tempo do navegador.
export class DocumentJobService {
  constructor(
    private readonly processor: ProcessRunner,
    private readonly continuation: ContinuationRunner,
  ) {}

  async start(userId: string, documentId: string, focus?: string): Promise<JobView> {
    const document = await prisma.document.findUnique({ where: { id: documentId }, select: { id: true, userId: true, kind: true, firstPartChars: true } });
    if (!document || document.userId !== userId) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');

    const running = await prisma.processJob.findFirst({ where: { userId, documentId, status: 'RUNNING' } });
    if (running) return toView(running);

    const totalParts = OBJETIVO_KINDS.includes(document.kind) && document.firstPartChars !== null ? 2 : 1;
    const job = await prisma.processJob.create({ data: { userId, documentId, totalParts } });
    void this.run(job.id, userId, documentId, focus, totalParts);
    return toView(job);
  }

  async get(userId: string, jobId: string): Promise<JobView> {
    const job = await this.findOwned(userId, jobId);
    if (job.status === 'RUNNING' && Date.now() - job.updatedAt.getTime() > STALE_AFTER_MS) {
      return toView(await this.finish(job.id, 'FAILED', { message: 'A leitura demorou demais e foi interrompida. Tente novamente.', errorCode: 'JOB_STALE' }));
    }
    return toView(job);
  }

  async cancel(userId: string, jobId: string): Promise<JobView> {
    await this.findOwned(userId, jobId);
    await prisma.processJob.updateMany({ where: { id: jobId, status: 'RUNNING' }, data: { status: 'CANCELED' } });
    return toView(await this.findOwned(userId, jobId));
  }

  // Leitura em andamento (ou a última) do edital: mostra o aviso "lendo o restante do PDF".
  async latestForContest(userId: string, contestId: string): Promise<JobView | null> {
    const job = await prisma.processJob.findFirst({ where: { userId, contestId }, orderBy: { createdAt: 'desc' } });
    return job ? toView(job) : null;
  }

  // Ao subir o servidor, o que estava rodando foi interrompido: marca como falha em vez de deixar girando para sempre.
  async failInterruptedJobs(): Promise<number> {
    const { count } = await prisma.processJob.updateMany({
      where: { status: 'RUNNING' },
      data: { status: 'FAILED', errorCode: 'JOB_INTERRUPTED', message: 'O servidor foi reiniciado durante a leitura. Envie o arquivo de novo.' },
    });
    return count;
  }

  private async run(jobId: string, userId: string, documentId: string, focus: string | undefined, totalParts: number): Promise<void> {
    try {
      const result = await this.processor.process(userId, documentId, focus, { firstPartOnly: totalParts > 1 });
      if (!(await this.isRunning(jobId))) return await this.discardIfCanceled(userId, result);

      const contestId = result.pipeline === 'objetivo' ? result.contestId : null;
      if (totalParts === 1 || contestId === null) {
        await this.finish(jobId, 'DONE', { partsDone: totalParts, contestId, result });
        return;
      }

      await prisma.processJob.update({ where: { id: jobId }, data: { partsDone: 1, contestId, result: result as unknown as Prisma.InputJsonValue } });
      await this.readRest(jobId, userId, contestId, documentId);
    } catch (error) {
      logger.error('Falha ao ler o documento em segundo plano', { jobId, error: error instanceof Error ? error.message : String(error) });
      if (await this.isRunning(jobId)) {
        await this.finish(jobId, 'FAILED', { message: userMessageFor(error), errorCode: error instanceof AppError ? error.code : 'PROCESS_FAILED' });
      }
    }
  }

  // A primeira parte já virou edital; se o restante falhar, o edital continua e o aluno é avisado.
  private async readRest(jobId: string, userId: string, contestId: string, documentId: string): Promise<void> {
    try {
      const added = await this.continuation.append(userId, contestId, documentId);
      if (!(await this.isRunning(jobId))) return;
      const message = added > 0 ? `Restante do documento incorporado: ${added} tópico(s) novo(s).` : 'O restante do documento não trouxe tópicos novos.';
      await this.finish(jobId, 'DONE', { partsDone: 2, message });
    } catch (error) {
      logger.error('Falha ao ler o restante do documento', { jobId, error: error instanceof Error ? error.message : String(error) });
      if (await this.isRunning(jobId)) {
        await this.finish(jobId, 'DONE', { message: 'Edital criado com as primeiras páginas. Não foi possível ler o restante agora.', errorCode: 'REST_FAILED' });
      }
    }
  }

  // Quem cancelou não quer o edital: se a IA terminou depois do cancelamento, apaga o que foi criado.
  private async discardIfCanceled(userId: string, result: ProcessResult): Promise<void> {
    if (result.pipeline === 'objetivo') await prisma.contest.deleteMany({ where: { id: result.contestId, userId } });
  }

  private async isRunning(jobId: string): Promise<boolean> {
    const job = await prisma.processJob.findUnique({ where: { id: jobId }, select: { status: true } });
    return job?.status === 'RUNNING';
  }

  private finish(jobId: string, status: ProcessJob['status'], data: { partsDone?: number; contestId?: string | null; result?: ProcessResult; message?: string; errorCode?: string }) {
    const { result, ...rest } = data;
    return prisma.processJob.update({
      where: { id: jobId },
      data: { status, ...rest, ...(result ? { result: result as unknown as Prisma.InputJsonValue } : {}) },
    });
  }

  private async findOwned(userId: string, jobId: string): Promise<ProcessJob> {
    const job = await prisma.processJob.findUnique({ where: { id: jobId } });
    if (!job || job.userId !== userId) throw new AppError(404, 'JOB_NOT_FOUND', 'Leitura não encontrada');
    return job;
  }
}
