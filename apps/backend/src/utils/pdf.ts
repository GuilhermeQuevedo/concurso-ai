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
