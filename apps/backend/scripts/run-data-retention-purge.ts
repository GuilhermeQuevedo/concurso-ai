import { RetentionService } from '../src/services/retention.service.js';
import { prisma } from '../src/database/prisma.js';

async function main(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');
  const batchSizeArg = process.argv.find((arg) => arg.startsWith('--batch-size='));
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : 50;

  console.log('========================================================================');
  console.log(' ROTINA DE RETENÇÃO E EXPURGO AUTOMÁTICO LGPD (Art. 16 da Lei 13.709/18)');
  console.log('========================================================================');
  console.log(`Modo de Operação: ${isDryRun ? 'DRY-RUN (Simulação - sem exclusão física)' : 'EXECUTION (Exclusão e anonimização ativas)'}`);
  console.log(`Tamanho do Lote: ${batchSize} registros`);
  console.log('------------------------------------------------------------------------');

  const retentionService = new RetentionService();

  try {
    const report = await retentionService.runRetentionPurge({
      dryRun: isDryRun,
      batchSize,
    });

    console.log('------------------------------------------------------------------------');
    console.log('RELATÓRIO DE EXECUÇÃO:');
    console.table([
      { Categoria: 'Sessões Expiradas (>30 dias)', Quantidade: report.expiredSessionsPurged },
      { Categoria: 'Tokens de Senha Expirados (>30 dias)', Quantidade: report.expiredPasswordTokensPurged },
      { Categoria: 'Contas Inativas SEM Pagamento (>24 meses)', Quantidade: report.inactiveUsersNoPaymentPurged },
      { Categoria: 'Contas Inativas COM Pagamento (>5 anos)', Quantidade: report.inactiveUsersWithPaymentAnonymized },
      { Categoria: 'Contatos Descadastrados (>12 meses)', Quantidade: report.staleContactsPurged },
      { Categoria: 'Logs Administrativos Antigos (>5 anos)', Quantidade: report.oldAuditLogsPurged },
    ]);
    console.log(`Execução concluída em: ${report.executedAt}`);
    console.log('========================================================================');
  } catch (error) {
    console.error('[RetentionJob] Erro crítico na execução:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
