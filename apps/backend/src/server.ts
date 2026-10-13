import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import bcrypt from 'bcrypt';
import { env } from './config/env.js';
import { prisma } from './database/prisma.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import { RATE_LIMIT } from '@concurso-ai/shared';

async function bootstrapAdmin(): Promise<void> {
  const email = env.ADMIN_EMAIL?.toLowerCase().trim();
  if (!email) return;
  try {
    const passwordHash = env.ADMIN_PASSWORD ? await bcrypt.hash(env.ADMIN_PASSWORD, 12) : null;
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (existing) {
      await prisma.user.update({
        where: { email },
        data: passwordHash ? { role: 'ADMIN', password: passwordHash } : { role: 'ADMIN' },
      });
      console.log('Admin bootstrap: usuário existente promovido para ADMIN.');
    } else if (passwordHash) {
      await prisma.user.create({
        data: { email, name: 'Administrador', role: 'ADMIN', password: passwordHash },
      });
      console.log('Admin bootstrap: conta ADMIN criada.');
    }
  } catch (error) {
    console.error('Falha no bootstrap do admin:', error);
  }
}

function applyMigrations(): void {
  try {
    const out = execSync(
      `"${process.execPath}" node_modules/prisma/build/index.js db push --schema prisma/schema.prisma --accept-data-loss --skip-generate`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    console.log('Migrations aplicadas com sucesso:\n', out);
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; message?: string };
    console.error('Falha ao aplicar migrations.');
    console.error('STDOUT:', e.stdout ?? '');
    console.error('STDERR:', e.stderr ?? '');
    console.error('MSG:', e.message ?? '');
  }
}

if (env.NODE_ENV === 'production') {
  applyMigrations();
}

// CSP exige liberar explicitamente os scripts inline do index.html (ex.: init de
// tema antes do paint). Calculamos o hash em runtime para nunca ficar defasado.
function inlineScriptCspHashes(): string[] {
  try {
    const html = fs.readFileSync(path.resolve('public', 'index.html'), 'utf8');
    const hashes: string[] = [];
    for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      const digest = crypto.createHash('sha256').update(match[1], 'utf8').digest('base64');
      hashes.push(`'sha256-${digest}'`);
    }
    return hashes;
  } catch {
    return [];
  }
}

const app: ReturnType<typeof express> = express();

app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'script-src': ["'self'", ...inlineScriptCspHashes()],
      },
    },
  }),
);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: RATE_LIMIT.GENERAL_WINDOW_MS,
    max: RATE_LIMIT.GENERAL_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: '10mb' }));

const uploadsDir = path.resolve('uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.use('/api', apiRouter);

// Servir o frontend em produção (SPA), quando a pasta public existir ao lado do app
const publicDir = path.resolve('public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
  void bootstrapAdmin();
});

// IA local pode levar vários minutos em editais grandes
server.requestTimeout = 660000;

export { app };
