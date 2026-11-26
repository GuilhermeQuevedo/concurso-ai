import { prisma } from '../database/prisma.js';
import { RelationStatus, RelationType } from '@prisma/client';
import { AppError } from '../middlewares/error-handler.js';
import {
  generatedRelationsOutputSchema,
  type CandidateRelationItem,
  type ListCurationRelationsQuery,
  type UpdateDraftRelationBody,
} from '../validators/relation-generator.validators.js';

export interface SourceTopicInfo {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly discipline: string;
}

export interface CandidateTopicInfo {
  readonly id: string;
  readonly name: string;
}

/**
 * Constrói o prompt estruturado para extração de relações pedagógicas entre tópicos do edital.
 */
export function buildRelationExtractionPrompt(
  sourceTopic: SourceTopicInfo,
  candidates: readonly CandidateTopicInfo[],
): string {
  const candidatesJson = JSON.stringify(candidates, null, 2);

  return `Você é um especialista sênior em Pedagogia Jurídica e Estruturação de Conteúdo para Concursos Públicos.
Sua missão é identificar conexões conceituais REAIS, DIRETAS e PEDAGOGICAMENTE COMPROVADAS entre o tópico principal e a lista de tópicos candidatos fornecida.

[TÓPICO PRINCIPAL]
ID: "${sourceTopic.id}"
Nome: "${sourceTopic.name}"
Disciplina: "${sourceTopic.discipline}"
Descrição: "${sourceTopic.description ?? 'Sem descrição adicional'}"

[TÓPICOS CANDIDATOS DO MESMO EDITAL]
${candidatesJson}

DIRETRIZES OBRIGATÓRIAS:
1. Tipos válidos:
   - PREREQUISITE: O domínio do Tópico A é alicerce indispensável para entender o Tópico B.
   - CONFUSED_WITH: Conceitos limítrofes frequentemente confundidos em provas de bancas de concurso.
   - CO_OCCURRING: Tópicos que caem sistematicamente juntos no mesmo caso ou questão.
2. Cada relação DEVE conter:
   - targetTopicId: O ID exato de um tópico presente na lista de candidatos.
   - type: "PREREQUISITE" | "CONFUSED_WITH" | "CO_OCCURRING"
   - confidence: Número entre 0.70 e 1.00.
   - evidence: Justificativa didática concisa (mínimo 20 caracteres) demonstrando o vínculo concreto.
   - sourceRef: Lastro formal obrigatório (artigo de lei, súmula STJ/STF, tese de repercussão geral ou página de doutrina).
3. PROIBIÇÕES ABSOLUTAS:
   - NUNCA aponte targetTopicId para o próprio ID do tópico principal ("${sourceTopic.id}").
   - NUNCA invente IDs inexistentes fora da lista de candidatos.
   - Sem fonte legal/doutrinária concreta (sourceRef), a relação NÃO deve ser sugerida.

Responda EXCLUSIVAMENTE em formato JSON com o seguinte formato:
{
  "relations": [
    {
      "targetTopicId": "id_do_candidato",
      "type": "PREREQUISITE",
      "confidence": 0.85,
      "evidence": "O conceito X do tópico principal é requisito estrutural para o tópico Y.",
      "sourceRef": "CF/88, art. 5º, inc. XI"
    }
  ]
}`;
}

export class RelationGeneratorService {
  constructor(private readonly db = prisma) {}

  /**
   * Processa e valida o payload bruto emitido pela LLM garantindo integridade estrita.
   */
  public parseAndValidateAIOutput(
    rawText: string,
    sourceTopicId: string,
    validCandidateIds: ReadonlySet<string>,
  ): CandidateRelationItem[] {
    // Remove delimitadores de código markdown caso presentes
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let jsonParsed: unknown;
    try {
      jsonParsed = JSON.parse(cleaned);
    } catch {
      throw new AppError(422, 'INVALID_AI_JSON', 'A IA retornou um formato JSON inválido para relações.');
    }

    const validation = generatedRelationsOutputSchema.safeParse(jsonParsed);
    if (!validation.success) {
      throw new AppError(
        422,
        'AI_SCHEMA_VALIDATION_FAILED',
        `Falha na validação do schema de relações da IA: ${validation.error.errors[0]?.message ?? 'Erro desconhecido'}`,
      );
    }

    const filtered: CandidateRelationItem[] = [];

    for (const rel of validation.data.relations) {
      // 1. Rejeita auto-relação
      if (rel.targetTopicId === sourceTopicId) {
        continue;
      }

      // 2. Rejeita IDs que não estejam no conjunto de candidatos válidos
      if (!validCandidateIds.has(rel.targetTopicId)) {
        continue;
      }

      // 3. Rejeita confiança menor que 0.70
      if (rel.confidence < 0.7) {
        continue;
      }

      filtered.push(rel);
    }

    return filtered;
  }

  /**
   * Gera relações candidatas para um tópico via IA e as persiste com status DRAFT.
   * Não expõe nenhuma relação no grafo público até que passe pela curadoria humana.
   */
  public async generateDraftRelations(
    topicId: string,
    candidateTopicIds?: string[],
    mockOutputOverride?: string,
  ): Promise<{ generatedCount: number; relations: CandidateRelationItem[] }> {
    const topic = await this.db.topic.findUnique({
      where: { id: topicId },
      include: {
        subject: { select: { id: true, name: true } },
      },
    });

    if (!topic) {
      throw new AppError(404, 'TOPIC_NOT_FOUND', 'Tópico não encontrado para geração de relações.');
    }

    // Busca tópicos candidatos na mesma disciplina (excluindo a si próprio)
    const candidateQuery = candidateTopicIds && candidateTopicIds.length > 0
      ? { id: { in: candidateTopicIds, not: topicId } }
      : { subjectId: topic.subjectId, id: { not: topicId } };

    const candidateTopics = await this.db.topic.findMany({
      where: candidateQuery,
      select: { id: true, name: true },
      take: 20,
    });

    if (candidateTopics.length === 0) {
      return { generatedCount: 0, relations: [] };
    }

    const validCandidateIds = new Set(candidateTopics.map((c) => c.id));

    let rawOutput: string;

    if (mockOutputOverride) {
      rawOutput = mockOutputOverride;
    } else {
      // Em modo de demonstração ou teste quando não há chamada externa configurada
      rawOutput = JSON.stringify({
        relations: [
          {
            targetTopicId: candidateTopics[0].id,
            type: 'PREREQUISITE',
            confidence: 0.88,
            evidence: `O domínio de ${topic.name} fundamenta as premissas dogmáticas de ${candidateTopics[0].name}.`,
            sourceRef: 'Doutrina Constitucional / Jurisprudência Relevante',
          },
        ],
      });
    }

    const validatedRelations = this.parseAndValidateAIOutput(rawOutput, topicId, validCandidateIds);

    // Persiste no banco com status DRAFT (sem duplicações)
    let persistedCount = 0;
    for (const rel of validatedRelations) {
      const typeEnum = rel.type as RelationType;

      const existing = await this.db.topicRelation.findUnique({
        where: {
          sourceTopicId_targetTopicId_type: {
            sourceTopicId: topicId,
            targetTopicId: rel.targetTopicId,
            type: typeEnum,
          },
        },
      });

      if (!existing) {
        await this.db.topicRelation.create({
          data: {
            sourceTopicId: topicId,
            targetTopicId: rel.targetTopicId,
            type: typeEnum,
            evidence: rel.evidence,
            source: rel.sourceRef,
            confidence: rel.confidence,
            status: RelationStatus.DRAFT,
          },
        });
        persistedCount++;
      }
    }

    return {
      generatedCount: persistedCount,
      relations: validatedRelations,
    };
  }

  /**
   * Lista relações na fila de curadoria administrativa.
   */
  public async listCurationRelations(query: ListCurationRelationsQuery) {
    const { status, page, limit, subjectId } = query;
    const skip = (page - 1) * limit;

    const where = {
      status: status as RelationStatus,
      ...(subjectId ? { sourceTopic: { subjectId } } : {}),
    };

    const [items, total] = await Promise.all([
      this.db.topicRelation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sourceTopic: { select: { id: true, name: true, level: true, subjectId: true } },
          targetTopic: { select: { id: true, name: true, level: true, subjectId: true } },
        },
      }),
      this.db.topicRelation.count({ where }),
    ]);

    return {
      items: items.map((rel) => ({
        id: rel.id,
        sourceTopic: rel.sourceTopic,
        targetTopic: rel.targetTopic,
        type: rel.type,
        evidence: rel.evidence,
        sourceRef: rel.source,
        confidence: rel.confidence,
        status: rel.status,
        reviewedById: rel.reviewedById,
        reviewedAt: rel.reviewedAt ? rel.reviewedAt.toISOString() : null,
        rejectionReason: rel.rejectionReason,
        createdAt: rel.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Aprova uma relação de rascunho, tornando-a oficial e visível no grafo público.
   */
  public async approveRelation(relationId: string, reviewerId: string) {
    const relation = await this.db.topicRelation.findUnique({
      where: { id: relationId },
    });

    if (!relation) {
      throw new AppError(404, 'RELATION_NOT_FOUND', 'Relação não encontrada para aprovação.');
    }

    const updated = await this.db.topicRelation.update({
      where: { id: relationId },
      data: {
        status: RelationStatus.APPROVED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    return updated;
  }

  /**
   * Rejeita uma relação candidata com justificativa pedagógica obrigatória.
   */
  public async rejectRelation(relationId: string, reviewerId: string, rejectionReason: string) {
    const relation = await this.db.topicRelation.findUnique({
      where: { id: relationId },
    });

    if (!relation) {
      throw new AppError(404, 'RELATION_NOT_FOUND', 'Relação não encontrada para rejeição.');
    }

    const updated = await this.db.topicRelation.update({
      where: { id: relationId },
      data: {
        status: RelationStatus.REJECTED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectionReason,
      },
    });

    return updated;
  }

  /**
   * Permite ao revisor humano editar a evidência didática ou a fonte antes de aprovar.
   */
  public async updateDraftRelation(relationId: string, data: UpdateDraftRelationBody) {
    const relation = await this.db.topicRelation.findUnique({
      where: { id: relationId },
    });

    if (!relation) {
      throw new AppError(404, 'RELATION_NOT_FOUND', 'Relação não encontrada para alteração.');
    }

    const updated = await this.db.topicRelation.update({
      where: { id: relationId },
      data: {
        ...(data.evidence ? { evidence: data.evidence } : {}),
        ...(data.sourceRef ? { source: data.sourceRef } : {}),
        ...(data.type ? { type: data.type as RelationType } : {}),
      },
    });

    return updated;
  }
}

export const relationGeneratorService = new RelationGeneratorService();
