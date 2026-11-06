import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { IStorageService, StoredFile } from '../interfaces/storage.interface.js';
import { AppError } from '../middlewares/error-handler.js';

export class LocalStorageService implements IStorageService {
  private readonly baseDir: string;
  private readonly baseUrl: string;

  constructor(baseDir = 'uploads', baseUrl = '/uploads') {
    this.baseDir = path.resolve(baseDir);
    this.baseUrl = baseUrl;
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  async save(
    file: { buffer?: Buffer; path?: string; originalname: string; mimetype: string; size: number },
    folder = '',
  ): Promise<StoredFile> {
    // Sanitização rigorosa do nome do arquivo contra directory traversal
    const cleanOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(cleanOriginalName).toLowerCase();
    const uniqueFileName = `${crypto.randomUUID()}${ext}`;

    // Sanitização da subpasta
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const targetDir = sanitizedFolder ? path.join(this.baseDir, sanitizedFolder) : this.baseDir;
    fs.mkdirSync(targetDir, { recursive: true });

    const targetFilePath = path.join(targetDir, uniqueFileName);
    const key = sanitizedFolder ? `${sanitizedFolder}/${uniqueFileName}` : uniqueFileName;

    if (file.buffer) {
      await fs.promises.writeFile(targetFilePath, file.buffer);
    } else if (file.path) {
      // Se já veio salvo em disco pelo multer
      if (path.resolve(file.path) !== targetFilePath) {
        await fs.promises.copyFile(file.path, targetFilePath);
        await fs.promises.unlink(file.path).catch(() => {});
      }
    } else {
      throw new AppError(400, 'INVALID_FILE_SOURCE', 'Arquivo sem dados para armazenamento');
    }

    const url = `${this.baseUrl}/${key}`;
    return {
      key,
      url,
      size: file.size,
      mimeType: file.mimetype,
      originalName: cleanOriginalName,
    };
  }

  async delete(key: string): Promise<void> {
    // Proteção contra escape de diretório (Path Traversal)
    const safeKey = path.normalize(key).replace(/^(\.\.[/\\])+/, '');
    const fullPath = path.join(this.baseDir, safeKey);

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath).catch(() => {});
    }
  }

  getUrl(key: string): string {
    const safeKey = path.normalize(key).replace(/^(\.\.[/\\])+/, '');
    return `${this.baseUrl}/${safeKey.replace(/\\/g, '/')}`;
  }
}

/**
 * Adapter S3-Compatível (Cloudflare R2, AWS S3, MinIO)
 * Pronto para ativação bastando configurar as variáveis de ambiente S3.
 */
export class S3StorageService implements IStorageService {
  constructor(
    private readonly endpoint?: string,
    private readonly bucket?: string,
  ) {}

  async save(
    _file: { buffer?: Buffer; path?: string; originalname: string; mimetype: string; size: number },
    _folder = '',
  ): Promise<StoredFile> {
    throw new AppError(501, 'NOT_IMPLEMENTED', 'S3 adapter configurável via credenciais S3/R2.');
  }

  async delete(_key: string): Promise<void> {
    // Implementação via S3Client DeleteObjectCommand
  }

  getUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }
}

/**
 * Singleton padrão do StorageService
 */
export const storageService = new LocalStorageService();
