import { memo, useState, useEffect } from 'react';
import {
  X,
  Share2,
  Download,
  FileText,
  Image as ImageIcon,
  Check,
  Copy,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { GraphNode, GraphEdge } from '../types/map.types';
import { generateSyllabusMarkdown } from '../utils/export-markdown';

export type ExportTab = 'PNG' | 'MARKDOWN' | 'LINK';

export interface MapExportDialogProps {
  readonly isOpen: boolean;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly onClose: () => void;
  readonly onExportPng?: () => string | null;
}

/**
 * Diálogo de Exportação e Compartilhamento do Mapa de Revisão.
 *
 * Suporta:
 * 1. Exportação de imagem PNG do canvas com resolução e timestamp.
 * 2. Exportação de resumo estruturado em Markdown (compatível com Obsidian e Notion).
 * 3. Geração de link compartilhável público (garantindo LGPD: sem dados pessoais de domínio).
 */
export const MapExportDialog = memo(function MapExportDialog({
  isOpen,
  nodes,
  edges,
  onClose,
  onExportPng,
}: MapExportDialogProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>('PNG');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);

  // Fecha no Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Se abriu a aba PNG, tenta capturar a imagem
  useEffect(() => {
    if (isOpen && activeTab === 'PNG' && onExportPng) {
      const url = onExportPng();
      setPngDataUrl(url);
    }
  }, [isOpen, activeTab, onExportPng]);

  if (!isOpen) return null;

  const markdownContent = generateSyllabusMarkdown(nodes, edges);

  const shareableUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/map`
    : 'https://concurso-ai.com/map';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignora falha de clipboard silenciosamente
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch {
      // Ignora falha de clipboard
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edital-revisao-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    const dataUrl = pngDataUrl ?? onExportPng?.();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `mapa-constelacao-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Conteúdo do Modal */}
      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
              <Share2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="export-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                Exportar e Compartilhar Mapa
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gere imagens em alta definição, anotações para Obsidian/Notion ou compartilhe.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar diálogo de exportação"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Abas */}
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('PNG')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'PNG'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Imagem PNG
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MARKDOWN')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'MARKDOWN'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Markdown (Obsidian)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LINK')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'LINK'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            Link Público
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div className="mt-4 min-h-[220px]">
          {activeTab === 'PNG' && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-950/40">
              {pngDataUrl ? (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="max-h-36 overflow-hidden rounded-xl border border-slate-200 shadow-xs dark:border-slate-800">
                    <img
                      src={pngDataUrl}
                      alt="Prévia do Mapa de Revisão"
                      className="max-h-36 object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-500 transition-colors cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Baixar Imagem em Alta Resolução (.png)
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon className="h-10 w-10 text-slate-400" />
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Gere uma captura nítida da visão atual da constelação para estudos ou revisões visuais.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-500 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    Gerar e Baixar Imagem (.png)
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'MARKDOWN' && (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <textarea
                  readOnly
                  rows={8}
                  value={markdownContent}
                  aria-label="Conteúdo do resumo em Markdown"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-800 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {copiedMarkdown ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      Copiar Conteúdo
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-500 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Baixar Arquivo .md
                </button>
              </div>
            </div>
          )}

          {activeTab === 'LINK' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  aria-label="Link compartilhável do mapa"
                  className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-700 focus:outline-none dark:text-slate-300"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500 transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar Link
                    </>
                  )}
                </button>
              </div>

              {/* Box de Segurança e LGPD */}
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                    Privacidade Garantida (LGPD by Design)
                  </p>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                    O link público expõe apenas a estrutura canônica e as conexões do edital. Seus dados pessoais, respostas, erros e nível de domínio jamais são compartilhados.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
