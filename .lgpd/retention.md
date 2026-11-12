# Política de Retenção e Descarte de Dados — Concurso AI (Engrama)

**Versão**: 1.0  
**Data**: 07/11/2026  
**Auditor**: LGPD Audit Maestro  
**Norma de Referência**: Arts. 15 e 16 da Lei Federal nº 13.709/2018 (Término do Tratamento e Eliminação de Dados)  

---

## 1. Princípios e Hierarquia Legal de Retenção

A retenção de dados pessoais no Concurso AI é pautada pela estrita necessidade e obedece à seguinte hierarquia:

```
Obrigação Legal ou Regulatória (CTN, Marco Civil, CDC)
             ↓
Cumprimento de Contrato Ativo de Assinatura
             ↓
Vontade do Titular (Direito de Eliminação — Art. 18, VI LGPD)
```

> **Regra de Ouro**: O pedido de eliminação de conta por parte do usuário encerra imediatamente o tratamento para fins de estudo, simulados e marketing. Contudo, dados fiscais e registros de conexão previstos em lei são mantidos sob **bloqueio lógico** exclusivamente pelo prazo prescricional legal, sendo expurgados em definitivo ao término deste prazo.

---

## 2. Prazos Canônicos de Retenção por Categoria

| Entidade / Dado | Finalidade | Base Legal | Prazo de Retenção | Destino Pós-Retenção |
|---|---|---|---|---|
| **Histórico de Pagamentos e Faturas (`Payment`, `Entitlement`)** | Comprovação fiscal e tributária de receitas | Art. 7º, II LGPD; CTN Arts. 173-174; Lei 8.212/91 | **5 anos** civis contados do primeiro dia do exercício seguinte | Eliminação definitiva (Hard Delete) |
| **Registros de Aplicação / Conexão (IPs e Timestamps)** | Segurança de auditoria e cumprimento do Marco Civil | Art. 15 da Lei nº 12.965/2014 (MCI) | **6 meses** a contar do acesso | Sobrescrita e expurgo automático |
| **Credenciais e Cadastro Principal (`User`)** | Manutenção da conta de estudos e suporte | Art. 7º, V LGPD (Contrato) | Enquanto a conta estiver ativa + **5 anos** pós-encerramento (prescrição CDC Art. 27) | Anonimização irreversível ou Hard Delete |
| **Tokens de Acesso Google Calendar (`UserCalendarIntegration`)** | Sincronização de agenda | Art. 7º, V LGPD | Até o desvincular da integração ou eliminação da conta | Destruição imediata da chave e tokens |
| **Redações e Avaliações de IA (`Essay`)** | Portfólio de estudos do aluno | Art. 7º, V LGPD | Durante a atividade da conta ou até exclusão voluntária pelo aluno | Hard Delete do texto e uploads vinculados |
| **Resoluções e Métricas de Simulados (`QuestionAttempt`, `StudySession`)** | Cálculo de progresso e repetição espaçada | Art. 7º, V LGPD | Durante o uso da conta pelo titular | Hard Delete ou anonimização para agregação de benchmarking |
| **Uploads de Editais e Documentos (`Document`)** | Mapeamento do concurso | Art. 7º, V LGPD | Até término do concurso ou exclusão manual | Hard Delete no sistema de arquivos/storage |
| **Contatos e Leads Comerciais (`Contact`)** | Comunicação institucional e prospecção | Art. 7º, I ou IX LGPD | Até solicitação de descadastramento (opt-out) ou **2 anos** de inatividade | Hard Delete |
| **Tokens de Reset de Senha (`PasswordResetToken`)** | Recuperação de credencial | Art. 7º, V e IX LGPD | **30 minutos** (expiração natural) ou até o uso | Expurgo automático |

---

## 3. Mecanismos Técnicos de Eliminação

1. **Hard Delete em Cascata**:
   - O schema Prisma já possui relacionamentos configurados com `onDelete: Cascade` para `User`. Ao executar a exclusão da conta via rotina de expurgo, o banco elimina automaticamente todas as tentativas (`QuestionAttempt`), redações (`Essay`), notas (`Note`), favoritos (`Favorite`), sessões e integrações vinculadas.
2. **Bloqueio Lógico (Data Freezing)**:
   - Para usuários que possuem histórico financeiro em `Payment`, o registro de pagamento tem o campo `email` pseudonimizado após o prazo prescricional fiscal de 5 anos, preservando apenas o valor e data contábil agregada.
3. **Crypto-Shredding para Tokens**:
   - A destruição das credenciais de integração com APIs externas (ex.: Google Calendar) é efetuada descartando a chave simétrica de decriptografia do registro, tornando qualquer dado cifrado matematicamente irrecuperável.
