# Auditoria de Operadores e Fornecedores (Vendor Audit) — Concurso AI (Engrama)

**Data**: 07/11/2026  
**Auditor**: LGPD Audit Maestro  
**Norma de Referência**: Arts. 39 e 42 da Lei nº 13.709/2018 (Responsabilidade do Operador e Solidariedade) e Resolução CD/ANPD nº 19/2024 (Transferência Internacional).  

---

## 1. Classificação por Tier de Risco

| Fornecedor / Operador | Categoria de Serviço | Dados Compartilhados | Tier de Risco | País Sede | Instrumento de Salvaguarda | Status DPA |
|---|---|---|---|---|---|---|
| **Stripe, Inc.** | Gateway de Pagamentos e Assinaturas | Nome, e-mail, metadados de cartão, endereço, valor | **Tier 1 (Crítico)** | Estados Unidos / Irlanda | PCI-DSS Level 1, Stripe Data Processing Agreement (DPA) + SCCs ANPD | **Ativo / Em Conformidade** |
| **Google LLC (Alphabet)** | OAuth 2.0 & Google Calendar API | Nome, e-mail, tokens de agenda, títulos de eventos de estudo | **Tier 1 (Crítico)** | Estados Unidos | Google Cloud DPA (Data Processing Addendum) + Cláusulas Modelo UE/BR | **Ativo / Em Conformidade** |
| **Anthropic, PBC** | LLM de Correção de Redações (`claude-sonnet-5-5`) | Redações dos alunos, temas, feedbacks pedagógicos | **Tier 1 (Crítico)** | Estados Unidos | Commercial Terms of Service + Data Processing Addendum (DPA) | **Requer Aditivo Formal** |
| **Google LLC (Gemini API)** | LLM de Questões e Resumos (`gemini-2.5-flash`) | Editais, fragmentos de textos de estudo, prompts | **Tier 2 (Alto)** | Estados Unidos | Google Cloud Vertex / Gemini API Terms (No training on customer data) | **Ativo / Em Conformidade** |
| **OpenAI, Inc.** | LLM de Conteúdo Pedagógico | Prompts de geração de questões e exercícios | **Tier 2 (Alto)** | Estados Unidos | OpenAI Business Terms + Data Processing Addendum | **Requer Aditivo Formal** |
| **Resend, Inc.** | Disparo de E-mails Transacionais | Nome, e-mail, tokens de reset de senha | **Tier 2 (Alto)** | Estados Unidos | Resend DPA + SOC 2 Type II compliance | **Ativo / Em Conformidade** |
| **Kiwify Tecnologia Ltda** | Processamento de Cobrança Legado | E-mail do pagador, valor, status da transação | **Tier 3 (Médio)** | Brasil | Termos de Adesão da Plataforma Kiwify | **Ativo / Nacional** |
| **Provedores Cloud (Vercel / Cloud MySQL / Redis)** | Infraestrutura e Hospedagem | Tráfego web, banco de dados cifrado, logs | **Tier 1 (Crítico)** | Estados Unidos / Brasil | SOC 2 Type II, ISO 27001, Data Processing Agreements globais | **Ativo / Em Conformidade** |

---

## 2. Critérios de Avaliação e Due Diligence

1. **Uso de Dados para Treinamento de IA (Zero Data Retention / No Training Policy)**:
   - **Google Gemini API**: De acordo com os termos comerciais pagos de API, os dados enviados nos prompts não são utilizados para treinar os modelos fundamentais públicos da Google.
   - **Anthropic Claude API**: Os termos comerciais de API corporativa garantem que as submissões não são utilizadas para treinamento de novos modelos generativos.
   - **OpenAI API**: Conforme a política oficial de API para desenvolvedores, os dados transitados via API não são aproveitados para treinamento sem autorização explícita do cliente.

2. **Transferência Internacional de Dados (Res. CD/ANPD nº 19/2024)**:
   - Como os operadores de infraestrutura e inteligência artificial possuem sede e servidores nos Estados Unidos, as relações contratuais devem incorporar formalmente as **Cláusulas-Padrão Contratuais brasileiras (SCCs)** aprovadas no Anexo II da Resolução CD/ANPD nº 19/2024.

---

## 3. Plano de Remediação com Fornecedores

1. **Formalização de DPAs com Anthropic e OpenAI**: Submeter os formulários eletrônicos padrão de DPA corporativo junto aos portais de desenvolvedores da Anthropic e OpenAI, registrando os comprovantes sob a pasta `.lgpd/vendors/`.
2. **Revisão Periódica**: Estabelecer revisão semestral dos certificados SOC 2 e relatórios de segurança dos fornecedores de Tier 1.
