import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { env } from './config/env.js';
import { prisma } from './database/prisma.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import { RATE_LIMIT } from '@concurso-ai/shared';
import { MASTER_ADMIN_EMAILS } from './utils/security.js';

async function bootstrapAdmin(): Promise<void> {
  const adminEmails = [
    ...MASTER_ADMIN_EMAILS,
    env.ADMIN_EMAIL,
    ...(env.ADMIN_EMAILS ?? '').split(','),
  ]
    .map((e) => e?.toLowerCase().trim())
    .filter((e): e is string => Boolean(e));

  const uniqueAdminEmails = Array.from(new Set(adminEmails));

  for (const email of uniqueAdminEmails) {
    try {
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });

      if (existing) {
        if (existing.role !== 'ADMIN') {
          await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' },
          });
          console.log(`[Admin Bootstrap] Usuário ${email} promovido para ADMIN.`);
        }
      } else {
        await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0],
            role: 'ADMIN',
          },
        });
        console.log(`[Admin Bootstrap] Nova conta ADMIN criada: ${email}.`);
      }

      // Garante Entitlement vitalício ativo para administradores autorizados
      await prisma.entitlement.upsert({
        where: { email },
        create: {
          email,
          status: 'ACTIVE',
          provider: 'admin',
          expiresAt: new Date('2099-12-31T23:59:59.999Z'),
        },
        update: {
          status: 'ACTIVE',
          expiresAt: new Date('2099-12-31T23:59:59.999Z'),
        },
      });
    } catch (error) {
      console.error(`[Admin Bootstrap] Falha ao sincronizar admin ${email}:`, error);
    }
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

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'script-src': ["'self'", ...inlineScriptCspHashes()],
      },
    },
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
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
    max: env.NODE_ENV === 'development' ? 2000 : RATE_LIMIT.GENERAL_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);

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
