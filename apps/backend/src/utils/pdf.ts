import fs from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';

export async function extractPdfText(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  const parser = new PDFParse({ data: new Uint8Array(data) }) as unknown as {
    load(): Promise<void>;
    getText(): Promise<{ text: string }>;
  };
  await parser.load();
  const result = await parser.getText();
  return result.text.trim();
}

interface PdfTextPages {
  load(): Promise<void>;
  getText(): Promise<{ text: string; pages?: Array<{ text: string }> }>;
}

// Texto de cada página, na ordem; é a base para ler edital grande em partes.
export async function extractPdfPageTexts(filePath: string): Promise<string[]> {
  const data = await fs.readFile(filePath);
  const parser = new PDFParse({ data: new Uint8Array(data) }) as unknown as PdfTextPages;
  await parser.load();
  const result = await parser.getText();
  return result.pages && result.pages.length > 0 ? result.pages.map((page) => page.text) : [result.text];
}
