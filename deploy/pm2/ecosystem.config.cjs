// ==============================================================================
// PM2 Ecosystem Configuration for Engrama Platform (Hostinger KVM 1)
// 1 vCPU, 4GB RAM, Ubuntu 24.04 LTS
// ==============================================================================

module.exports = {
  apps: [
    {
      name: 'engrama-api',
      script: 'dist/server.js',
      cwd: '/var/www/engrama/apps/backend',

      // NOTA ARQUITETURAL SOBRE INSTÂNCIAS (1 vCPU):
      // Com 1 vCPU, 'instances: 1' é a configuração mais eficiente, pois evita disputa
      // de CPU entre processos Node e economiza ~150-200MB de RAM.
      // Se desejar reload com ZERO-DOWNTIME absoluto durante deploys (pm2 reload),
      // configure 'instances: 2' temporariamente, desde que a RAM livre seja >= 800MB.
      instances: 1,
      exec_mode: 'fork', // Em 1 vCPU, 'fork' é mais leve que 'cluster'

      // Orçamento estrito de memória: reinicia de forma controlada se ultrapassar 1.2 GB
      max_memory_restart: '1200M',

      // Proteção contra loops de crash (evita fritar a CPU caso o banco caia)
      restart_delay: 3000,
      max_restarts: 10,
      exp_backoff_restart_delay: 200,
      min_uptime: '10s',

      // Encerramento gracioso respeitando o graceful shutdown do Express/Prisma
      kill_timeout: 15000,
      wait_ready: false,
      listen_timeout: 10000,

      // Logs com rotação e timestamps
      time: true,
      error_file: '/var/log/engrama/api-error.log',
      out_file: '/var/log/engrama/api-out.log',
      merge_logs: true,

      env: {
        NODE_ENV: 'production',
        PORT: 3333,
      },
    },
  ],
};
