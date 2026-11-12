import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { env } from './config/env.js';
import { prisma } from './database/prisma.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
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
    } catch (error) {
      console.error(`[Admin Bootstrap] Erro ao processar conta ${email}:`, error);
    }
  }
}

/**
 * Coleta hashes sha256 de scripts inline do index.html gerado pelo Vite
 * para permitir no script-src da CSP sem abrir mão de 'self'.
 */
function inlineScriptCspHashes(): string[] {
  const candidates = [
    path.resolve('public', 'index.html'),
    path.resolve('..', 'frontend', 'dist', 'index.html'),
  ];
  let html = '';
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        html = fs.readFileSync(p, 'utf-8');
        break;
      }
    } catch {
      // continua tentando
    }
  }

  // Em desenvolvimento, o bundle em disco pode não existir (Vite serve em memória).
  // Gera o index.html sob demanda se não achou em disco.
  if (!html && env.NODE_ENV === 'development') {
    const frontendDir = path.resolve('..', 'frontend');
    const indexHtmlPath = path.resolve(frontendDir, 'dist', 'index.html');
    try {
      if (!fs.existsSync(indexHtmlPath) && fs.existsSync(path.resolve(frontendDir, 'package.json'))) {
        execSync('pnpm build', { cwd: frontendDir, stdio: 'ignore', timeout: 60000 });
        if (fs.existsSync(indexHtmlPath)) {
          html = fs.readFileSync(indexHtmlPath, 'utf-8');
        }
      }
    } catch {
      // se o build falhar, segue com array vazio
    }
  }

  if (!html) return [];

  try {
    const scriptRegex = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    const hashes: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = scriptRegex.exec(html)) !== null) {
      const inlineContent = match[1];
      if (inlineContent && inlineContent.trim().length > 0) {
        const hash = crypto.createHash('sha256').update(inlineContent).digest('base64');
        hashes.push(`'sha256-${hash}'`);
      }
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

// Middleware de Segurança LGPD (Gap G01): Garante SameSite=Lax, HttpOnly e Secure por padrão em cookies
app.use((_req, res, next) => {
  const originalCookie = res.cookie.bind(res);
  res.cookie = (name: string, val: unknown, options?: express.CookieOptions) => {
    const isProd = env.NODE_ENV === 'production';
    const enhancedOptions: express.CookieOptions = {
      sameSite: 'lax',
      secure: isProd,
      httpOnly: true,
      ...options,
    };
    return originalCookie(name, val, enhancedOptions);
  };
  next();
});
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

let isShuttingDown = false;

// Middleware durante shutdown gracioso: rejeita novas conexões para permitir que as ativas terminem
app.use((req, res, next) => {
  if (isShuttingDown && req.path.startsWith('/api') && !req.path.startsWith('/api/health')) {
    res.setHeader('Connection', 'close');
    res.status(503).json({
      success: false,
      error: { code: 'SERVER_SHUTTING_DOWN', message: 'Servidor em processo de reinicialização limpa.' },
    });
    return;
  }
  next();
});

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

function handleGracefulShutdown(signal: string): void {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[GracefulShutdown] Sinal ${signal} recebido. Drenando conexões ativas...`);

  // Para de aceitar novas requisições
  server.close(async () => {
    console.log('[GracefulShutdown] Servidor HTTP fechado. Desconectando Prisma...');
    try {
      await prisma.$disconnect();
      console.log('[GracefulShutdown] Prisma desconectado com sucesso.');
    } catch (err) {
      console.error('[GracefulShutdown] Erro ao desconectar Prisma:', err);
    }
    console.log('[GracefulShutdown] Processo finalizado com sucesso.');
    process.exit(0);
  });

  // Timeout forçado de 15 segundos para evitar processos zumbis
  setTimeout(() => {
    console.warn('[GracefulShutdown] Timeout forçado de 15s atingido. Encerrando processo.');
    process.exit(1);
  }, 15000).unref();
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export { app };
