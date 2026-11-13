import { prisma } from '../src/database/prisma.js';
import { encryptData, isEncrypted } from '../src/utils/crypto.js';

interface BatchSummary {
  examined: number;
  encrypted: number;
  skipped: number;
}

const BATCH_SIZE = 100;

async function main(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(`[EncryptOAuth] Starting OAuth token encryption script`);
  console.log(`[EncryptOAuth] Mode: ${isDryRun ? 'DRY-RUN (Simulação - sem gravação)' : 'EXECUTION (Gravação ativa no banco)'}`);

  let cursorId: string | undefined = undefined;
  let totalExamined = 0;
  let totalEncrypted = 0;
  let totalSkipped = 0;

  try {
    while (true) {
      const integrations = await prisma.userCalendarIntegration.findMany({
        take: BATCH_SIZE,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          userId: true,
          googleAccessToken: true,
          googleRefreshToken: true,
        },
      });

      if (integrations.length === 0) {
        break;
      }

      cursorId = integrations[integrations.length - 1].id;
      const batchSummary: BatchSummary = { examined: 0, encrypted: 0, skipped: 0 };
      const updatesToApply: Array<{
        id: string;
        data: { googleAccessToken?: string; googleRefreshToken?: string };
      }> = [];

      for (const item of integrations) {
        batchSummary.examined++;
        totalExamined++;

        const needsAccessEncryption = item.googleAccessToken && !isEncrypted(item.googleAccessToken);
        const needsRefreshEncryption = item.googleRefreshToken && !isEncrypted(item.googleRefreshToken);

        if (!needsAccessEncryption && !needsRefreshEncryption) {
          batchSummary.skipped++;
          totalSkipped++;
          continue;
        }

        const updateData: { googleAccessToken?: string; googleRefreshToken?: string } = {};

        if (needsAccessEncryption && item.googleAccessToken) {
          updateData.googleAccessToken = encryptData(item.googleAccessToken, item.userId);
        }

        if (needsRefreshEncryption && item.googleRefreshToken) {
          updateData.googleRefreshToken = encryptData(item.googleRefreshToken, item.userId);
        }

        updatesToApply.push({ id: item.id, data: updateData });
        batchSummary.encrypted++;
        totalEncrypted++;
      }

      if (!isDryRun && updatesToApply.length > 0) {
        // Executa atualização em transação atômica por lote
        await prisma.$transaction(
          updatesToApply.map((op) =>
            prisma.userCalendarIntegration.update({
              where: { id: op.id },
              data: op.data,
            }),
          ),
        );
        const recordIds = updatesToApply.map((u) => u.id).join(', ');
        console.log(`[EncryptOAuth] Lote processado: ${updatesToApply.length} registro(s) cifrado(s) [IDs: ${recordIds}]`);
      } else if (isDryRun && updatesToApply.length > 0) {
        const recordIds = updatesToApply.map((u) => u.id).join(', ');
        console.log(`[EncryptOAuth][DRY-RUN] Lote avaliado: ${updatesToApply.length} registro(s) pendente(s) de cifra [IDs: ${recordIds}]`);
      }
    }

    console.log(`\n========================================`);
    console.log(`[EncryptOAuth] Relatório de Conclusão`);
    console.log(`Total de registros examinados: ${totalExamined}`);
    console.log(`Total já cifrados anteriormente (ignorados): ${totalSkipped}`);
    console.log(`Total cifrados (ou a cifrar no dry-run): ${totalEncrypted}`);
    console.log(`Status: SUCESSO`);
    console.log(`========================================\n`);
  } catch (error) {
    console.error(`[EncryptOAuth] Erro fatal durante a cifragem de lote:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
