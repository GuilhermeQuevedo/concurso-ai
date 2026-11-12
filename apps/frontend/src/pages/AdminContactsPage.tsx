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
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

const PAGE_SIZE = 50;

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
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-gray-50 p-2 text-primary-600 dark:bg-gray-800">
          <ContactIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Possíveis Clientes</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Base de leads para gestão. {data ? `${totalContacts} contato(s) cadastrado(s).` : ''}
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
        Use esta base apenas para contato com consentimento (follow-up de quem comprou ou leads opt-in).
        Disparo automático em massa para lista fria viola a LGPD e os termos do WhatsApp (risco de banimento do número).
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Importar contatos</h2>
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          Cole CSV ou texto (um por linha). Detecta automaticamente nome, telefone e e-mail.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={'Nome,Telefone,Email\nMaria Silva,+55 61 99999-0000,maria@email.com'}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Origem da lista</label>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Origem (ex: leads-webinar, lista-loja)"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Base Legal (Art. 7º LGPD)</label>
            <select
              value={legalBasis}
              onChange={(e) => setLegalBasis(e.target.value as 'CONSENT' | 'LEGITIMATE_INTEREST' | 'PRE_CONTRACTUAL')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="CONSENT">Consentimento do Titular (Opt-in)</option>
              <option value="PRE_CONTRACTUAL">Diligências Pré-Contratuais</option>
              <option value="LEGITIMATE_INTEREST">Legítimo Interesse (com LIA)</option>
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Comprovação de Consentimento / Notas de Origem (mínimo 10 caracteres)
          </label>
          <input
            value={consentNotes}
            onChange={(e) => setConsentNotes(e.target.value)}
            placeholder="Ex.: Formulário landing page com checkbox de consentimento registrado"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={() => importMutation.mutate()}
            disabled={!text.trim() || consentNotes.trim().length < 10 || importMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar
          </button>
        </div>

        {feedback && <p className="mt-3 text-sm text-green-600 dark:text-green-400">{feedback}</p>}
        {importMutation.isError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">Falha ao importar contatos. Verifique os dados e tente novamente.</p>
        )}
      </div>

      <div className="mt-6">
        <GroupCampaignCard
          template={template}
          groupLink={groupLink}
          onTemplateChange={updateTemplate}
          onGroupLinkChange={updateGroupLink}
        />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Contatos ({totalContacts})
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="rounded-lg border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="rounded-lg border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400 dark:border-gray-700">
            Nenhum contato ainda. Importe sua lista acima.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Telefone</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {contacts.map((c) => (
                  <ContactRow
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

interface ContactRowProps {
  contact: Contact;
  isRevealed: boolean;
  template: string;
  groupLink: string;
  onOpenReveal: () => void;
  onDelete: () => void;
}

function ContactRow({
  contact,
  isRevealed,
  template,
  groupLink,
  onOpenReveal,
  onDelete,
}: ContactRowProps) {
  const waLink = buildWhatsAppLink(contact.phone, applyTemplate(template, contact, groupLink));
  return (
    <tr className="text-gray-700 dark:text-gray-300">
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
        {contact.name ?? <span className="text-gray-400">—</span>}
      </td>
      <td className="px-4 py-3">
        {contact.phone ? (
          <span className="inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            {contact.phone}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
        {contact.email ? (
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            {contact.email}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{contact.source ?? '—'}</td>
      <td className="px-4 py-3">
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
            title="Abrir conversa no WhatsApp com o convite pronto"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Convidar
          </a>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {isRevealed ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenReveal}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
              title="Revelar dados pessoais com auditoria"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            title="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
