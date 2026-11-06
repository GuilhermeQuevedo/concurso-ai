#!/usr/bin/env bash
# ==============================================================================
# Script de Backup Automatizado do MariaDB — Engrama Platform
# Execução recomendada via Cron: 0 3 * * * (todo dia às 03:00 da manhã)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/var/backups/mariadb"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="concurso_ai"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando dump do banco ${DB_NAME}..."

# Dump consistente sem travar leituras (--single-transaction)
mysqldump \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --default-character-set=utf8mb4 \
    "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"

chmod 600 "${BACKUP_FILE}"
FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

# Gerar checksum para validação de integridade
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup concluído com sucesso: ${BACKUP_FILE} (${FILE_SIZE})"

# Limpeza de backups locais com mais de 7 dias
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Limpando backups com mais de ${RETENTION_DAYS} dias..."
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz*" -type f -mtime +${RETENTION_DAYS} -delete

# (Opcional) Envio para Cloudflare R2 ou S3 com rclone ou aws-cli
# if command -v rclone &> /dev/null; then
#     rclone copy "${BACKUP_FILE}" r2:engrama-backups/mariadb/
# fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Rotina de backup finalizada."
