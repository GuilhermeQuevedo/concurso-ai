export interface StoredFile {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export interface IStorageService {
  save(file: { buffer?: Buffer; path?: string; originalname: string; mimetype: string; size: number }, folder?: string): Promise<StoredFile>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
