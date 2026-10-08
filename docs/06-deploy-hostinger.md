# Deploy no Hostinger (Business Web Hosting)

Guia para colocar o **Concurso AI** no ar no plano **Business Web Hosting** usando o recurso de **aplicativo Node.js** do hPanel.

- **Modelo:** um único app Node (`deploy/server.mjs`) serve a **API** (`/api`) **e** o **frontend** (mesma origem).
- **IA:** `AI_PROVIDER=mock` por enquanto (respostas de exemplo). Troca para `gemini` quando tiver a chave.
- **Publicação:** via **GitHub** (o Hostinger puxa do repositório).

---

## 0. Como o pacote é gerado (feito por nós)

Na raiz do projeto:

```bash
pnpm build:deploy
```

Isso builda o frontend e empacota o backend num bundle único na pasta **`deploy/`**, contendo:

```
deploy/
  server.mjs            # backend empacotado (sem dependências de workspace)
  package.json          # só dependências de runtime + scripts (start, postinstall, db:deploy)
  prisma/schema.prisma  # + migrations
  public/               # frontend buildado (servido pelo próprio app)
  .env.example          # modelo das variáveis de ambiente
```

O `deploy/` é commitado no repositório. No Hostinger, o **diretório raiz do app** será `deploy`.

---

## 1. Subir o projeto para o GitHub

1. Crie um repositório **privado** no GitHub (ex: `concurso-ai`).
2. Na raiz do projeto, conecte e envie:

```bash
git add .
git commit -m "chore: preparar deploy (bundle + guia Hostinger)"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/concurso-ai.git
git push -u origin main
```

> `node_modules/`, `.env` e `deploy/node_modules/` já estão no `.gitignore` — não vão para o GitHub.

---

## 2. Criar o banco MySQL no hPanel

1. hPanel → **Bancos de dados → MySQL**.
2. Crie um banco novo e um usuário. Anote: **nome do banco, usuário, senha, host** (geralmente `localhost`).
3. Garanta que o charset é **utf8mb4** (padrão no Hostinger).

---

## 3. Criar o aplicativo Node.js

1. hPanel → **Avançado → Node.js** (ou **Sites → Node.js App**).
2. **Fonte:** GitHub → selecione o repositório e o branch **main**.
3. **Diretório do app (App root):** `deploy`
4. **Versão do Node:** 22 (ou 20).
5. **Comando de instalação:** `npm install` (o `postinstall` roda `prisma generate` automaticamente).
6. **Comando de início:** `npm start` (executa `node server.mjs`). Normalmente é detectado pelo `package.json`.

> O Hostinger define a **porta** automaticamente; o app lê de `process.env.PORT`. Não fixe PORT.

---

## 4. Variáveis de ambiente (no painel do app Node)

Adicione (baseado em `deploy/.env.example`):

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `mysql://USUARIO:SENHA@localhost:3306/NOME_DO_BANCO` |
| `JWT_SECRET` | um segredo aleatório de **32+ caracteres** |
| `CORS_ORIGIN` | a URL pública do app (ex: `https://seusub.hostingersite.com`) |
| `AI_PROVIDER` | `mock` |

> Para gerar o `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
> Depois, quando tiver a chave do Gemini: trocar `AI_PROVIDER=gemini` e adicionar `GEMINI_API_KEY=...`.

---

## 5. Rodar as migrations (criar as tabelas)

O banco começa vazio. Rode as migrations **uma vez**. Caminho mais simples na hospedagem compartilhada:

1. hPanel → **Bancos de dados → MySQL remoto (Remote MySQL)** → libere o **seu IP**.
2. Na sua máquina, dentro de `deploy/`, com a `DATABASE_URL` apontando para o banco do Hostinger:

```bash
cd deploy
# crie um .env local temporário só com a DATABASE_URL do Hostinger
npm install
npm run db:deploy      # prisma migrate deploy
```

> Alternativa: se o painel do app Node oferecer um terminal/execução de comando, rode `npm run db:deploy` por lá.
> **(Opcional)** popular bancas/disciplinas iniciais pode ser feito depois; para o MVP, o usuário já cadastra o que precisa.

---

## 6. Domínio

Você ainda não tem domínio. Duas opções:

- **Testar já:** use o **subdomínio temporário** que o Hostinger oferece (algo como `seusite.hostingersite.com`). Funciona para validar com o grupo.
- **Depois:** registre um domínio (ou aponte um que já tenha) e troque em **CORS_ORIGIN** + nas configurações do site. SSL (HTTPS) é automático via Let's Encrypt no Hostinger.

---

## 7. Publicar e testar

1. Clique em **Deploy/Publicar** no painel do app Node.
2. Acesse a URL → deve abrir a tela do Concurso AI.
3. Teste **cadastro** e **login**. Depois crie um concurso, gere flashcards (no mock vêm exemplos), etc.

---

## 8. Atualizações futuras

A cada mudança no código:

```bash
pnpm build:deploy
git add . && git commit -m "deploy: atualização"
git push
```

No hPanel, clique em **Deploy** novamente (ou configure deploy automático, se disponível).

---

## Observações / limites (hospedagem compartilhada)

- **IA pesada:** não roda aqui (sem GPU). Fica na **API externa** (Gemini) quando ligar.
- **Timeouts:** gerações muito longas podem esbarrar em limite de requisição do plano; com Gemini é rápido.
- **`npm audit`:** o `npm install` pode acusar vulnerabilidades em dependências transitivas (multer/pdf-parse). Avaliar/atualizar quando conveniente.
- **Escala:** se o uso crescer muito, migrar para **VPS KVM** (mesmo código, mais controle) é o próximo passo, sem retrabalho.
