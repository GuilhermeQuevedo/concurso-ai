# Deploy do Engrama no VPS (Hostinger)

Guia para rodar o Engrama em um VPS Ubuntu, com MySQL local, PM2 e nginx.
Acesso inicial por **IP** (sem domínio). HTTPS com domínio pode ser adicionado depois.

> **Segredos**: você digita as senhas/chaves durante a execução do script. Nada de
> senha fica no código ou no repositório.

---

## Passo 1 — Provisionar o VPS (você)

No hPanel → **VPS** → seu servidor → **Configurar**:

1. Sistema operacional: **Ubuntu 24.04 LTS** (limpo, sem painel).
2. Defina a **senha de root**.
3. Aguarde provisionar. Anote o **IP** que aparecer.

## Passo 2 — Abrir o terminal do VPS

Opção A (mais fácil): hPanel → VPS → **Navegador de terminal**.
Opção B: SSH do seu PC → `ssh root@SEU_IP`.

## Passo 3 — Instalar tudo (1 comando)

> O repositório `GuilhermeQuevedo/concurso-ai` precisa estar **público** para o
> `git clone` funcionar sem autenticação. Se estiver privado, deixe-o público em
> GitHub → Settings → Danger Zone → Change visibility (o repo não contém segredos),
> ou configure um token de deploy.

Cole no terminal do VPS (como root):

```bash
apt-get update && apt-get install -y git && \
git clone https://github.com/GuilhermeQuevedo/concurso-ai.git /opt/engrama && \
bash /opt/engrama/infra/vps/setup.sh
```

O script vai pedir, na hora:

- **Senha do banco** (crie uma forte).
- (opcional) caminho de um **dump .sql** para importar os dados atuais — veja o Passo 4.
- (opcional) `AI_PROVIDER`, `GEMINI_API_KEY`, `AI_ESSAY_PROVIDER`, `ANTHROPIC_API_KEY`.
- (opcional) `ADMIN_EMAIL` + `ADMIN_PASSWORD`.

No fim ele mostra a URL: **http://SEU_IP**.

## Passo 4 — Migrar os dados do site atual

No seu PC (DBeaver já conectado ao banco atual `u263652281_concurso`):

1. **Exporte** o banco atual para um arquivo `engrama.sql`
   (DBeaver → clique no banco → Exportar/Export → SQL; **inclua os dados**,
   **não** inclua `CREATE DATABASE`/`USE`).
2. **Envie** o `engrama.sql` para o VPS:
   - pelo **Navegador de arquivos** do hPanel, ou
   - `scp engrama.sql root@SEU_IP:/root/engrama.sql`
3. Importe (se não fez no Passo 3):

```bash
mysql engrama < /root/engrama.sql
pm2 restart engrama
```

> O app roda `prisma db push` no boot, então o schema é reconciliado
> automaticamente após a importação.

## Passo 5 — Liberar a porta 80 (se necessário)

Se o site não abrir, confirme que a porta **80** está liberada no firewall
(hPanel → VPS → Firewall) e no servidor:

```bash
ufw allow 80/tcp || true
```

---

## Operação

- **Logs**: `pm2 logs engrama`
- **Status**: `pm2 status`
- **Atualizar** (após um push novo no GitHub): `bash /opt/engrama/infra/vps/update.sh`
- **Editar segredos**: `nano /opt/engrama/deploy/.env` e depois `pm2 restart engrama`

## Depois: domínio + HTTPS

Quando tiver um domínio apontando para o IP do VPS (registro A):

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d SEU_DOMINIO
```

E ajuste `CORS_ORIGIN` no `.env` para `https://SEU_DOMINIO`.
