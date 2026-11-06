# RUNBOOK DE OPERAÇÃO E DEPLOY — ENGRAMA PLATFORM
> **Ambiente Alvo:** VPS Hostinger KVM 1 (1 vCPU, 4 GB RAM, 50 GB NVMe, Ubuntu 24.04 LTS, Campinas-BR)

---

## 1. Nginx Hardening (Fase 1)

### Pré-requisitos
- Acesso SSH com privilégios `sudo` à VPS.
- Repositório clonado em `/var/www/engrama`.

### Passo a Passo de Aplicação

1. **Backup da configuração existente do Nginx:**
   ```bash
   sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak.$(date +%F_%T)
   if [ -d /etc/nginx/sites-available ]; then
       sudo cp -r /etc/nginx/sites-available /etc/nginx/sites-available.bak.$(date +%F_%T)
   fi
   ```

2. **Copiar as configurações otimizadas:**
   ```bash
   sudo cp /var/www/engrama/deploy/nginx/nginx.conf /etc/nginx/nginx.conf
   sudo cp /var/www/engrama/deploy/nginx/engrama.conf /etc/nginx/sites-available/engrama.conf
   ```

3. **Habilitar o site e desabilitar o default:**
   ```bash
   sudo ln -sf /etc/nginx/sites-available/engrama.conf /etc/nginx/sites-enabled/engrama.conf
   sudo rm -f /etc/nginx/sites-enabled/default
   ```

4. **Validar e recarregar:**
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

### Procedimento de Rollback
```bash
sudo cp /etc/nginx/nginx.conf.bak.* /etc/nginx/nginx.conf
sudo rm -f /etc/nginx/sites-enabled/engrama.conf
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx
```

---

## 2. MariaDB Hardening & Tuning (Fase 2)

### Passo a Passo de Aplicação

1. **Copiar configuração e ajustar permissões:**
   ```bash
   sudo cp /var/www/engrama/deploy/mariadb/my.cnf /etc/mysql/mariadb.conf.d/60-engrama-perf.cnf
   sudo chmod 644 /etc/mysql/mariadb.conf.d/60-engrama-perf.cnf
   sudo touch /var/log/mysql/mariadb-slow.log
   sudo chown mysql:mysql /var/log/mysql/mariadb-slow.log
   sudo chmod 640 /var/log/mysql/mariadb-slow.log
   ```

2. **Reiniciar o MariaDB:**
   ```bash
   sudo systemctl restart mariadb
   ```

3. **Validar variáveis no banco:**
   ```bash
   sudo mariadb -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';"
   sudo mariadb -e "SHOW VARIABLES LIKE 'max_connections';"
   sudo mariadb -e "SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit';"
   ```

### Procedimento de Rollback
```bash
sudo rm -f /etc/mysql/mariadb.conf.d/60-engrama-perf.cnf
sudo systemctl restart mariadb
```

---

## 3. Kernel Sysctl, Limits & Swap de 2GB (Fase 5)

### Passo 1: Configurar Swap de 2 GB (Proteção contra OOM Killer)
```bash
# Verificar se já existe swap ativo
sudo swapon --show

# Se não houver, criar arquivo swapfile de 2 GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Persistir no fstab para carregar no boot
if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi
```

### Passo 2: Aplicar Sysctl e Limits de Conexões TCP
```bash
# Copiar e carregar parâmetros de rede e memória do Kernel
sudo cp /var/www/engrama/deploy/sysctl/99-engrama-perf.conf /etc/sysctl.d/99-engrama-perf.conf
sudo sysctl --system

# Copiar limites de descritores de arquivo (65535 files)
sudo cp /var/www/engrama/deploy/limits/engrama-limits.conf /etc/security/limits.d/99-engrama-limits.conf
```

---

## 4. Gerenciamento de Processos PM2 (Fase 5)

### Instalação e Inicialização
```bash
# Instalar PM2 globalmente se necessário
sudo npm install -g pm2

# Instalar rotação de logs para não encher o disco da VPS
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 20M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Criar pasta de logs
sudo mkdir -p /var/log/engrama
sudo chown -R $USER:$USER /var/log/engrama

# Iniciar aplicação
cd /var/www/engrama
pm2 start deploy/pm2/ecosystem.config.cjs

# Salvar lista de processos e gerar script de startup no boot do sistema
pm2 save
pm2 startup systemd
```

### Comandos Operacionais PM2
- **Verificar status e consumo:** `pm2 status`
- **Monitor em tempo real (CPU/RAM):** `pm2 monit`
- **Visualizar logs:** `pm2 logs engrama-api`
- **Reload gracioso (zero-downtime):** `pm2 reload engrama-api`
- **Reinicialização:** `pm2 restart engrama-api`

---

## 5. Rotina de Backup Automatizado (Fase 5)

### Agendamento via Cron
1. **Conceder permissão de execução:**
   ```bash
   sudo chmod +x /var/www/engrama/deploy/backup/backup-mariadb.sh
   ```

2. **Agendar no crontab do sistema (diariamente às 03:00):**
   ```bash
   # Executar 'sudo crontab -e' e adicionar a linha:
   0 3 * * * /var/www/engrama/deploy/backup/backup-mariadb.sh >> /var/log/engrama/backup.log 2>&1
   ```

### Procedimento de Restauração (Disaster Recovery)
```bash
# Para restaurar um backup específico:
gunzip < /var/backups/mariadb/concurso_ai_YYYYMMDD_HHMMSS.sql.gz | sudo mariadb concurso_ai
```

---

## 6. Probes de Monitoramento & Health Check

| Endpoint | Tipo | Finalidade | Status Esperado |
|---|---|---|---|
| `/api/health/live` | Liveness | Indica se o processo Node está vivo e respondendo a eventos. | `200 OK` (sempre imediato) |
| `/api/health/ready` | Readiness | Executa `SELECT 1` no MariaDB e ping no Redis para garantir aptidão de tráfego. | `200 OK` ou `503 Service Unavailable` |
| `/api/health` | Legacy | Compatibilidade geral com ferramentas externas. | `200 OK` |
