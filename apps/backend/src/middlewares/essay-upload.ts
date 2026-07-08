import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { AppError } from './error-handler.js';

const UPLOAD_DIR = path.resolve('uploads/essays');
const MAX_FILE_SIZE = 10 * 1024 * 1024;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIMES: Record<string, boolean> = {
  'application/pdf': true,
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const essayUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES[file.mimetype]) {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'Tipo de arquivo não suportado. Use PDF, JPG, PNG ou WebP.'));
      return;
    }
    cb(null, true);
  },
});
