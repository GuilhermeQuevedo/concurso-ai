const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const p = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('Password123!', 12);
  for (let i = 1; i <= 15; i++) {
    await p.user.update({
      where: { email: `loadtest_user_${i}@concurso.ai` },
      data: { password: hash }
    });
  }
  console.log('Password successfully set for 15 loadtest users');
  await p.$disconnect();
}
run().catch(console.error);
