# Relatório de Impacto à Proteção de Dados (RIPD / DPIA)
## Atividade: Correção Pedagógica Automatizada de Redações com Modelos de Linguagem de Larga Escala (LLMs)

**Documento**: `.lgpd/RIPD/ripd-ai-essay-grading.md`  
**Data**: 07/11/2026  
**Versão**: 1.0  
**Controlador**: Engrama Tech (Concurso AI)  
**Encarregado (DPO)**: Comitê de Proteção de Dados (`privacidade@engrama.tech`)  
**Normas de Referência**: Artigo 38 da Lei nº 13.709/2018 (LGPD), Artigo 20 (Revisão de Decisões Automatizadas) e Resolução CD/ANPD nº 2/2022, Art. 4º (Critério de Alto Risco por Tecnologia Emergente e Avaliação Automatizada).  

---

## 1. Contexto e Justificativa da Atividade

A preparação para cargos públicos de alto escalão (Carreiras Jurídicas, Fiscais, Policiais e de Gestão) exige dos candidatos elevado domínio da escrita dissertativa-argumentativa e resolução de estudos de caso. A contratação de corretores humanos individuais gera custos proibitivos e tempo de resposta de vários dias.

O módulo de redação do Concurso AI utiliza modelos de inteligência artificial de fronteira (Anthropic Claude 3.5 Sonnet e Google Gemini 2.5) para:
1. Analisar a estrutura formal, coesão, gramática e atendimento à proposta temática do edital;
2. Apontar desvios com justificativa detalhada e fundamentação doutrinária/jurisprudencial;
3. Atribuir pontuação quantitativa conforme espelho de correção da banca examinadora (Cespe/Cebraspe, FGV, FCC, Vunesp).

---

## 2. Descrição Detalhada do Fluxo de Dados

```
[Aluno digita ou envia redação]
            ↓
[Backend Express recebe payload e salva na tabela MySQL `Essay`]
            ↓
[Mecanismo de Minimização: texto da redação é isolado sem envio de nome, e-mail ou dados de perfil]
            ↓
[Requisição HTTPS cifrada (TLS 1.3) enviada à API corporativa de IA (Anthropic / Gemini)]
            ↓
[LLM processa o espelho de correção sob política de 'Zero Data Retention / No Training']
            ↓
[Retorno do JSON com nota, critérios pontuados e feedback analítico]
            ↓
[Armazenamento no MySQL e apresentação interativa no painel do aluno]
```

---

## 3. Conformidade com os 10 Princípios da LGPD (Art. 6º)

| Princípio (Art. 6º) | Aplicação Prática na Atividade de IA | Avaliação |
|---|---|---|
| **I. Finalidade** | O tratamento do texto destina-se unicamente à emissão de feedback pedagógico e atribuição de nota de treino. | Conforme |
| **II. Adequação** | O processamento via LLM é compatível e adequado para a tarefa de análise semântica e gramatical. | Conforme |
| **III. Necessidade** | Apenas o corpo do texto e tema são transmitidos ao modelo; identificadores do titular são omitidos do prompt. | Conforme |
| **IV. Livre Acesso** | O aluno tem acesso imediato à íntegra do feedback, notas parciais e critérios empregados. | Conforme |
| **V. Qualidade dos Dados** | O sistema utiliza os critérios oficiais e espelhos padronizados das bancas examinadoras. | Conforme |
| **VI. Transparência** | O usuário é informado previamente de que a avaliação é gerada por algoritmo de IA com critérios explícitos. | Conforme |
| **VII. Segurança** | Conexões HTTPS TLS 1.3, chaves de API restritas em variáveis de ambiente, banco de dados isolado. | Conforme |
| **VIII. Prevenção** | Contratos de API comercial com vedação expressa ao uso de dados dos prompts para treinamento público. | Conforme |
| **IX. Não Discriminação** | Prompts elaborados com instruções estritas para mitigar vieses algorítmicos em temas sensíveis. | Conforme |
| **X. Responsabilização** | Monitoramento de taxa de erro de parsing, geração de logs e canal de suporte para contestação de nota. | Conforme |

---

## 4. Direitos do Titular e Decisão Automatizada (Artigo 20 da LGPD)

Em atendimento ao Artigo 20 da LGPD:
1. **Direito à Explicabilidade**: O sistema expõe de forma modularizada cada um dos subcritérios da avaliação (ex.: Domínio da Norma Padrão, Apresentação e Estrutura, Desenvolvimento Temático), permitindo ao aluno compreender a fundamentação matemática e pedagógica de cada desconto de ponto.
2. **Canal de Contestação**: Caso o aluno identifique evidente alucinação da IA ou erro de correção material, é facultado solicitar reanálise através do suporte ou submeter nova tentativa ajustada.

---

## 5. Matriz de Riscos e Medidas Mitigadoras (ISO 31000)

| ID | Risco Identificado | Prob. (1-5) | Impacto (1-5) | Nível | Controles e Salvaguardas Implementadas | Risco Residual |
|---|---|---|---|---|---|---|
| **R01** | Uso do texto da redação para treinar modelos abertos das Big Techs | 2 | 4 | 8 (Médio) | Utilização exclusiva de contas de API pagas/comerciais com termos contratuais de Zero Data Retention (OpenAI, Anthropic e Google Cloud garantem que dados via API não treinam modelos). | **Baixo** |
| **R02** | Vazamento de dados em trânsito entre o backend e a API de IA | 1 | 5 | 5 (Baixo) | Criptografia estrita TLS 1.3 ponta a ponta em todas as chamadas de rede externas. | **Muito Baixo** |
| **R03** | Inserção de dados sensíveis íntimos no texto pelo próprio estudante | 3 | 3 | 9 (Médio) | Termos de uso orientam o aluno a não incluir nomes próprios nem dados pessoais desnecessários nas redações; exclusão em 1 clique disponível no histórico de redações. | **Baixo** |
| **R04** | Alucinação da IA na atribuição de notas (erro pedagógico) | 3 | 3 | 9 (Médio) | Prompt engineering robusto com validação Zod estruturada; feedback descritivo transparente com espelho da banca. | **Baixo** |

---

## 6. Parecer Conclusivo do Encarregado (DPO)

Considerando que:
1. Os dados pessoais transmitidos aos operadores de IA são minimizados (apenas o texto da redação, sem metadados identificadores de autoria);
2. Existem garantias contratuais de não utilização dos dados para treinamento público;
3. O aluno detém controle total sobre a exclusão dos textos e tem acesso claro aos critérios de pontuação;

**Conclusão**: O tratamento apresenta **nível de risco residual baixo e plenamente aceitável**, recomendando-se o prosseguimento da funcionalidade com a manutenção contínua das salvaguardas contratuais e técnicas implementadas.
