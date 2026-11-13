import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../..');
const incidentsLogPath = path.resolve(rootDir, '.lgpd/incidents/log.md');
const draftsDir = path.resolve(rootDir, '.lgpd/incidents/drafts');

export interface IncidentPayload {
  title: string;
  severity: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  affectedSystems: string;
  affectedCategories: string;
  affectedUsersEstimate: string;
  notifiable: boolean;
  rootCause: string;
  containment: string;
  mitigation: string;
}

export class IncidentService {
  /**
   * Gera o próximo identificador sequencial anual de incidente (ex: INC-2026-001).
   */
  generateIncidentId(logContent: string): string {
    const year = new Date().getFullYear();
    const pattern = new RegExp(`INC-${year}-(\\d{3})`, 'g');
    const matches = [...logContent.matchAll(pattern)];
    let maxSeq = 0;
    for (const match of matches) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `INC-${year}-${nextSeq}`;
  }

  /**
   * Registra um incidente no log universal de guarda de 5 anos (.lgpd/incidents/log.md)
   * e, se for notificável (Art. 5º da Res. 15/2024), gera as minutas de comunicação pré-preenchidas.
   */
  registerIncident(payload: IncidentPayload): { incidentId: string; draftFiles: string[] } {
    if (!fs.existsSync(incidentsLogPath)) {
      throw new Error(`Arquivo de log de incidentes não encontrado em: ${incidentsLogPath}`);
    }

    const currentLog = fs.readFileSync(incidentsLogPath, 'utf8');
    const incidentId = this.generateIncidentId(currentLog);
    const now = new Date().toISOString();

    const entry = `
### ${incidentId} — ${payload.title}

- **Data e Hora da Detecção**: ${now}
- **Marco do Conhecimento**: ${now}
- **Severidade Classificada**: ${payload.severity}
- **Sistemas Afetados**: ${payload.affectedSystems}
- **Categorias de Dados Afetados**: ${payload.affectedCategories}
- **Quantidade de Titulares Estimada**: ${payload.affectedUsersEstimate}
- **Avaliação de Risco (Res. 15/2024 Art. 5º)**: Notificável: ${payload.notifiable ? 'SIM (Risco Relevante)' : 'NÃO (Risco Baixo/Controlado)'}
- **Comunicação à ANPD**: ${payload.notifiable ? `Pendente protocolo no prazo regulamentar de 3 dias úteis` : 'Não aplicável (critérios do Art. 5º não atendidos)'}
- **Comunicação aos Titulares**: ${payload.notifiable ? `Disparo aos titulares afetados em andamento` : 'Não aplicável'}
- **Causa Raiz Identificada**: ${payload.rootCause}
- **Medidas de Contenção Adotadas**: ${payload.containment}
- **Medidas de Mitigação e Prevenção Futura**: ${payload.mitigation}
- **Status do Incidente**: Em Investigação / Monitoramento
- **Responsável pelo Registro**: Encarregado pelo Tratamento de Dados (DPO)
`;

    const updatedLog = currentLog
      .replace('> *Nenhum incidente de segurança com afetação de dados pessoais registrado até a presente data.*\n\n---\n', '')
      .concat(`\n---\n${entry}`);

    fs.writeFileSync(incidentsLogPath, updatedLog, 'utf8');

    const draftFiles: string[] = [];

    if (payload.notifiable) {
      if (!fs.existsSync(draftsDir)) {
        fs.mkdirSync(draftsDir, { recursive: true });
      }

      const anpdDraftPath = path.join(draftsDir, `${incidentId}-comunicado-anpd.md`);
      const anpdDraft = `# RASCUNHO — COMUNICAÇÃO DE INCIDENTE À ANPD (${incidentId})
> [!IMPORTANT]
> **RASCUNHO — PENDENTE DE REVISÃO JURÍDICA E DO DPO**

- **Incidente ID**: ${incidentId}
- **Data do Conhecimento**: ${now}
- **Severidade**: ${payload.severity}
- **Sistemas**: ${payload.affectedSystems}
- **Categorias de Dados**: ${payload.affectedCategories}
- **Titulares Afetados**: ${payload.affectedUsersEstimate}
- **Causa Raiz**: ${payload.rootCause}
- **Medidas Adotadas**: ${payload.containment}
- **Canal de Contato do DPO**: dpo@engrama.com.br
`;
      fs.writeFileSync(anpdDraftPath, anpdDraft, 'utf8');
      draftFiles.push(anpdDraftPath);

      const titularesDraftPath = path.join(draftsDir, `${incidentId}-comunicado-titulares.md`);
      const titularesDraft = `# RASCUNHO — COMUNICADO AOS TITULARES DE DADOS (${incidentId})
> [!IMPORTANT]
> **RASCUNHO — PENDENTE DE REVISÃO JURÍDICA**

Olá, estudante do Engrama,

Identificamos em ${now.split('T')[0]} uma ocorrência técnica envolvendo ${payload.affectedSystems}.
Categorias potencialmente afetadas: ${payload.affectedCategories}.

Medidas imediatas que já adotamos para sua segurança:
1. ${payload.containment}
2. Senhas e sessões foram preventivamente invalidadas.
3. Seus dados financeiros não foram expostos (PCI-DSS Stripe).

Canal direto com o DPO: dpo@engrama.com.br
`;
      fs.writeFileSync(titularesDraftPath, titularesDraft, 'utf8');
      draftFiles.push(titularesDraftPath);
    }

    return { incidentId, draftFiles };
  }
}
