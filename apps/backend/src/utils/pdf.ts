import fs from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';

export interface PdfExtractResult {
  text: string;
  pages: number;
}

export async function extractPdf(filePath: string): Promise<PdfExtractResult> {
  const data = await fs.readFile(filePath);
  const parser = new PDFParse({ data: new Uint8Array(data) }) as unknown as {
    load(): Promise<void>;
    getText(): Promise<{ text: string; total?: number; pages?: unknown[] }>;
  };
  await parser.load();
  const result = await parser.getText();
  const pages = result.total ?? (Array.isArray(result.pages) ? result.pages.length : 0);
  return { text: result.text.trim(), pages };
}

export async function extractPdfText(filePath: string): Promise<string> {
  const { text } = await extractPdf(filePath);
  return text;
}
