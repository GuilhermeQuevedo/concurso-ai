import { Shield, ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* Alerta de Minuta Jurídica Obrigatório */}
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            <strong>AVISO LEGAL:</strong> RASCUNHO — PENDENTE DE REVISÃO JURÍDICA. Este documento foi elaborado
            para atendimento às exigências de transparência da Lei Geral de Proteção de Dados (Lei 13.709/2018 - LGPD).
          </div>

          <div className="mb-8 flex items-center gap-3 border-b border-gray-100 pb-6 dark:border-gray-800">
            <div className="rounded-xl bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Política de Privacidade</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Versão 1.0 • Vigência: Novembro de 2026 • Em conformidade com a Lei 13.709/2018 (LGPD)
              </p>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
            <section>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">1. Identificação do Controlador e Encarregado (DPO)</h2>
              <p className="leading-relaxed">
                O <strong>Engrama</strong> (Engrama Tecnologia Educacional Ltda.) atua na qualidade de <strong>Controlador</strong> dos
                dados pessoais coletados na plataforma.
              </p>
              <div className="mt-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60 flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary-600 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-xs">Canal do Encarregado de Proteção de Dados (DPO):</p>
                  <a href="mailto:dpo@engrama.com.br" className="text-primary-600 underline font-mono text-xs">
                    dpo@engrama.com.br
                  </a>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">2. Finalidades do Tratamento e Bases Legais</h2>
              <p className="leading-relaxed mb-3">
                Todo tratamento de dados pessoais realizado pelo Engrama possui respaldo estrito nas hipóteses do Art. 7º da LGPD:
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-200 text-left text-xs dark:divide-gray-800">
                  <thead className="bg-gray-50 font-semibold text-gray-900 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="px-3.5 py-2.5">Finalidade</th>
                      <th className="px-3.5 py-2.5">Dados Coletados</th>
                      <th className="px-3.5 py-2.5">Base Legal (LGPD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    <tr>
                      <td className="px-3.5 py-2">Cadastro e autenticação do estudante</td>
                      <td className="px-3.5 py-2">Nome, e-mail, senha criptografada, telefone (opcional)</td>
                      <td className="px-3.5 py-2 font-medium">Execução de Contrato (Art. 7º, V)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2">Processamento de pagamentos e assinaturas</td>
                      <td className="px-3.5 py-2">Valor, moeda, status da transação, dados de faturamento</td>
                      <td className="px-3.5 py-2 font-medium">Cumprimento de Obrigação Legal e Contrato (Art. 7º, II e V)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2">Personalização pedagógica por Inteligência Artificial</td>
                      <td className="px-3.5 py-2">Respostas de simulados, redações, temas de estudo e métricas</td>
                      <td className="px-3.5 py-2 font-medium">Execução de Contrato (Art. 7º, V)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2">Prevenção a fraudes, segurança e auditoria interna</td>
                      <td className="px-3.5 py-2">Logs de auditoria, hash de IP, user-agent</td>
                      <td className="px-3.5 py-2 font-medium">Legítimo Interesse e Segurança (Art. 7º, IX e Art. 11, II, g)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2">Métricas de navegação e cookies analíticos</td>
                      <td className="px-3.5 py-2">Identificadores agregados anônimos</td>
                      <td className="px-3.5 py-2 font-medium">Consentimento Livre e Informado (Art. 7º, I)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">3. Prazos de Retenção e Descarte de Dados</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-200 text-left text-xs dark:divide-gray-800">
                  <thead className="bg-gray-50 font-semibold text-gray-900 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="px-3.5 py-2.5">Categoria de Dado</th>
                      <th className="px-3.5 py-2.5">Prazo de Guarda</th>
                      <th className="px-3.5 py-2.5">Fundamentação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    <tr>
                      <td className="px-3.5 py-2">Dados de Estudo e Resoluções</td>
                      <td className="px-3.5 py-2">Durante a vigência da conta</td>
                      <td className="px-3.5 py-2">Eliminados imediatamente quando solicitada a exclusão de conta.</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2">Registros Fiscais de Pagamento</td>
                      <td className="px-3.5 py-2">5 anos</td>
                      <td className="px-3.5 py-2">Preservados de forma anonimizada conforme Arts. 173 e 174 do CTN e Art. 16, I da LGPD.</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2">Logs de Acesso e Auditoria</td>
                      <td className="px-3.5 py-2">6 meses a 1 ano</td>
                      <td className="px-3.5 py-2">Art. 15 do Marco Civil da Internet (Lei 12.965/2014).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">4. Subprocessadores e Compartilhamento de Dados</h2>
              <p className="leading-relaxed">
                O Engrama não comercializa dados pessoais. O compartilhamento ocorre exclusivamente com parceiros tecnológicos
                estritamente necessários para a prestação do serviço:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>OpenAI:</strong> Processamento de prompts e tutoria adaptativa de IA. Seus dados não são usados para treinar modelos públicos.</li>
                <li><strong>Stripe:</strong> Gateway de pagamento seguro com certificação PCI-DSS.</li>
                <li><strong>Google LLC:</strong> Autenticação federada (OAuth) e sincronização opcional de cronogramas via Google Calendar.</li>
                <li><strong>Provedores de Nuvem e Banco de Dados:</strong> Hospedagem segura de infraestrutura com criptografia em trânsito e em repouso.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">5. Seus Direitos como Titular (Art. 18 da LGPD)</h2>
              <p className="leading-relaxed">
                Você pode exercer diretamente qualquer um dos seus direitos legais a qualquer momento:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
                <div className="rounded-lg border border-gray-100 p-3 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30">
                  <p className="font-semibold text-gray-900 dark:text-white text-xs">Exportação e Portabilidade (DSAR)</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Baixe todos os seus dados em formato JSON em Configurações &gt; Exportar meus dados.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30">
                  <p className="font-semibold text-gray-900 dark:text-white text-xs">Eliminação e Anonimização</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Exclua sua conta definitivamente em Configurações &gt; Excluir minha conta.
                  </p>
                </div>
              </div>
              <p className="leading-relaxed text-xs">
                Para requisições adicionais, entre em contato direto pelo e-mail{' '}
                <a href="mailto:dpo@engrama.com.br" className="text-primary-600 underline">dpo@engrama.com.br</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
