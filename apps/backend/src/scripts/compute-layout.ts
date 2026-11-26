import { prisma } from '../database/prisma.js';
import { layoutService } from '../services/layout.service.js';
import { MapService } from '../services/map.service.js';
import { RelationStatus } from '@prisma/client';

interface CliArgs {
  force: boolean;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let force = false;
  let dryRun = false;

  for (const arg of args) {
    if (arg === '--force') force = true;
    if (arg === '--dry-run') dryRun = true;
  }

  return { force, dryRun };
}

async function main() {
  const { force, dryRun } = parseArgs();

  console.log(`[ComputeLayout] Iniciando cálculo de layout headless...`);
  console.log(`[ComputeLayout] Modo: ${dryRun ? 'DRY-RUN (Simulação)' : 'PERSISTÊNCIA EM BANCO'}`);
  console.log(`[ComputeLayout] Recálculo Forçado: ${force}`);

  try {
    const [topics, approvedRelations] = await Promise.all([
      prisma.topic.findMany({
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        select: { id: true, parentId: true, level: true, subjectId: true, updatedAt: true },
      }),
      prisma.topicRelation.findMany({
        where: { status: RelationStatus.APPROVED },
        select: { id: true, sourceTopicId: true, targetTopicId: true, updatedAt: true },
      }),
    ]);

    console.log(`[ComputeLayout] Total de tópicos canônicos: ${topics.length}`);
    console.log(`[ComputeLayout] Total de arestas aprovadas: ${approvedRelations.length}`);

    if (topics.length === 0) {
      console.log(`[ComputeLayout] Nenhum tópico encontrado. Encerrando sem alterações.`);
      return;
    }

    const graphVersion = MapService.computeGraphVersion(topics, approvedRelations);
    console.log(`[ComputeLayout] Versão do Grafo (hash): ${graphVersion}`);

    if (!force) {
      const existingCount = await prisma.topicLayoutPosition.count({
        where: { graphVersion },
      });

      if (existingCount === topics.length) {
        console.log(
          `[ComputeLayout] Layout já calculado e congelado para a versão ${graphVersion} (${existingCount} nós posicionados).`,
        );
        console.log(`[ComputeLayout] Use a flag --force para forçar o recálculo global.`);
        return;
      }
    }

    if (dryRun) {
      console.log(`[ComputeLayout] Dry-run ativo. Simulação concluída sem gravação no banco.`);
      return;
    }

    const positions = await layoutService.getOrComputePositions(
      graphVersion,
      topics,
      approvedRelations.map((r) => ({ id: r.id, source: r.sourceTopicId, target: r.targetTopicId })),
    );

    console.log(`\n========================================`);
    console.log(`[ComputeLayout] Layout Concluído com Sucesso!`);
    console.log(`- Versão do grafo: ${graphVersion}`);
    console.log(`- Nós posicionados e congelados: ${positions.size}`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error(`[ComputeLayout] Falha ao calcular layout:`, err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
