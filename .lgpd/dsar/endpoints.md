# Especificação Técnica de Endpoints DSAR (Art. 18 LGPD)

**Versão**: 1.0  
**Data**: 07/11/2026  
**Tecnologias**: Express 5, Prisma ORM, TypeScript, Zod  

---

## 1. Exportação de Dados Pessoais (Portabilidade e Acesso Integral)

- **Rota**: `GET /api/auth/me/export`
- **Autenticação**: Obrigatória (`authMiddleware`)
- **Rate Limit**: Estrito (máximo 2 requisições por hora por IP/usuário)
- **Descrição**: Compila todos os dados vinculados ao titular em um arquivo JSON estruturado e portável.

### Resposta de Sucesso (`200 OK`):
```json
{
  "success": true,
  "data": {
    "exportedAt": "2026-11-07T20:30:00.000Z",
    "subject": {
      "id": "cuid...",
      "name": "Nome do Aluno",
      "email": "aluno@email.com",
      "phone": "+5511999999999",
      "targetExam": "Polícia Federal",
      "dailyGoal": 30,
      "createdAt": "2026-10-01T12:00:00.000Z"
    },
    "attempts": [
      {
        "questionId": "cuid...",
        "answer": "B",
        "isCorrect": true,
        "timeSpent": 45,
        "createdAt": "2026-10-02T14:20:00.000Z"
      }
    ],
    "essays": [
      {
        "title": "Redação Modelo Dissertativo",
        "theme": "Segurança Pública no Brasil",
        "content": "Texto do candidato...",
        "score": 92,
        "feedback": "Excelente domínio da norma padrão..."
      }
    ],
    "studySessions": [],
    "notes": [],
    "flashcards": [],
    "payments": [
      {
        "event": "checkout.session.completed",
        "amountCents": 2990,
        "currency": "BRL",
        "createdAt": "2026-10-01T12:05:00.000Z"
      }
    ]
  }
}
```

---

## 2. Eliminação Definitiva da Conta (Direito ao Esquecimento / Rescisão)

- **Rota**: `POST /api/auth/me/erasure` ou `DELETE /api/auth/me`
- **Autenticação**: Obrigatória (`authMiddleware`)
- **Validação de Segurança**: Exigência de senha atual ou revalidação de token Google para prevenir exclusões indevidas.

### Payload de Requisição:
```json
{
  "confirmationText": "EXCLUIR MINHA CONTA",
  "password": "senhaDoUsuario123"
}
```

### Regras de Negócio do Controller/Service:
1. Validar senha ou desafio OAuth.
2. Cancelar assinaturas ativas no Stripe (`stripe.subscriptions.cancel`).
3. Revogar tokens OAuth do Google Calendar e excluir integrações.
4. Executar transação de exclusão no Prisma (`prisma.user.delete({ where: { id: userId } })`), disparando o cascade em todas as tabelas filhas.
5. Invalidação de todas as sessões e tokens JWT em cache/Redis.
6. Retorno de `200 OK` com confirmação de expurgo emitido.
