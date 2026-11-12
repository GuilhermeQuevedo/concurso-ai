# Relatório de Impacto à Proteção de Dados Pessoais (RIPD / DPIA)
### Artigo 38 da Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018 - LGPD)

> [!IMPORTANT]
> **RASCUNHO — PENDENTE DE REVISÃO JURÍDICA**
> Este documento constitui a avaliação formal de impacto sobre a privacidade e proteção de dados decorrente do uso de Inteligência Artificial Generativa e Avaliação Automatizada de Desempenho na plataforma **Engrama** (Engrama Tecnologia Educacional Ltda.). Deve ser submetido à revisão periódica da assessoria jurídica especializada e do DPO.

---

## 1. Identificação do Controlador e do Projeto

| Quesito Regulatório | Descrição |
| :--- | :--- |
| **Controlador** | **Engrama Tecnologia Educacional Ltda.** |
| **Sistema / Módulo Auditado** | Módulo de Inteligência Artificial e Correção Automatizada de Redações e Estudos de Caso |
| **Encarregado (DPO)** | Comitê de Governança de Dados e Privacidade (`dpo@engrama.com.br`) |
| **Enquadramento de Risco (Res. CD/ANPD nº 2/2022)** | Tecnologia emergente com avaliação automatizada de perfil cognitivo de candidatos |
| **Data da Avaliação** | Novembro de 2026 • Versão 2.0 Consolidada |

---

## 2. Descrição da Atividade e Fluxo de Dados com IA

O Engrama emprega modelos de fronteira em inteligência artificial (OpenAI GPT, Google Gemini, Anthropic Claude e Ollama local) para viabilizar:
1. **Correção Dissertativa com Critérios Oficiais**: Análise estrutural, semântica e gramatical de redações segundo parâmetros das principais bancas brasileiras (Cespe/Cebraspe, FGV, FCC, Vunesp).
2. **Estudos de Caso e Questões Discursivas**: Confrontação de respostas do candidato com espelhos oficiais de avaliação.
3. **Simulados Adaptativos e Flashcards**: Geração de materiais personalizados com foco nas fragilidades cognitivas detectadas nos simulados.

### Fluxo Arquitetural com Salvaguardas de Privacidade

```
[Estudante digita texto ou anexa imagem manuscrita]
                      ↓
[Serviço de Redação recebe a submissão no backend]
                      ↓
[CAMADA DE SANITIZAÇÃO DE PII (PIISanitizerAIProvider / redactPII)]
* Expurgados: CPF, RG, E-mail, Telefone, Nome/Assinatura do Aluno
* Inseridas: Diretivas de privacidade anti-OCR no prompt
                      ↓
[Envio HTTPS TLS 1.3 para Provedor de IA com Zero Retention / No Training]
                      ↓
[LLM gera parecer estritamente técnico de correção pedagógica]
                      ↓
[Gravação de Nota e Feedback no MySQL • Apresentação Explicável ao Aluno]
```

---

## 3. Avaliação de Necessidade e Proporcionalidade

A utilização de IA é estritamente proporcional e indispensável para democratizar o acesso a correções discursivas de alto rigor técnico, cujo custo de correção humana individualizada seria financeiramente inacessível à esmagadora maioria dos estudantes de concursos públicos.

* **Minimização**: Nenhuma credencial, identificador de banco (`userId`), e-mail, telefone ou dado sensível é incluído no prompt enviado aos servidores de IA. Apenas o corpo do texto de estudo e o tema proposto transitam pelo sanitizador.
* **Finalidade Específica**: Os dados são utilizados unicamente para gerar o feedback educacional contratado pelo titular.
* **Não Reutilização**: Contratos comerciais com provedores de IA garantem que os dados de prompt não são retidos para treinamento de novos modelos públicos da OpenAI, Anthropic ou Google.

---

## 4. Salvaguardas Preventivas para Menores de Idade (ECA Digital — Lei nº 15.211/2025)

Em observância aos Artigos 14 da LGPD e Arts. 22 e 26 da Lei Federal nº 15.211/2025 (ECA Digital):
1. **Vedação à Perfilização Comportamental**: O Engrama proíbe categoricamente a utilização de algoritmos de inteligência artificial para criar perfis psicológicos, comportamentais, socioeconômicos ou mercadológicos de crianças e adolescentes.
2. **Uso Exclusivamente Pedagógico**: O processamento limita-se à mensuração objetiva de acertos em itens de estudo e gramática em língua portuguesa.
3. **Barreira de Consentimento no Onboarding**: Inserida no cadastro declaração mandatória de maioridade ou autorização parental expressa.

---

## 5. Explicabilidade e Revisão Humana (Artigo 20 da LGPD)

Em atendimento ao direito de revisão de decisões automatizadas:
1. **Critérios Parametrizados e Explicáveis**: A nota da redação é decomposta matematicamente nos 3 critérios oficiais:
   - **CAC — Conteúdo e Atendimento ao Comando** (0 a 40 pontos);
   - **OT — Organização Textual** (0 a 30 pontos);
   - **DLP — Domínio da Língua Portuguesa** (0 a 30 pontos).
2. **Transparência de Limitações**: O estudante é formalmente alertado de que o parecer é emitido por modelo de inteligência artificial auxiliar.
3. **Canal de Contestação e Revisão**: É assegurado ao titular o direito de reportar eventuais alucinações ou distorções de correção diretamente ao suporte pedagógico e ao Encarregado (`dpo@engrama.com.br`).

---

## 6. Matriz de Riscos e Medidas de Mitigação Implementadas

| Risco Identificado | Gravidade Inicial | Salvaguarda Técnica / Jurídica Implementada | Risco Residual |
| :--- | :---: | :--- | :---: |
| **1. Vazamento de dados pessoais de estudantes via prompts para LLMs** | **ALTA** | Implementação de camada obrigatória de sanitização (`PIISanitizerAIProvider`) e decorador transparente em todas as chamadas. | **BAIXO** |
| **2. Utilização de redações e anotações para treinar modelos externos de IA** | **ALTA** | Contratação de APIs comerciais com cláusulas estritas de *Zero Retention* e vedação de treinamento de modelos públicos. | **BAIXO** |
| **3. Violação ao ECA Digital por perfilização abusiva de menores de 18 anos** | **CRÍTICA** | Barreira de declaração no cadastro, exclusão de perfilização psicológica e estrito confinamento pedagógico. | **BAIXO** |
| **4. Alucinação de notas ou critérios arbitrários sem explicabilidade** | **MÉDIA** | Decomposição paramétrica dos critérios oficiais de bancas e canal para solicitação de reavaliação. | **BAIXO** |
| **5. Exposição de chaves de integração Google Calendar em repouso** | **ALTA** | Criptografia envelope AES-256-GCM com chave de aplicação de 256 bits (`ENCRYPTION_KEY`). | **BAIXO** |

---

## 7. Parecer Conclusivo do Encarregado pelo Tratamento de Dados (DPO)

> **PARECER DO DPO**:
> Diante das salvaguardas arquiteturais consolidadas nas 13 fases de adequação técnica — incluindo a implementação do decorator de minimização de PII (`PIISanitizerAIProvider`), a criptografia envelope em repouso (AES-256-GCM), o mascaramento de logs administrativos com trilha imutável (`AdminAuditLog`), a conformidade com o ECA Digital e as políticas de eliminação fiscal irreversível e DSAR —, conclui-se que os riscos associados ao tratamento de dados por Inteligência Artificial encontram-se **integralmente mitigados a patamares aceitáveis e compatíveis com as melhores práticas internacionais de Privacy-by-Design e a Lei Geral de Proteção de Dados**.
> 
> *Aprovado para operação regular em ambiente de produção.*
