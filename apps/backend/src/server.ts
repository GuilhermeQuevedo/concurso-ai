import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import { RATE_LIMIT } from '@concurso-ai/shared';

function applyMigrations(): void {
  try {
    const out = execSync(
      'node node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma',
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

const app: ReturnType<typeof express> = express();

app.set('trust proxy', 1);
app.use(helmet());
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
});

// IA local pode levar vários minutos em editais grandes
server.requestTimeout = 660000;

export { app };
