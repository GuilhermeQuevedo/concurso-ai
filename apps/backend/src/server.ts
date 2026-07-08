import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import { RATE_LIMIT } from '@concurso-ai/shared';

const app: ReturnType<typeof express> = express();

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
app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/api', apiRouter);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

// IA local pode levar vários minutos em editais grandes
server.requestTimeout = 660000;

export { app };
