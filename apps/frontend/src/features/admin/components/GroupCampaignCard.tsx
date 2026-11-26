import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Users, Copy, Check, Link as LinkIcon, MessageCircle, Download } from 'lucide-react';
import { DEFAULT_WA_TEMPLATE } from '@/features/admin/whatsapp';

export interface GroupCampaignCardProps {
  template: string;
  groupLink: string;
  onTemplateChange: (value: string) => void;
  onGroupLinkChange: (value: string) => void;
}

function useQrDataUrl(value: string): string | null {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    const link = value.trim();
    if (!link) {
      setQr(null);
      return;
    }
    let active = true;
    QRCode.toDataURL(link, { width: 220, margin: 1 })
      .then((url) => {
        if (active) setQr(url);
      })
      .catch(() => {
        if (active) setQr(null);
      });
    return () => {
      active = false;
    };
  }, [value]);

  return qr;
}

interface CopyButtonProps {
  text: string;
  label: string;
  disabled?: boolean;
}

function CopyButton({ text, label, disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore clipboard permissions failure */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled}
      className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all duration-fast hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 disabled:opacity-50 touch-manipulation dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied ? 'Copiado!' : label}
    </button>
  );
}

export function GroupCampaignCard({
  template,
  groupLink,
  onTemplateChange,
  onGroupLinkChange,
}: GroupCampaignCardProps) {
  const qr = useQrDataUrl(groupLink);
  const hasLink = groupLink.trim().length > 0;
  const previewMessage = template
    .replace(/\{link\}/g, groupLink.trim() || '[link do grupo]')
    .replace(/\{nome\}/g, '');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 motion-safe:animate-in motion-safe:fade-in duration-fast">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
          <Users className="h-4 w-4" />
        </span>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Campanha do Grupo VIP no WhatsApp
        </h2>
      </div>

      <label
        htmlFor="group-link-input"
        className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
      >
        Link de convite do grupo
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="group-link-input"
            value={groupLink}
            onChange={(e) => onGroupLinkChange(e.target.value)}
            placeholder="https://chat.whatsapp.com/XXXXXXXXXXXX"
            aria-label="Link de convite do grupo"
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 transition-colors duration-fast dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <CopyButton text={groupLink.trim()} label="Copiar Link" disabled={!hasLink} />
      </div>
      <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
        No WhatsApp: abra o grupo → Dados do grupo → Convidar via link → Copiar link.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-[230px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
          {qr ? (
            <>
              <img
                src={qr}
                alt="QR Code do grupo de WhatsApp"
                className="h-[180px] w-[180px] rounded-lg shadow-2xs"
              />
              <a
                href={qr}
                download="grupo-concurso-ai-qr.png"
                className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#2E8C82] hover:text-[#26776f] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] dark:text-[#38b2a6]"
              >
                <Download className="h-3.5 w-3.5" />
                Baixar QR Code
              </a>
            </>
          ) : (
            <p className="px-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
              Cole o link do grupo para gerar o QR Code dinâmico (ideal para stories, cartazes e panfletos).
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <label
              htmlFor="template-textarea"
              className="text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Mensagem de convite personalizada
            </label>
          </div>
          <textarea
            id="template-textarea"
            value={template}
            onChange={(e) => onTemplateChange(e.target.value)}
            rows={8}
            aria-label="Mensagem de convite do WhatsApp"
            className="min-h-[140px] w-full rounded-xl border border-slate-300 bg-white p-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 transition-colors duration-fast dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <CopyButton text={previewMessage} label="Copiar Mensagem" />
            <button
              type="button"
              onClick={() => onTemplateChange(DEFAULT_WA_TEMPLATE)}
              className="min-h-[44px] inline-flex items-center text-xs font-bold text-[#2E8C82] hover:text-[#26776f] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] dark:text-[#38b2a6]"
            >
              Restaurar mensagem padrão
            </button>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Tags disponíveis:{' '}
              <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {'{link}'}
              </code>{' '}
              e{' '}
              <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {'{nome}'}
              </code>
              .
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
        <strong>Estratégia Anti-Bloqueio:</strong> Divulgue o link do grupo em canais abertos (bio do Instagram, stories, status e anúncios). Quem entra, ingressa por vontade própria — sem risco de banimento de número pelo WhatsApp. Para a base de leads abaixo, faça os disparos de forma <strong>humana e individual</strong>.
      </div>
    </div>
  );
}
