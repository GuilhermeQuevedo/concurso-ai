// Lê um buffer de texto tolerando arquivos que não estão em UTF-8.
// Muitos arquivos gerados no Windows (Bloco de Notas antigo, exportações
// de planilha) vêm em Windows-1252/Latin-1. Se a decodificação UTF-8
// produzir caracteres de substituição (U+FFFD), refaz como Latin-1.
export function decodeTextBuffer(buffer: Buffer): string {
  const utf8 = buffer.toString('utf-8');
  if (utf8.includes('�')) {
    return buffer.toString('latin1');
  }
  return utf8;
}

// O multer entrega o nome do arquivo como Latin-1, mas navegadores enviam UTF-8.
// Sem este reparo "Expedições" vira "ExpediÃ§Ãµes".
export function fixMulterFilename(name: string): string {
  if (/[^\u0000-ÿ]/.test(name)) return name;
  const repaired = Buffer.from(name, 'latin1').toString('utf8');
  return repaired.includes('�') ? name : repaired;
}
