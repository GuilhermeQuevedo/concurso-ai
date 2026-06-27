import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { AppError } from './error-handler.js';

const UPLOAD_DIR = path.resolve('uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIMES: Record<string, string> = {
  'application/pdf': 'PDF',
  'text/plain': 'TXT',
  'text/markdown': 'MARKDOWN',
  'text/html': 'HTML',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES[file.mimetype]) {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'Tipo de arquivo não suportado. Use PDF, TXT, MD ou HTML.'));
      return;
    }
    cb(null, true);
  },
});

export function mimeToDocType(mime: string): string {
  return ALLOWED_MIMES[mime] ?? 'TXT';
}
