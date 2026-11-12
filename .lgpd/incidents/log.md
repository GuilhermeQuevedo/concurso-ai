# Registro de Incidentes de Segurança com Dados Pessoais

**Finalidade**: Guarda obrigatória de registros de todos os incidentes de segurança por no mínimo **5 anos**, em estrito cumprimento ao **Artigo 10 da Resolução CD/ANPD nº 15/2024**.  
**Responsável pelo Registro**: Encarregado de Proteção de Dados (DPO) / Squad de Segurança  

---

## Histórico de Incidentes


### Modelo de Entrada de Registro (Para uso em caso de ocorrência):

```markdown
### INC-YYYY-NNN — [Título Breve do Incidente]

- **Data e Hora da Detecção**: AAAA-MM-DD HH:MM (UTC-3)
- **Marco do Conhecimento**: AAAA-MM-DD HH:MM
- **Sistemas Afetados**: [Ex.: Banco de Dados MySQL / API Auth]
- **Categorias de Dados Afetados**: [Ex.: E-mails, Hashes de Senhas]
- **Quantidade de Titulares Estimada**: [Número ou estimativa]
- **Avaliação de Risco (Res. 15/2024 Art. 5º)**: [Notificável: Sim / Não]
- **Comunicação à ANPD**: [Data do protocolo / Não aplicável]
- **Comunicação aos Titulares**: [Data dos e-mails / Não aplicável]
- **Causa Raiz Identificada**: [Descrição técnica detalhada]
- **Medidas de Contenção Adotadas**: [Ações tomadas]
- **Medidas de Mitigação e Prevenção Futura**: [Melhorias de código/infraestrutura]
- **Status do Incidente**: [Encerrado / Em Monitoramento]
- **Responsável pelo Encerramento**: [Nome e Data]
```

---

### INC-2026-001 — Teste de simulacao preventivo

- **Data e Hora da Detecção**: 2026-11-10T13:44:03.345Z
- **Marco do Conhecimento**: 2026-11-10T13:44:03.345Z
- **Severidade Classificada**: BAIXA
- **Sistemas Afetados**: Banco de Dados MySQL / API
- **Categorias de Dados Afetados**: E-mails, nomes cadastrados
- **Quantidade de Titulares Estimada**: 0 (simulação)
- **Avaliação de Risco (Res. 15/2024 Art. 5º)**: Notificável: NÃO (Risco Baixo/Controlado)
- **Comunicação à ANPD**: Não aplicável (critérios do Art. 5º não atendidos)
- **Comunicação aos Titulares**: Não aplicável
- **Causa Raiz Identificada**: Investigação preliminar de vulnerabilidade ou teste de rotina.
- **Medidas de Contenção Adotadas**: Rotação de credenciais e isolamento de tráfego anômalo.
- **Medidas de Mitigação e Prevenção Futura**: Reforço de testes automatizados e monitoramento de alertas.
- **Status do Incidente**: Em Investigação / Monitoramento
- **Responsável pelo Registro**: Encarregado pelo Tratamento de Dados (DPO)
