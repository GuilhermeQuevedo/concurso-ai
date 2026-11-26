import { prisma } from '../database/prisma.js';
import { masteryService } from '../services/mastery.service.js';

interface CliArgs {
  userId?: string;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let userId: string | undefined;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--userId' && args[i + 1]) {
      userId = args[i + 1];
      i++;
    }
  }

  return { userId, dryRun };
}

async function main() {
  const { userId, dryRun } = parseArgs();

  console.log(`[RebuildMastery] Iniciando reconstrução de domínio...`);
  console.log(`[RebuildMastery] Modo: ${dryRun ? 'DRY-RUN (Sem alterações no banco)' : 'EXECUÇÃO REAL'}`);

  try {
    let targetUsers: { id: string; email: string }[];

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });
      if (!user) {
        console.error(`[RebuildMastery] Erro: Usuário ${userId} não encontrado.`);
        process.exit(1);
      }
      targetUsers = [user];
    } else {
      targetUsers = await prisma.user.findMany({
        select: { id: true, email: true },
      });
    }

    console.log(`[RebuildMastery] Total de usuários a processar: ${targetUsers.length}`);

    let totalProcessed = 0;
    let totalUpdated = 0;

    for (const user of targetUsers) {
      console.log(`[RebuildMastery] Processando usuário: ${user.email} (${user.id})...`);
      const result = await masteryService.rebuildAllUserMastery(user.id, { dryRun });
      totalProcessed += result.processedTopics;
      totalUpdated += result.updatedRecords;
      console.log(
        `[RebuildMastery] Usuário ${user.email}: ${result.processedTopics} tópicos avaliados, ${result.updatedRecords} registros calculados.`,
      );
    }

    console.log(`\n========================================`);
    console.log(`[RebuildMastery] Conclusão com Sucesso!`);
    console.log(`- Usuários processados: ${targetUsers.length}`);
    console.log(`- Tópicos processados: ${totalProcessed}`);
    console.log(`- Registros atualizados: ${totalUpdated}`);
    console.log(`- Dry-Run: ${dryRun}`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error(`[RebuildMastery] Falha na reconstrução:`, err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
