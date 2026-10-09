import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Contact as ContactIcon, Trash2, Upload, Loader2, Phone, Mail, MessageCircle } from 'lucide-react';
import { adminService, type Contact } from '@/features/admin/services/admin.service';
import {
  DEFAULT_WA_TEMPLATE,
  WA_TEMPLATE_KEY,
  applyTemplate,
  buildWhatsAppLink,
} from '@/features/admin/whatsapp';

function loadTemplate(): string {
  try {
    return localStorage.getItem(WA_TEMPLATE_KEY) ?? DEFAULT_WA_TEMPLATE;
  } catch {
    return DEFAULT_WA_TEMPLATE;
  }
}

export function AdminContactsPage() {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [template, setTemplate] = useState<string>(loadTemplate);

  const updateTemplate = (value: string) => {
    setTemplate(value);
    try {
      localStorage.setItem(WA_TEMPLATE_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: adminService.getContacts,
  });

  const importMutation = useMutation({
    mutationFn: () => adminService.importContacts(text, source.trim() || undefined),
    onSuccess: (res) => {
      setFeedback(`${res.imported} contato(s) importado(s) de ${res.parsed} detectado(s).`);
      setText('');
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteContact(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-contacts'] }),
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-gray-50 p-2 text-primary-600 dark:bg-gray-800">
          <ContactIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Possíveis Clientes</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Base de leads para gestão. {data ? `${data.total} contato(s) cadastrado(s).` : ''}
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
          rows={6}
          placeholder={'Nome,Telefone,Email\nMaria Silva,+55 61 99999-0000,maria@email.com'}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Origem (ex: lista-loja)"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:max-w-xs"
          />
          <button
            onClick={() => importMutation.mutate()}
            disabled={!text.trim() || importMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar
          </button>
        </div>
        {feedback && <p className="mt-3 text-sm text-green-600 dark:text-green-400">{feedback}</p>}
        {importMutation.isError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">Falha ao importar. Tente novamente.</p>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-2 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-green-600" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Mensagem pronta (WhatsApp)</h2>
        </div>
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          Use <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{'{nome}'}</code> para inserir o nome do contato.
          O botão de cada contato abre o WhatsApp com esta mensagem já escrita — você revisa e envia manualmente.
        </p>
        <textarea
          value={template}
          onChange={(e) => updateTemplate(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => updateTemplate(DEFAULT_WA_TEMPLATE)}
            className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            Restaurar mensagem padrão
          </button>
        </div>
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          Envie somente para quem consentiu, <strong>um contato por vez</strong>, e inclua sempre a opção de descadastro.
          Disparar a mesma mensagem para muitos números em sequência — mesmo manualmente — pode banir seu número no WhatsApp e infringir a LGPD.
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Contatos {data ? `(${data.total})` : ''}
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : !data || data.contacts.length === 0 ? (
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
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.contacts.map((c) => (
                  <ContactRow
                    key={c.id}
                    contact={c}
                    template={template}
                    onDelete={() => deleteMutation.mutate(c.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactRow({
  contact,
  template,
  onDelete,
}: {
  contact: Contact;
  template: string;
  onDelete: () => void;
}) {
  const waLink = buildWhatsAppLink(contact.phone, applyTemplate(template, contact));
  return (
    <tr className="text-gray-700 dark:text-gray-300">
      <td className="px-4 py-3">{contact.name ?? <span className="text-gray-400">—</span>}</td>
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
            title="Abrir conversa no WhatsApp com a mensagem pronta"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Abrir
          </a>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={onDelete}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
          title="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
