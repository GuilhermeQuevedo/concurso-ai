import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Users, Copy, Check, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { DEFAULT_WA_TEMPLATE } from '@/features/admin/whatsapp';

interface GroupCampaignCardProps {
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
      .then((url) => active && setQr(url))
      .catch(() => active && setQr(null));
    return () => {
      active = false;
    };
  }, [value]);
  return qr;
}

function CopyButton({ text, label, disabled }: { text: string; label: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      onClick={copy}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copiado!' : label}
    </button>
  );
}

export function GroupCampaignCard({ template, groupLink, onTemplateChange, onGroupLinkChange }: GroupCampaignCardProps) {
  const qr = useQrDataUrl(groupLink);
  const hasLink = groupLink.trim().length > 0;
  const previewMessage = template.replace(/\{link\}/g, groupLink.trim() || '[link do grupo]').replace(/\{nome\}/g, '');

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-5 w-5 text-green-600" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Campanha do Grupo no WhatsApp</h2>
      </div>

      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Link de convite do grupo</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={groupLink}
            onChange={(e) => onGroupLinkChange(e.target.value)}
            placeholder="https://chat.whatsapp.com/XXXXXXXXXXXX"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <CopyButton text={groupLink.trim()} label="Copiar link" disabled={!hasLink} />
      </div>
      <p className="mt-1 text-[11px] text-gray-400">
        No WhatsApp: abra o grupo → Dados do grupo → Convidar via link → Copiar link.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-700">
          {qr ? (
            <>
              <img src={qr} alt="QR Code do grupo" className="h-[180px] w-[180px]" />
              <a
                href={qr}
                download="grupo-concurso-ai-qr.png"
                className="mt-2 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                Baixar QR Code
              </a>
            </>
          ) : (
            <p className="px-2 text-center text-xs text-gray-400">
              Cole o link do grupo para gerar o QR Code (use em stories, posts e panfletos).
            </p>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-600" />
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Mensagem de convite</label>
          </div>
          <textarea
            value={template}
            onChange={(e) => onTemplateChange(e.target.value)}
            rows={9}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CopyButton text={previewMessage} label="Copiar mensagem" />
            <button
              onClick={() => onTemplateChange(DEFAULT_WA_TEMPLATE)}
              className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              Restaurar mensagem padrão
            </button>
            <span className="text-[11px] text-gray-400">
              Use <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{'{link}'}</code> e{' '}
              <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{'{nome}'}</code>.
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
        <strong>Estratégia:</strong> espalhe o link do grupo em canais abertos (bio do Instagram, stories, status do WhatsApp, posts, anúncios).
        Quem entra, entra por vontade própria — sem risco de banimento. A conversão para assinatura acontece dentro do grupo, entregando valor.
        Para a lista de contatos abaixo, envie o convite <strong>manualmente, um por vez</strong>.
      </div>
    </div>
  );
}
