import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Contact as ContactIcon,
  Trash2,
  Upload,
  Loader2,
  Phone,
  Mail,
  MessageCircle,
  Eye,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { adminService, type Contact } from '@/features/admin/services/admin.service';
import { RevealPiiModal } from '@/features/admin/components/RevealPiiModal';
import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';
import {
  DEFAULT_WA_TEMPLATE,
  WA_TEMPLATE_KEY,
  WA_GROUP_LINK_KEY,
  applyTemplate,
  buildWhatsAppLink,
} from '@/features/admin/whatsapp';
import { GroupCampaignCard } from '@/features/admin/components/GroupCampaignCard';

function loadStored(key: string, fallback: string): string {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) ?? fallback : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: string) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    /* ignore */
  }
}

const PAGE_SIZE = 50;

const FIELD_BASE =
  'min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 transition-colors duration-fast dark:border-slate-700 dark:bg-slate-800 dark:text-white';

export function AdminContactsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState<number>(1);
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [legalBasis, setLegalBasis] = useState<'CONSENT' | 'LEGITIMATE_INTEREST' | 'PRE_CONTRACTUAL'>('CONSENT');
  const [consentNotes, setConsentNotes] = useState('Importação manual de contatos com consentimento prévio dos titulares');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [template, setTemplate] = useState<string>(() => loadStored(WA_TEMPLATE_KEY, DEFAULT_WA_TEMPLATE));
  const [groupLink, setGroupLink] = useState<string>(() => loadStored(WA_GROUP_LINK_KEY, ''));

  const [selectedContactToReveal, setSelectedContactToReveal] = useState<Contact | null>(null);
  const [revealedContacts, setRevealedContacts] = useState<Record<string, Contact>>({});

  const updateTemplate = (value: string) => {
    setTemplate(value);
    persist(WA_TEMPLATE_KEY, value);
  };

  const updateGroupLink = (value: string) => {
    setGroupLink(value);
    persist(WA_GROUP_LINK_KEY, value);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contacts', page],
    queryFn: () => adminService.getContacts(page, PAGE_SIZE),
  });

  const importMutation = useMutation({
    mutationFn: () =>
      adminService.importContacts({
        text,
        source: source.trim() || undefined,
        legalBasis,
        consentProofNotes: consentNotes.trim(),
      }),
    onSuccess: (res) => {
      setFeedback(
        `${res.imported} contato(s) importado(s) com sucesso de ${res.parsed} detectado(s).${
          res.skippedSuppressed ? ` (${res.skippedSuppressed} pulados por supressão/opt-out)` : ''
        }`,
      );
      setText('');
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Falha ao importar contatos.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteContact(id),
    onSuccess: () => {
      toast.success('Contato removido.');
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Erro ao remover contato.'));
    },
  });

  const revealMutation = useMutation({
    mutationFn: async ({ contactId, justification }: { contactId: string; justification: string }) => {
      return adminService.revealContact(contactId, justification);
    },
    onSuccess: (unmasked) => {
      setRevealedContacts((prev) => ({ ...prev, [unmasked.id]: unmasked }));
      setSelectedContactToReveal(null);
      toast.success('Dados do contato revelados e auditoria registrada.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Falha ao revelar dados do contato.'));
    },
  });

  const totalContacts = data?.pagination?.total ?? (data as { total?: number } | undefined)?.total ?? data?.contacts?.length ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const rawContacts = data?.contacts ?? [];
  const contacts = rawContacts.map((c) => revealedContacts[c.id] ?? c);

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-fast">
      {/* Page Header */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
          <ContactIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Possíveis Clientes & CRM
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Base de leads para gestão e prospecção ativa em conformidade com a LGPD. {data ? `${totalContacts} contato(s) cadastrado(s).` : ''}
          </p>
        </div>
      </div>

      {/* LGPD Safety Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        <ShieldAlert className="h-5 w-5 shrink-0 text-[#F2A93B] mt-0.5" />
        <div className="leading-relaxed">
          <strong>Diretriz Regulatória e Anti-Bloqueio:</strong> Utilize esta base apenas com consentimento explícito prévio ou relacionamento pré-contratual. Disparo automático em massa para lista fria viola a LGPD e acarreta banimento do número pelo WhatsApp.
        </div>
      </div>

      {/* Contacts Import Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2">
          <Upload className="h-4 w-4 text-[#2E8C82]" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Importar contatos (CSV ou Lista)
          </h2>
        </div>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Cole CSV ou texto corrido (um por linha). O sistema detecta automaticamente nome, telefone e e-mail.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={'Nome,Telefone,Email\nMaria Silva,+55 61 99999-0000,maria@email.com'}
          aria-label="Conteúdo CSV ou texto para importação"
          className="min-h-[120px] w-full rounded-xl border border-slate-300 bg-white p-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 transition-colors duration-fast dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="source-input"
              className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Origem da lista
            </label>
            <input
              id="source-input"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Origem (ex: leads-webinar, lista-loja)"
              className={`${FIELD_BASE} w-full`}
            />
          </div>
          <div>
            <label
              htmlFor="legal-basis-select"
              className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Base Legal (Art. 7º LGPD)
            </label>
            <select
              id="legal-basis-select"
              value={legalBasis}
              onChange={(e) => setLegalBasis(e.target.value as 'CONSENT' | 'LEGITIMATE_INTEREST' | 'PRE_CONTRACTUAL')}
              className={`${FIELD_BASE} w-full`}
            >
              <option value="CONSENT">Consentimento do Titular (Opt-in)</option>
              <option value="PRE_CONTRACTUAL">Diligências Pré-Contratuais</option>
              <option value="LEGITIMATE_INTEREST">Legítimo Interesse (com LIA)</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="consent-notes-input"
            className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Comprovação de Consentimento / Notas de Origem (mínimo 10 caracteres)
          </label>
          <input
            id="consent-notes-input"
            value={consentNotes}
            onChange={(e) => setConsentNotes(e.target.value)}
            placeholder="Ex.: Formulário landing page com checkbox de consentimento registrado"
            className={`${FIELD_BASE} w-full`}
          />
        </div>

        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            onClick={() => importMutation.mutate()}
            disabled={!text.trim() || consentNotes.trim().length < 10 || importMutation.isPending}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast disabled:opacity-50 shadow-xs touch-manipulation"
          >
            {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar Contatos
          </button>
        </div>

        {feedback && (
          <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {feedback}
          </p>
        )}
        {importMutation.isError && (
          <p className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
            Falha ao importar contatos. Verifique os dados e tente novamente.
          </p>
        )}
      </div>

      {/* WhatsApp Campaign Configuration Card */}
      <GroupCampaignCard
        template={template}
        groupLink={groupLink}
        onTemplateChange={updateTemplate}
        onGroupLinkChange={updateGroupLink}
      />

      {/* Contacts Table Section */}
      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Contatos Cadastrados ({totalContacts})
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Página <strong className="text-slate-800 dark:text-slate-200">{page}</strong> de {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-300 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast touch-manipulation dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-300 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast touch-manipulation dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16" role="status" aria-label="Carregando lista de contatos">
            <Loader2 className="h-8 w-8 animate-spin text-[#2E8C82]" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nenhum contato cadastrado ainda. Importe sua lista pelo formulário acima.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">Nome</th>
                  <th className="px-5 py-3.5">Telefone</th>
                  <th className="px-5 py-3.5">E-mail</th>
                  <th className="px-5 py-3.5">Origem</th>
                  <th className="px-5 py-3.5">WhatsApp</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contacts.map((c) => (
                  <ContactTableRow
                    key={c.id}
                    contact={c}
                    isRevealed={!!revealedContacts[c.id]}
                    template={template}
                    groupLink={groupLink}
                    onOpenReveal={() => setSelectedContactToReveal(c)}
                    onDelete={() => deleteMutation.mutate(c.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LGPD Contact PII Reveal Modal */}
      <RevealPiiModal
        isOpen={!!selectedContactToReveal}
        title="Visualizar Dados do Contato"
        targetName={selectedContactToReveal?.name ?? selectedContactToReveal?.email ?? 'Contato'}
        isPending={revealMutation.isPending}
        onClose={() => setSelectedContactToReveal(null)}
        onConfirm={(justification) => {
          if (selectedContactToReveal) {
            revealMutation.mutate({ contactId: selectedContactToReveal.id, justification });
          }
        }}
      />
    </div>
  );
}

interface ContactTableRowProps {
  contact: Contact;
  isRevealed: boolean;
  template: string;
  groupLink: string;
  onOpenReveal: () => void;
  onDelete: () => void;
}

function ContactTableRow({
  contact,
  isRevealed,
  template,
  groupLink,
  onOpenReveal,
  onDelete,
}: ContactTableRowProps) {
  const waLink = buildWhatsAppLink(contact.phone, applyTemplate(template, contact, groupLink));

  return (
    <tr className="text-slate-700 hover:bg-slate-50/70 dark:text-slate-300 dark:hover:bg-slate-800/40 transition-colors duration-fast">
      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
        {contact.name ?? <span className="text-slate-400 font-normal">—</span>}
      </td>
      <td className="px-5 py-3.5">
        {contact.phone ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            {contact.phone}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-5 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-400">
        {contact.email ? (
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {contact.email}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
        {contact.source ?? '—'}
      </td>
      <td className="px-5 py-3.5">
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 transition-all duration-fast touch-manipulation"
            title="Abrir conversa no WhatsApp com o convite pronto"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Convidar
          </a>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {isRevealed ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenReveal}
              className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Revelar dados pessoais com auditoria imutável"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95 transition-all duration-fast dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
            title="Remover lead"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
