#!/usr/bin/env bash
# Instalador do Engrama em um VPS Ubuntu (22.04/24.04).
# Instala Node 22, MySQL 8, nginx e PM2; cria o banco; sobe o app; proxy na porta 80.
# Os segredos (senha do banco, chaves de IA, senha de admin) são digitados por você
# durante a execução — nada fica no script.
set -euo pipefail

REPO_URL="https://github.com/GuilhermeQuevedo/concurso-ai.git"
APP_DIR="/opt/engrama"
APP_PORT=3000
DB_NAME="engrama"
DB_USER="engrama"

say() { echo; echo "==> $1"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root (sudo bash setup.sh)."; exit 1
fi

say "1/8 Instalando pacotes base"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git nginx mysql-server build-essential python3 ca-certificates openssl

say "2/8 Instalando Node 22"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

say "3/8 Instalando PM2"
npm install -g pm2 >/dev/null 2>&1 || npm install -g pm2

say "4/8 Banco de dados MySQL"
systemctl enable --now mysql
read -r -s -p "Defina a SENHA do banco (usuário '$DB_USER'): " DB_PASS; echo
mysql -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost'; FLUSH PRIVILEGES;"

say "5/8 Baixando o código"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$APP_DIR"
fi

say "6/8 Importar dados (opcional)"
read -r -p "Caminho de um dump .sql para importar agora (enter para pular): " DUMP
if [ -n "${DUMP:-}" ] && [ -f "$DUMP" ]; then
  mysql "$DB_NAME" < "$DUMP"
  echo "Dump importado."
fi

say "7/8 Configuração (.env) + dependências"
PUBLIC_IP="$(curl -fsSL https://api.ipify.org 2>/dev/null || echo "")"
JWT_SECRET="$(openssl rand -hex 32)"
read -r -p "AI_PROVIDER [mock]: " AI_PROVIDER; AI_PROVIDER="${AI_PROVIDER:-mock}"
read -r -p "GEMINI_API_KEY (enter para pular): " GEMINI_API_KEY
read -r -p "AI_ESSAY_PROVIDER (enter para pular, ex: claude): " AI_ESSAY_PROVIDER
read -r -p "ANTHROPIC_API_KEY (enter para pular): " ANTHROPIC_API_KEY
read -r -p "ADMIN_EMAIL (enter para pular): " ADMIN_EMAIL
ADMIN_PASSWORD=""
if [ -n "${ADMIN_EMAIL:-}" ]; then read -r -s -p "ADMIN_PASSWORD: " ADMIN_PASSWORD; echo; fi

ENV_FILE="$APP_DIR/deploy/.env"
{
  echo "NODE_ENV=production"
  echo "PORT=$APP_PORT"
  echo "DATABASE_URL=\"mysql://$DB_USER:$DB_PASS@localhost:3306/$DB_NAME\""
  echo "JWT_SECRET=\"$JWT_SECRET\""
  echo "CORS_ORIGIN=\"http://$PUBLIC_IP\""
  echo "AI_PROVIDER=$AI_PROVIDER"
} > "$ENV_FILE"
[ -n "${GEMINI_API_KEY:-}" ]     && echo "GEMINI_API_KEY=\"$GEMINI_API_KEY\""         >> "$ENV_FILE"
[ -n "${AI_ESSAY_PROVIDER:-}" ]  && echo "AI_ESSAY_PROVIDER=$AI_ESSAY_PROVIDER"       >> "$ENV_FILE"
[ -n "${ANTHROPIC_API_KEY:-}" ]  && echo "ANTHROPIC_API_KEY=\"$ANTHROPIC_API_KEY\""   >> "$ENV_FILE"
[ -n "${ADMIN_EMAIL:-}" ]        && echo "ADMIN_EMAIL=\"$ADMIN_EMAIL\""               >> "$ENV_FILE"
[ -n "${ADMIN_PASSWORD:-}" ]     && echo "ADMIN_PASSWORD=\"$ADMIN_PASSWORD\""         >> "$ENV_FILE"
chmod 600 "$ENV_FILE"

cd "$APP_DIR/deploy"
npm install --omit=dev

say "8/8 Subindo o app (PM2) + proxy (nginx)"
pm2 delete engrama >/dev/null 2>&1 || true
pm2 start server.mjs --name engrama --cwd "$APP_DIR/deploy"
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || pm2 startup >/dev/null 2>&1 || true

cat > /etc/nginx/sites-available/engrama <<NGINX
server {
  listen 80 default_server;
  server_name _;
  client_max_body_size 20M;
  location / {
    proxy_pass http://127.0.0.1:$APP_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NGINX
ln -sf /etc/nginx/sites-available/engrama /etc/nginx/sites-enabled/engrama
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo
echo "================================================================"
echo " Engrama no ar!  Acesse:  http://${PUBLIC_IP:-SEU_IP}"
echo " Logs:            pm2 logs engrama"
echo " Atualizar app:   bash $APP_DIR/infra/vps/update.sh"
echo "================================================================"
