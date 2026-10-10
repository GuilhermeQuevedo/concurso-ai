#!/usr/bin/env bash
# Atualiza o Engrama no VPS: puxa o código novo, reinstala deps e reinicia.
set -euo pipefail
APP_DIR="/opt/engrama"

git -C "$APP_DIR" pull --ff-only
cd "$APP_DIR/deploy"
npm install --omit=dev
pm2 restart engrama --update-env
pm2 save
echo "Engrama atualizado."
