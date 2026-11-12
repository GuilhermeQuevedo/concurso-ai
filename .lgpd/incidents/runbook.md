# Runbook de Resposta a Incidentes de Segurança com Dados Pessoais

**Versão**: 1.0  
**Data**: 07/11/2026  
**Auditor**: LGPD Audit Maestro  
**Normas de Referência**: Art. 48 da Lei Federal nº 13.709/2018 (LGPD) e Resolução CD/ANPD nº 15/2024 (Regulamento de Comunicação de Incidentes de Segurança — RCIS).  

---

## 1. Prazos Mandatórios e Gatilhos de Notificação

### 1.1 Critério Cumulativo de Notificação (Res. 15/2024, Art. 5º)
O incidente é obrigatoriamente notificável à ANPD e aos titulares se e somente se atender a **ambos** os critérios:
1. **Risco ou dano relevante** aos direitos fundamentais e interesses dos titulares; **E**
2. **Envolver pelo menos uma das seguintes categorias**:
   - Dados de autenticação em sistemas (senhas, hashes, tokens de sessão ou OAuth);
   - Dados financeiros (cartões, transações, cobranças);
   - Dados sensíveis (origem racial, saúde, opiniões políticas em redações);
   - Dados de crianças, adolescentes ou idosos;
   - Dados protegidos por sigilo legal, judicial ou profissional;
   - Dados tratados em larga escala.

### 1.2 Prazos de Comunicação
* **Comunicação à ANPD**: **3 dias úteis** contados a partir do conhecimento da afetação a dados pessoais (para Agentes de Pequeno Porte - ATPP, o prazo é em dobro: **6 dias úteis**, salvo risco à integridade física/moral - Res. 15/2024, Art. 6º e 14).
* **Comunicação aos Titulares Afetados**: **3 dias úteis** (ou 6 dias úteis para ATPP) em linguagem simples e acessível (Res. 15/2024, Art. 9º).
* **Obrigação de Registro Universal**: Registro de **TODOS** os incidentes (notificáveis ou não) arquivado por no mínimo **5 anos** (Res. 15/2024, Art. 10) em `.lgpd/incidents/log.md`.

---

## 2. Linha do Tempo de Resposta (T+0 a T+72h)

### Fase 1: Detecção e Contenção Imediata (T+0h a T+4h)
- [ ] **Registrar o Marco Zero (Timestamp)**: Anotar dia e hora exatos em que a equipe tomou ciência de que dados pessoais foram potencialmente expostos.
- [ ] **Acionar o Encarregado (DPO)** imediatamente.
- [ ] **Contenção**:
  - Isolar serviços ou bancos comprometidos.
  - Revogar chaves de API afetadas (OpenAI, Anthropic, Google, Stripe, Resend).
  - Invalidar sessões ativas forçando logout geral de usuários suspeitos.
  - Não formatar servidores nem destruir evidências ou logs de auditoria.

### Fase 2: Triagem e Avaliação de Risco (T+4h a T+24h)
- [ ] Identificar a extensão do vazamento: quais tabelas e campos foram acessados?
- [ ] Quantidade estimada de titulares afetados.
- [ ] Aplicar o teste do Art. 5º da Res. 15/2024 (é notificável?).

### Fase 3: Comunicações Formais (T+24h a T+72h)
- [ ] **Se notificável à ANPD**, protocolar comunicado oficial via sistema eletrônico da ANPD contendo os 12 itens do Art. 6º, § 2º:
  1. Identificação e dados do controlador e do Encarregado.
  2. Data, hora e duração do incidente.
  3. Descrição da natureza e dos dados afetados.
  4. Número aproximado de titulares.
  5. Riscos e consequências potenciais.
  6. Medidas técnicas tomadas para conter e mitigar o incidente.
  7. Medidas que os titulares devem adotar (ex.: troca de senha).
- [ ] **Comunicação aos Titulares**: Disparo de e-mail informativo aos afetados contendo orientações claras para proteção (ex.: alteração de credenciais).

### Fase 4: Registro e Lições Aprendidas (Pós-Incidente)
- [ ] Lançar entrada detalhada no arquivo de guarda de 5 anos: `.lgpd/incidents/log.md`.
- [ ] Conduzir post-mortem técnico e emitir plano corretivo de segurança.
