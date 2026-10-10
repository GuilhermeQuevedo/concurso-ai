import { build } from 'esbuild';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(backendRoot, '../..');
const outDir = path.join(repoRoot, 'deploy');

// Dependências de runtime que ficam no node_modules do host (instaladas via npm install)
const external = [
  '@anthropic-ai/sdk',
  '@prisma/client',
  '.prisma/client',
  'bcrypt',
  'express',
  'cors',
  'helmet',
  'express-rate-limit',
  'jose',
  'multer',
  'pdf-parse',
  'zod',
];

const runtimeDependencies = {
  '@anthropic-ai/sdk': '^0.132.1',
  '@prisma/client': '^6.9.0',
  prisma: '^6.9.0',
  bcrypt: '^5.1.0',
  cors: '^2.8.0',
  express: '^5.1.0',
  'express-rate-limit': '^7.5.0',
  helmet: '^8.1.0',
  jose: '^6.0.0',
  multer: '^2.2.0',
  'pdf-parse': '^2.4.5',
  zod: '^3.25.0',
};

async function main() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  await build({
    entryPoints: [path.join(backendRoot, 'src/server.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    outfile: path.join(outDir, 'server.mjs'),
    external,
    logLevel: 'info',
    banner: {
      js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);",
    },
  });

  // Prisma: schema + migrations
  mkdirSync(path.join(outDir, 'prisma'), { recursive: true });
  cpSync(path.join(backendRoot, 'prisma/schema.prisma'), path.join(outDir, 'prisma/schema.prisma'));
  const migrations = path.join(backendRoot, 'prisma/migrations');
  if (existsSync(migrations)) {
    cpSync(migrations, path.join(outDir, 'prisma/migrations'), { recursive: true });
  }

  // Frontend buildado -> public
  const feDist = path.join(repoRoot, 'apps/frontend/dist');
  if (existsSync(feDist)) {
    cpSync(feDist, path.join(outDir, 'public'), { recursive: true });
  } else {
    console.warn('[build-deploy] apps/frontend/dist não encontrado — rode o build do frontend antes.');
  }

  // Pasta de uploads (gravável em runtime)
  mkdirSync(path.join(outDir, 'uploads'), { recursive: true });
  writeFileSync(path.join(outDir, 'uploads/.gitkeep'), '');

  const pkg = {
    name: 'concurso-ai-deploy',
    version: '1.0.0',
    private: true,
    type: 'module',
    main: 'server.mjs',
    engines: { node: '>=20' },
    prisma: { schema: 'prisma/schema.prisma' },
    scripts: {
      postinstall: 'prisma generate',
      build: 'node -e "process.exit(0)"',
      start: 'node server.mjs',
      'db:deploy': 'prisma migrate deploy',
    },
    dependencies: runtimeDependencies,
  };
  writeFileSync(path.join(outDir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);

  writeFileSync(
    path.join(outDir, '.env.example'),
    [
      'NODE_ENV=production',
      '# O Hostinger define a porta; o app lê de PORT',
      'PORT=3000',
      'DATABASE_URL="mysql://USUARIO:SENHA@localhost:3306/NOME_DO_BANCO"',
      '# Gere um segredo forte (32+ caracteres)',
      'JWT_SECRET="troque-por-um-segredo-aleatorio-bem-longo-de-32+"',
      '# Domínio do app (mesma origem serve o front, então pode ser a própria URL)',
      'CORS_ORIGIN="https://SEU-DOMINIO"',
      '# IA: mock por enquanto. Troque para gemini quando tiver a chave.',
      'AI_PROVIDER=mock',
      '# GEMINI_API_KEY="sua-chave-aqui"',
      '# Redação no Claude (qualidade) e o resto no provider barato:',
      '# AI_ESSAY_PROVIDER=claude',
      '# ANTHROPIC_API_KEY="sua-chave-anthropic"',
      '# ANTHROPIC_MODEL=claude-sonnet-5-5',
      '# Limites de custo:',
      'EDITAL_MAX_PAGES=50',
      'WEEKLY_ESSAY_LIMIT=1',
      '# Pagamentos (Kiwify). Ligue o bloqueio só quando for cobrar.',
      'REQUIRE_SUBSCRIPTION=false',
      '# KIWIFY_WEBHOOK_TOKEN="token-do-webhook-do-kiwify"',
      '# KIWIFY_CHECKOUT_URL="https://pay.kiwify.com.br/seu-produto"',
      '',
    ].join('\n'),
  );

  console.log(`\n[build-deploy] Pacote gerado em: ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
