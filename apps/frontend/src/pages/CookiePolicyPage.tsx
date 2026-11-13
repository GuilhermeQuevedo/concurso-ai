import { Cookie, ArrowLeft, Settings2 } from 'lucide-react';
import { Link } from 'react-router';
import { useCookieConsent } from '@/features/privacy/hooks/useCookieConsent';

export function CookiePolicyPage() {
  const { openPreferences, consent } = useCookieConsent();

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
          {/* Aviso Legal Obrigatório */}
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            <strong>AVISO LEGAL:</strong> RASCUNHO — PENDENTE DE REVISÃO JURÍDICA. Este documento foi gerado
            para fins de conformidade técnica com as diretrizes da Autoridade Nacional de Proteção de Dados (ANPD)
            e o Art. 18 da Lei 13.709/2018 (LGPD).
          </div>

          <div className="mb-8 flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-6 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
                <Cookie className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Política de Cookies e Armazenamento Local</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Última atualização: {consent?.timestamp ? new Date(consent.timestamp).toLocaleDateString('pt-BR') : 'Novembro de 2026'} • Versão consent_v1
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openPreferences}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
            >
              <Settings2 className="h-4 w-4" />
              <span>Alterar minhas preferências</span>
            </button>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">1. O que são Cookies?</h2>
              <p className="text-xs leading-relaxed">
                Cookies e identificadores de armazenamento local são pequenos arquivos de texto ou dados gravados no
                seu dispositivo (navegador) quando você visita o Engrama. Eles servem para viabilizar funcionalidades essenciais
                como sua sessão logada com segurança, lembrar preferências de modo claro/escuro e monitorar a integridade
                do serviço.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">2. Base Legal na LGPD</h2>
              <p className="text-xs leading-relaxed">
                O tratamento de dados associado a cookies essenciais apoia-se no <strong>Legítimo Interesse</strong> e no
                cumprimento da execução do contrato de serviço (Art. 7º, V e IX da LGPD). Os cookies analíticos ou de marketing
                somente são disparados com base no seu <strong>Consentimento Livre e Informado</strong> (Art. 7º, I da LGPD).
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">3. Tabela de Cookies e Identificadores Utilizados</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-200 text-left text-xs dark:divide-gray-800">
                  <thead className="bg-gray-50 font-semibold text-gray-900 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="px-3.5 py-3">Nome</th>
                      <th className="px-3.5 py-3">Provedor</th>
                      <th className="px-3.5 py-3">Finalidade</th>
                      <th className="px-3.5 py-3">Tipo</th>
                      <th className="px-3.5 py-3">Duração</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-[11px]">accessToken</td>
                      <td className="px-3.5 py-2.5">Engrama (Primeira Parte)</td>
                      <td className="px-3.5 py-2.5">Token JWT de autenticação e controle de sessão do usuário.</td>
                      <td className="px-3.5 py-2.5">
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Necessário
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">15 minutos</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-[11px]">refreshToken</td>
                      <td className="px-3.5 py-2.5">Engrama (Primeira Parte)</td>
                      <td className="px-3.5 py-2.5">Renovação segura de tokens sem deslogar o aluno.</td>
                      <td className="px-3.5 py-2.5">
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Necessário
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">7 dias</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-[11px]">theme</td>
                      <td className="px-3.5 py-2.5">Engrama (Local Storage)</td>
                      <td className="px-3.5 py-2.5">Armazena a preferência de Modo Escuro ou Claro.</td>
                      <td className="px-3.5 py-2.5">
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Necessário
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">Persistente</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-[11px]">engrama_cookie_consent</td>
                      <td className="px-3.5 py-2.5">Engrama (Local Storage)</td>
                      <td className="px-3.5 py-2.5">Registra as escolhas e o consentimento do titular (LGPD).</td>
                      <td className="px-3.5 py-2.5">
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Necessário
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">1 ano</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-[11px]">_ga, _ga_*</td>
                      <td className="px-3.5 py-2.5">Google Analytics (Opcional)</td>
                      <td className="px-3.5 py-2.5">Métricas de tráfego agregado e navegação para aprimoramento da plataforma.</td>
                      <td className="px-3.5 py-2.5">
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Analítico
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">2 anos</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-mono text-[11px]">_fbp, ads_*</td>
                      <td className="px-3.5 py-2.5">Redes de Anúncios (Opcional)</td>
                      <td className="px-3.5 py-2.5">Avaliação de campanhas de captação de novos concurseiros.</td>
                      <td className="px-3.5 py-2.5">
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          Marketing
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">90 dias</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">4. Como Revogar ou Modificar seu Consentimento</h2>
              <p className="text-xs leading-relaxed">
                Você pode revogar ou alterar suas escolhas a qualquer momento clicando no botão "Alterar minhas preferências"
                acima ou acessando a aba Configurações da sua conta. Além disso, você pode desativar ou apagar cookies
                diretamente pelas configurações de segurança do seu próprio navegador.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
