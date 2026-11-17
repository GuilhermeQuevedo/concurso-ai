import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { prisma } from '../database/prisma.js';
import { DocumentJobService, userMessageFor, type ContinuationRunner, type ProcessRunner } from './document-job.service.js';
import { AppError } from '../middlewares/error-handler.js';
import type { ProcessResult } from './document-process.service.js';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function waitFor<T>(read: () => Promise<T>, done: (value: T) => boolean, timeoutMs = 4000): Promise<T> {
  const start = Date.now();
  for (;;) {
    const value = await read();
    if (done(value) || Date.now() - start > timeoutMs) return value;
    await sleep(25);
  }
}

describe('DocumentJobService', () => {
  const suffix = `${Date.now()}`;
  let userId = '';
  let otherUserId = '';
  const documentIds: string[] = [];

  async function createDocument(kind: 'EDITAL' | 'MATERIAL', firstPartChars: number | null): Promise<string> {
    const doc = await prisma.document.create({
      data: { userId, name: `doc-${suffix}`, type: 'PDF', kind, content: 'x'.repeat(5000), pageCount: firstPartChars ? 69 : 10, firstPartChars },
    });
    documentIds.push(doc.id);
    return doc.id;
  }

  const contestResult = (contestId: string): ProcessResult => ({ pipeline: 'objetivo', contestId, title: 'Edital' });

  before(async () => {
    const a = await prisma.user.create({ data: { email: `job-a-${suffix}@teste.local`, name: 'Job A' } });
    const b = await prisma.user.create({ data: { email: `job-b-${suffix}@teste.local`, name: 'Job B' } });
    userId = a.id;
    otherUserId = b.id;
  });

  after(async () => {
    await prisma.processJob.deleteMany({ where: { userId } });
    await prisma.contest.deleteMany({ where: { userId } });
    await prisma.document.deleteMany({ where: { id: { in: documentIds } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    await prisma.$disconnect();
  });

  it('responde na hora e termina em segundo plano, sem depender de quanto a IA demora', async () => {
    const processor: ProcessRunner = { process: async () => (await sleep(150), { pipeline: 'questoes', subjectId: 's', imported: 3 }) };
    const jobs = new DocumentJobService(processor, { append: async () => 0 });
    const documentId = await createDocument('MATERIAL', null);

    const started = Date.now();
    const job = await jobs.start(userId, documentId);
    assert.ok(Date.now() - started < 100, 'start deve responder antes da IA terminar');
    assert.equal(job.status, 'RUNNING');

    const finished = await waitFor(() => jobs.get(userId, job.id), (j) => j.status !== 'RUNNING');
    assert.equal(finished.status, 'DONE');
    assert.deepEqual(finished.result, { pipeline: 'questoes', subjectId: 's', imported: 3 });
  });

  it('não cria duas leituras ao mesmo tempo para o mesmo documento', async () => {
    const processor: ProcessRunner = { process: async () => (await sleep(150), { pipeline: 'questoes', subjectId: 's', imported: 1 }) };
    const jobs = new DocumentJobService(processor, { append: async () => 0 });
    const documentId = await createDocument('MATERIAL', null);
    const first = await jobs.start(userId, documentId);
    const second = await jobs.start(userId, documentId);
    assert.equal(second.id, first.id);
    await waitFor(() => jobs.get(userId, first.id), (j) => j.status !== 'RUNNING');
  });

  it('edital grande: cria o edital com as primeiras páginas e depois soma o restante', async () => {
    const contest = await prisma.contest.create({ data: { userId, name: `Edital ${suffix}` } });
    const calls: Array<{ firstPartOnly?: boolean }> = [];
    const processor: ProcessRunner = { process: async (_u, _d, _f, options) => (calls.push(options ?? {}), contestResult(contest.id)) };
    const continuation: ContinuationRunner = { append: async () => (await sleep(120), 7) };
    const jobs = new DocumentJobService(processor, continuation);
    const documentId = await createDocument('EDITAL', 2500);

    const job = await jobs.start(userId, documentId);
    assert.equal(job.totalParts, 2);

    const afterFirst = await waitFor(() => jobs.get(userId, job.id), (j) => j.partsDone >= 1);
    assert.equal(afterFirst.contestId, contest.id);
    assert.equal(afterFirst.status, 'RUNNING', 'a segunda parte ainda está sendo lida');

    const done = await waitFor(() => jobs.get(userId, job.id), (j) => j.status !== 'RUNNING');
    assert.equal(done.status, 'DONE');
    assert.equal(done.partsDone, 2);
    assert.match(done.message ?? '', /7 tópico/);
    assert.deepEqual(calls, [{ firstPartOnly: true }]);
  });

  it('se o restante falhar, o edital continua e o aluno é avisado', async () => {
    const contest = await prisma.contest.create({ data: { userId, name: `Edital B ${suffix}` } });
    const jobs = new DocumentJobService(
      { process: async () => contestResult(contest.id) },
      { append: async () => { throw new Error('IA fora do ar'); } },
    );
    const documentId = await createDocument('EDITAL', 2500);
    const job = await jobs.start(userId, documentId);
    const done = await waitFor(() => jobs.get(userId, job.id), (j) => j.status !== 'RUNNING');
    assert.equal(done.status, 'DONE');
    assert.equal(done.partsDone, 1);
    assert.equal(done.errorCode, 'REST_FAILED');
    assert.ok(await prisma.contest.findUnique({ where: { id: contest.id } }), 'o edital não pode sumir');
  });

  it('falha da IA vira mensagem clara, sem expor detalhes internos', async () => {
    const jobs = new DocumentJobService({ process: async () => { throw new Error('sk-proj-segredo 401 interno'); } }, { append: async () => 0 });
    const documentId = await createDocument('MATERIAL', null);
    const job = await jobs.start(userId, documentId);
    const done = await waitFor(() => jobs.get(userId, job.id), (j) => j.status !== 'RUNNING');
    assert.equal(done.status, 'FAILED');
    assert.ok(!(done.message ?? '').includes('sk-proj'));
    assert.match(done.message ?? '', /Não foi possível ler o documento/);
  });

  it('cancelar descarta o edital se a IA terminar depois', async () => {
    const contest = await prisma.contest.create({ data: { userId, name: `Edital C ${suffix}` } });
    const jobs = new DocumentJobService({ process: async () => (await sleep(150), contestResult(contest.id)) }, { append: async () => 0 });
    const documentId = await createDocument('EDITAL', null);
    const job = await jobs.start(userId, documentId);
    const canceled = await jobs.cancel(userId, job.id);
    assert.equal(canceled.status, 'CANCELED');
    await sleep(350);
    assert.equal(await prisma.contest.findUnique({ where: { id: contest.id } }), null);
    assert.equal((await jobs.get(userId, job.id)).status, 'CANCELED');
  });

  it('um usuário não enxerga nem cancela a leitura de outro', async () => {
    const jobs = new DocumentJobService({ process: async () => (await sleep(100), { pipeline: 'questoes', subjectId: 's', imported: 0 }) }, { append: async () => 0 });
    const documentId = await createDocument('MATERIAL', null);
    const job = await jobs.start(userId, documentId);
    await assert.rejects(() => jobs.get(otherUserId, job.id), /não encontrada/);
    await assert.rejects(() => jobs.cancel(otherUserId, job.id), /não encontrada/);
    await assert.rejects(() => jobs.start(otherUserId, documentId), /não encontrado/);
    await waitFor(() => jobs.get(userId, job.id), (j) => j.status !== 'RUNNING');
  });

  it('ao reiniciar o servidor, leituras penduradas viram falha', async () => {
    const jobs = new DocumentJobService({ process: async () => (await sleep(5000), { pipeline: 'questoes', subjectId: 's', imported: 0 }) }, { append: async () => 0 });
    const documentId = await createDocument('MATERIAL', null);
    const job = await jobs.start(userId, documentId);
    assert.ok((await jobs.failInterruptedJobs()) >= 1);
    const after = await jobs.get(userId, job.id);
    assert.equal(after.status, 'FAILED');
    assert.equal(after.errorCode, 'JOB_INTERRUPTED');
  });

  it('erro do fornecedor de IA nunca mostra chave nem detalhe de conta', () => {
    const vendor = new AppError(502, 'AI_API_ERROR', 'Falha na API da OpenAI: 401 Incorrect API key provided: sk-proj-****1PwA.');
    assert.ok(!userMessageFor(vendor).includes('sk-'));
    assert.match(userMessageFor(vendor), /A IA não respondeu/);
    assert.equal(userMessageFor(new AppError(400, 'EDITAL_TOO_SHORT', 'O documento não tem texto suficiente.')), 'O documento não tem texto suficiente.');
    assert.ok(!userMessageFor(new AppError(400, 'X', 'chave sk-proj-abc123def')).includes('sk-'));
  });
});
