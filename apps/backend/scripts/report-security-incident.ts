/**
 * Script Operacional para Registro e Condução de Incidentes de Segurança com Dados Pessoais (Gap G06).
 * Em conformidade com o Artigo 10 da Resolução CD/ANPD nº 15/2024 (guarda de 5 anos)
 * e Artigo 48 da Lei nº 13.709/2018 (LGPD).
 *
 * Uso:
 *   npx tsx scripts/report-security-incident.ts --title "Acesso anômalo a logs" --severity "MEDIA"
 */

import { IncidentService, type IncidentPayload } from '../src/services/incident.service.js';

function parseCliArgs(): IncidentPayload {
  const args = process.argv.slice(2);
  const getArg = (flag: string, fallback: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
  };

  const severityRaw = getArg('--severity', 'BAIXA').toUpperCase();
  const severity: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' =
    ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'].includes(severityRaw)
      ? (severityRaw as 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA')
      : 'BAIXA';

  return {
    title: getArg('--title', 'Incidente de Teste / Simulação Preventiva'),
    severity,
    affectedSystems: getArg('--systems', 'Banco de Dados MySQL / API'),
    affectedCategories: getArg('--categories', 'E-mails, nomes cadastrados'),
    affectedUsersEstimate: getArg('--affected-users', '0 (simulação)'),
    notifiable: getArg('--notifiable', 'false').toLowerCase() === 'true',
    rootCause: getArg('--root-cause', 'Investigação preliminar de vulnerabilidade ou teste de rotina.'),
    containment: getArg('--containment', 'Rotação de credenciais e isolamento de tráfego anômalo.'),
    mitigation: getArg('--mitigation', 'Reforço de testes automatizados e monitoramento de alertas.'),
  };
}

const incidentService = new IncidentService();

try {
  const payload = parseCliArgs();
  const result = incidentService.registerIncident(payload);
  console.log(`✅ Incidente registrado com sucesso no log de guarda de 5 anos:`);
  console.log(`   ID: ${result.incidentId}`);
  console.log(`   Severidade: ${payload.severity}`);
  console.log(`   Notificável ANPD: ${payload.notifiable ? 'SIM' : 'NÃO'}`);
  if (result.draftFiles.length > 0) {
    console.log(`📄 Minutas de comunicação geradas em:`);
    for (const f of result.draftFiles) {
      console.log(`   - ${f}`);
    }
  }
} catch (err) {
  console.error('❌ Erro ao registrar incidente:', err);
  process.exit(1);
}
