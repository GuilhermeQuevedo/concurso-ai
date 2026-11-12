# Diretrizes de Anonimização, Pseudonimização e Analytics — Concurso AI (Engrama)

**Versão**: 1.0  
**Data**: 07/11/2026  
**Auditor**: LGPD Audit Maestro  
**Norma de Referência**: Art. 12 da Lei Federal nº 13.709/2018 (Dados Anonimizados)  

---

## 1. Princípio do Art. 12 da LGPD

> *"Os dados anonimizados não serão considerados dados pessoais, para os fins desta Lei, salvo quando o processo de anonimização ao qual foram submetidos for revertido, utilizando exclusivamente meios próprios, ou quando, com esforços razoáveis, puder ser revertido."* (Art. 12, caput).

Para manter métricas de aprendizado, benchmarks e análises de inteligência coletiva fora do escopo da LGPD, o Concurso AI adota técnicas estritas de pseudonimização e anonimização irreversível.

---

## 2. Aplicação Prática no Sistema

### 2.1 Métricas de Questões e Simulados (Estatísticas Agregadas)
- As tabelas que calculam taxa de assertividade por banca, índice de dificuldade de questões (`EASY`, `MEDIUM`, `HARD`) e curva de discriminação do item devem operar exclusivamente sobre contadores numéricos agregados (`totalAttempts`, `correctCount`, `averageTimeSpent`).
- Uma vez calculada a taxa de acerto global da questão, a correlação com a identidade individual do aluno é descartada para fins estatísticos de sistema.

### 2.2 Sanitização e Prevenção de Vazamento em Logs de Erro
Para evitar a persistência involuntária de dados pessoais identificáveis (PII) em logs do console ou ferramentas de observabilidade:
- **Proibição de Logging de Credenciais**: É expressamente vedado logar payloads brutos de autenticação (`req.body.password`, `req.body.token`, `googleAccessToken`).
- **Tratamento de Exceções**: O middleware de erro centralizado (`apps/backend/src/middlewares/error-handler.ts`) já sanitiza mensagens de erro, evitando expor stack traces ou dados sensíveis aos clientes HTTP.
- **Mascaramento de E-mails**: Em saídas de auditoria ou avisos de segurança, o e-mail deve ser formatado com máscara de privacidade (ex.: `g***2@gmail.com`).

---

## 3. Pseudonimização nos Rankings Públicos

- Nos placares de líderes (`RankingBoard`) e grupos comunitários, o usuário tem a prerrogativa de definir um "Nome de Exibição" ou pseudônimo de estudo, desvinculando sua identidade civil do ranqueamento público se assim desejar.
