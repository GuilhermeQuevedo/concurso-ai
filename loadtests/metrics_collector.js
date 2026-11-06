const fs = require('fs');
const path = require('path');
const os = require('os');
const { PrismaClient } = require('C:/Users/user/concurso-ai/apps/backend/node_modules/@prisma/client');

const prisma = new PrismaClient();
const logFile = path.resolve(__dirname, 'metrics.jsonl');
fs.writeFileSync(logFile, '', 'utf8');

let running = true;

process.on('SIGINT', () => { running = false; });
process.on('SIGTERM', () => { running = false; });

async function getDbStatus() {
  try {
    const rows = await prisma.$queryRawUnsafe("SHOW STATUS WHERE Variable_name IN ('Threads_connected', 'Threads_running', 'Queries', 'Slow_queries')");
    const map = {};
    for (const r of rows) {
      map[r.Variable_name] = Number(r.Value);
    }
    return map;
  } catch (err) {
    return { error: err.message };
  }
}

function getCpuUsage() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }
  return { idle, total };
}

let lastCpu = getCpuUsage();

async function loop() {
  while (running) {
    await new Promise((r) => setTimeout(r, 2000));
    const nowCpu = getCpuUsage();
    const idleDiff = nowCpu.idle - lastCpu.idle;
    const totalDiff = nowCpu.total - lastCpu.total;
    lastCpu = nowCpu;
    const cpuPercent = totalDiff > 0 ? (100 - (100 * idleDiff) / totalDiff).toFixed(1) : 0;

    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMemPercent = (((totalMem - freeMem) / totalMem) * 100).toFixed(1);

    const db = await getDbStatus();

    const sample = {
      timestamp: new Date().toISOString(),
      cpuPercent: Number(cpuPercent),
      ramPercent: Number(usedMemPercent),
      freeMemMb: Math.round(freeMem / 1024 / 1024),
      dbThreadsConnected: db.Threads_connected ?? null,
      dbThreadsRunning: db.Threads_running ?? null,
      dbQueriesTotal: db.Queries ?? null,
      dbSlowQueries: db.Slow_queries ?? null,
      dbError: db.error ?? null,
    };

    fs.appendFileSync(logFile, JSON.stringify(sample) + '\n', 'utf8');
  }
  await prisma.$disconnect();
}

loop().catch(console.error);
