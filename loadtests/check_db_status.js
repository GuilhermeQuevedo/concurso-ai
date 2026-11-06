const { PrismaClient } = require('C:/Users/user/concurso-ai/apps/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vars = await prisma.$queryRawUnsafe("SHOW VARIABLES LIKE '%connections%'");
  console.log('Connections vars:', vars);
  const maxConns = await prisma.$queryRawUnsafe("SHOW VARIABLES LIKE 'max_connections'");
  console.log('Max connections:', maxConns);
  const threads = await prisma.$queryRawUnsafe("SHOW STATUS LIKE '%Threads_%'");
  console.log('Threads status:', threads);
  const pool = await prisma.$queryRawUnsafe("SHOW VARIABLES LIKE 'innodb_buffer_pool_size'");
  console.log('Buffer pool:', pool);
}

main().catch(console.error).finally(() => prisma.$disconnect());
