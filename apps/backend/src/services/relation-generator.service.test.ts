import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RelationStatus } from '@prisma/client';
import type { prisma } from '../database/prisma.js';
import {
  RelationGeneratorService,
  buildRelationExtractionPrompt,
  type SourceTopicInfo,
  type CandidateTopicInfo,
} from './relation-generator.service.js';
import { AppError } from '../middlewares/error-handler.js';

describe('RelationGeneratorService (Phase 7 — AI Relation Pipeline & Human Curation)', () => {
  const service = new RelationGeneratorService({} as unknown as typeof prisma);

  const mockSourceTopic: SourceTopicInfo = {
    id: 'top-1',
    name: 'Inviolabilidade de Domicílio',
    discipline: 'Direito Constitucional',
    description: 'Garantia fundamental do art. 5º, XI da CF/88.',
  };

  const mockCandidates: CandidateTopicInfo[] = [
    { id: 'top-2', name: 'Prisão em Flagrante Delito' },
    { id: 'top-3', name: 'Busca e Apreensão Domiciliar' },
  ];

  describe('buildRelationExtractionPrompt', () => {
    it('deve gerar o prompt com regras pedagógicas, fontes obrigatórias e sem PII', () => {
      const prompt = buildRelationExtractionPrompt(mockSourceTopic, mockCandidates);

      assert.ok(prompt.includes('Inviolabilidade de Domicílio'));
      assert.ok(prompt.includes('top-1'));
      assert.ok(prompt.includes('top-2'));
      assert.ok(prompt.includes('Prisão em Flagrante Delito'));
      assert.ok(prompt.includes('PREREQUISITE'));
      assert.ok(prompt.includes('CONFUSED_WITH'));
      assert.ok(prompt.includes('CO_OCCURRING'));
      assert.ok(prompt.includes('sourceRef'));
      assert.ok(prompt.includes('NUNCA aponte targetTopicId para o próprio ID'));
    });
  });

  describe('parseAndValidateAIOutput', () => {
    const validCandidateIds = new Set(['top-2', 'top-3']);

    it('deve validar e aceitar relações estruturadas com fundamentação jurídica', () => {
      const rawAiResponse = JSON.stringify({
        relations: [
          {
            targetTopicId: 'top-2',
            type: 'PREREQUISITE',
            confidence: 0.85,
            evidence: 'Para avaliar a licitude da entrada forçada em domicílio, é indispensável dominar as hipóteses de flagrante delito.',
            sourceRef: 'CF/88, art. 5º, XI; RE 603.616/RO (Tema 280 STF)',
          },
        ],
      });

      const parsed = service.parseAndValidateAIOutput(rawAiResponse, 'top-1', validCandidateIds);

      assert.equal(parsed.length, 1);
      assert.equal(parsed[0].targetTopicId, 'top-2');
      assert.equal(parsed[0].type, 'PREREQUISITE');
      assert.equal(parsed[0].confidence, 0.85);
      assert.ok(parsed[0].evidence.includes('entrada forçada'));
      assert.equal(parsed[0].sourceRef, 'CF/88, art. 5º, XI; RE 603.616/RO (Tema 280 STF)');
    });

    it('deve rejeitar e descartar auto-relações (targetTopicId === sourceTopicId)', () => {
      const rawAiResponse = JSON.stringify({
        relations: [
          {
            targetTopicId: 'top-1', // Auto-relação
            type: 'CONFUSED_WITH',
            confidence: 0.9,
            evidence: 'Tentativa indevida da LLM de correlacionar o tópico consigo mesmo.',
            sourceRef: 'CF/88, art. 5º',
          },
          {
            targetTopicId: 'top-3',
            type: 'CO_OCCURRING',
            confidence: 0.82,
            evidence: 'A inviolabilidade domiciliar condiciona as balizas para cumprimento de mandado de busca e apreensão.',
            sourceRef: 'CPP, art. 245; CF/88, art. 5º, XI',
          },
        ],
      });

      const parsed = service.parseAndValidateAIOutput(rawAiResponse, 'top-1', validCandidateIds);

      assert.equal(parsed.length, 1);
      assert.equal(parsed[0].targetTopicId, 'top-3');
    });

    it('deve descartar relações apontando para IDs fora da lista de candidatos permitidos', () => {
      const rawAiResponse = JSON.stringify({
        relations: [
          {
            targetTopicId: 'top-alucinada-999', // Não está em validCandidateIds
            type: 'PREREQUISITE',
            confidence: 0.95,
            evidence: 'Tópico alucinado pelo modelo que não consta na lista do edital.',
            sourceRef: 'Art. 1º do Código Penal',
          },
        ],
      });

      const parsed = service.parseAndValidateAIOutput(rawAiResponse, 'top-1', validCandidateIds);

      assert.equal(parsed.length, 0);
    });

    it('deve descartar relações com índice de confiança pedagógica inferior a 0.70', () => {
      const rawAiResponse = JSON.stringify({
        relations: [
          {
            targetTopicId: 'top-2',
            type: 'CO_OCCURRING',
            confidence: 0.55, // Inferior ao corte de 0.70
            evidence: 'Relação fraca ou incerta que não atinge o limiar pedagógico.',
            sourceRef: 'Doutrina Geral',
          },
        ],
      });

      const parsed = service.parseAndValidateAIOutput(rawAiResponse, 'top-1', validCandidateIds);

      assert.equal(parsed.length, 0);
    });

    it('deve lançar AppError quando a evidência for menor que 20 caracteres', () => {
      const rawAiResponse = JSON.stringify({
        relations: [
          {
            targetTopicId: 'top-2',
            type: 'PREREQUISITE',
            confidence: 0.8,
            evidence: 'Muito curto', // Menos de 20 chars
            sourceRef: 'CF/88',
          },
        ],
      });

      assert.throws(
        () => service.parseAndValidateAIOutput(rawAiResponse, 'top-1', validCandidateIds),
        (err: unknown) => err instanceof AppError && err.code === 'AI_SCHEMA_VALIDATION_FAILED',
      );
    });

    it('deve lançar AppError quando o formato de resposta não for JSON válido', () => {
      const rawMalformed = 'Isto é apenas um texto sem formato JSON';

      assert.throws(
        () => service.parseAndValidateAIOutput(rawMalformed, 'top-1', validCandidateIds),
        (err: unknown) => err instanceof AppError && err.code === 'INVALID_AI_JSON',
      );
    });
  });

  describe('Fluxo de Curadoria Humana', () => {
    it('approveRelation deve atualizar o status para APPROVED com revisor e timestamp', async () => {
      const mockUpdated = {
        id: 'rel-1',
        status: 'APPROVED',
        reviewedById: 'admin-123',
        reviewedAt: new Date(),
        rejectionReason: null,
      };

      const mockDb = {
        topicRelation: {
          findUnique: async () => ({ id: 'rel-1', status: 'DRAFT' }),
          update: async (args: { data: Record<string, unknown> }) => ({ ...mockUpdated, ...args.data }),
        },
      };

      const curationService = new RelationGeneratorService(mockDb as unknown as typeof prisma);
      const result = await curationService.approveRelation('rel-1', 'admin-123');

      assert.equal(result.status, 'APPROVED');
      assert.equal(result.reviewedById, 'admin-123');
      assert.ok(result.reviewedAt instanceof Date);
    });

    it('rejectRelation deve atualizar o status para REJECTED com motivo obrigatório', async () => {
      const mockDb = {
        topicRelation: {
          findUnique: async () => ({ id: 'rel-1', status: 'DRAFT' }),
          update: async (args: { data: { status: RelationStatus; reviewedById: string; rejectionReason: string } }) => ({
            id: 'rel-1',
            status: args.data.status,
            reviewedById: args.data.reviewedById,
            rejectionReason: args.data.rejectionReason,
          }),
        },
      };

      const curationService = new RelationGeneratorService(mockDb as unknown as typeof prisma);
      const result = await curationService.rejectRelation(
        'rel-1',
        'admin-123',
        'A fonte indicada está desatualizada conforme tese vinculante do STF.',
      );

      assert.equal(result.status, 'REJECTED');
      assert.equal(result.reviewedById, 'admin-123');
      assert.ok(result.rejectionReason && result.rejectionReason.includes('desatualizada'));
    });

    it('updateDraftRelation deve permitir corrigir evidência e fonte jurídica', async () => {
      const mockDb = {
        topicRelation: {
          findUnique: async () => ({ id: 'rel-1', status: 'DRAFT', evidence: 'Velha' }),
          update: async (args: { data: Record<string, unknown> }) => ({ id: 'rel-1', ...args.data }),
        },
      };

      const curationService = new RelationGeneratorService(mockDb as unknown as typeof prisma);
      const result = await curationService.updateDraftRelation('rel-1', {
        evidence: 'Nova justificativa pedagógica aprofundada com 20+ caracteres.',
        sourceRef: 'STF, Súmula Vinculante 11',
      });

      assert.ok(result.evidence.includes('Nova justificativa'));
      assert.equal(result.source, 'STF, Súmula Vinculante 11');
    });
  });
});
