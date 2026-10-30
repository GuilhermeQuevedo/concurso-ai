import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';

export interface PdfDropzoneProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  file?: File | null;
  title?: string;
  subtitle?: string;
  accept?: string;
  maxSizeMB?: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
};

export function PdfDropzone({
  onFileSelect,
  disabled = false,
  file: controlledFile,
  title = 'Envie seu material de estudo',
  subtitle = 'PDF, até 50MB — apostilas, editais, provas',
  accept = '.pdf,.txt,.md',
  maxSizeMB = 50,
}: PdfDropzoneProps) {
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFile = controlledFile !== undefined ? controlledFile : internalFile;

  const handleFile = useCallback(
    (f: File) => {
      setError(null);
      const isPdfOrDoc = /\.(pdf|txt|md|docx?)$/i.test(f.name);
      if (!isPdfOrDoc) {
        setError('Por favor, selecione um arquivo válido (PDF, TXT ou Markdown).');
        return;
      }
      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`O arquivo deve ter no máximo ${maxSizeMB}MB.`);
        return;
      }
      setInternalFile(f);
      onFileSelect(f);
    },
    [maxSizeMB, onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile],
  );

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalFile(null);
    onFileSelect(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContainerClick = () => {
    if (!disabled && !currentFile) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      <div
        onClick={handleContainerClick}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={disabled ? undefined : handleDrop}
        className={`relative rounded-xl transition-all duration-200 text-left p-6 select-none ${
          disabled
            ? 'cursor-not-allowed border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 opacity-60'
            : isDragging
              ? 'border-2 border-solid border-amber-500 bg-amber-500/10 cursor-pointer shadow-inner'
              : 'border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-500/[0.03] bg-white/70 dark:bg-gray-900/60 cursor-pointer'
        }`}
      >
        {currentFile ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {currentFile.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {formatFileSize(currentFile.size)}
                  </span>
                  <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Pronto para processar
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={removeFile}
              title="Remover arquivo"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-2">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            <p className="mt-2 text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:underline">
              Clique para selecionar ou arraste o arquivo aqui
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
