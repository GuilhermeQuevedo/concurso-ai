import { BookOpen, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { isFeatureEnabled } from '@/config/feature-flags';

export function TermsOfUsePage() {
  const isAstryxActive = isFeatureEnabled('ASTRYX_SHELL');

  const containerBg = isAstryxActive
    ? 'astryx-theme bg-[var(--color-canvas)] text-[var(--color-text-primary)]'
    : 'bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100';

  const cardBorder = isAstryxActive
    ? 'border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated-1)]'
    : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900';

  const bannerBorder = isAstryxActive
    ? 'border-[var(--color-border-subtle)] bg-amber-500/10 text-amber-800 dark:text-amber-300'
    : 'border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300';

  const brandText = isAstryxActive
    ? 'text-[var(--color-brand-primary,#2E8C82)]'
    : 'text-primary-600 dark:text-primary-400';

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-fast ${containerBg}`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            to="/"
            className={`inline-flex items-center gap-2 text-sm font-medium ${brandText} hover:underline`}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>
        </div>

        <div className={`rounded-2xl border p-6 sm:p-10 shadow-sm ${cardBorder}`}>
          {/* Alerta Obrigatório de Minuta Jurídica */}
          <div className={`mb-8 rounded-xl border p-4 text-xs ${bannerBorder}`}>
            <strong>AVISO LEGAL:</strong> RASCUNHO — PENDENTE DE REVISÃO JURÍDICA. Este documento rege os termos
            gerais de contratação e uso da plataforma Engrama.
          </div>

          <div className="mb-8 flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-6">
            <div className="rounded-xl bg-[var(--color-brand-primary,#2E8C82)]/10 p-2.5 text-[var(--color-brand-primary,#2E8C82)]">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Termos de Uso</h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Versão 1.0 • Vigência: Novembro de 2026
              </p>
            </div>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-[var(--color-text-secondary)]">
            <section>
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-1">
                1. Objeto e Aceitação
              </h2>
              <p className="leading-relaxed">
                Estes Termos de Uso regulam o acesso e a utilização dos serviços oferecidos pela plataforma <strong>Engrama</strong>.
                Ao se cadastrar ou utilizar qualquer funcionalidade, o usuário declara ter lido, compreendido e aceito integralmente
                estas disposições.
              </p>
            </section>

            <section>
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-1">
                2. Regras de Uso Aceitável
              </h2>
              <p className="leading-relaxed">
                O usuário compromete-se a utilizar o Engrama exclusivamente para preparação educacional legítima. É estritamente vedado:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Compartilhar credenciais individuais com terceiros para acesso simultâneo.</li>
                <li>Utilizar robôs, scrapers ou rotinas automatizadas para extração massiva de questões e conteúdos da base.</li>
                <li>Submeter conteúdos com discurso de ódio, dados protegidos por sigilo judicial ou materiais ilegais nas redações e anotações.</li>
                <li>Tentar violar mecanismos de autenticação, criptografia ou limites de requisição da API.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-1">
                3. Propriedade Intelectual
              </h2>
              <p className="leading-relaxed">
                A marca, layout, códigos-fonte, algoritmos de repetição espaçada e organização de dados são de titularidade
                exclusiva do Engrama. O usuário mantém a titularidade dos textos de redações e anotações pessoais criados por ele
                na plataforma, outorgando ao Engrama licença estrita para processamento dos estudos.
              </p>
            </section>

            <section>
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-1">
                4. Conteúdo Gerado por Inteligência Artificial
              </h2>
              <p className="leading-relaxed">
                O Engrama utiliza modelos avançados de Inteligência Artificial para gerar explicações didáticas, flashcards,
                planos de estudo e correções preliminares de redação. O usuário reconhece que tais ferramentas possuem
                <strong> natureza de auxílio pedagógico</strong> e recomenda-se a confrontação com os editais e gabaritos
                oficiais das respectivas bancas examinadoras.
              </p>
            </section>

            <section>
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-1">
                5. Pagamentos, Assinaturas e Cancelamento
              </h2>
              <p className="leading-relaxed">
                As assinaturas conferem acesso ilimitado aos recursos Pro durante o período contratado. O cancelamento pode ser
                realizado a qualquer momento pelo usuário com interrupção de novas cobranças, preservando o acesso até o término
                do período vigente.
              </p>
            </section>

            <section>
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] mb-1">
                6. Foro de Eleição
              </h2>
              <p className="leading-relaxed">
                Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial pelo Código de Defesa do Consumidor
                (Lei 8.078/1990) e pelo Marco Civil da Internet (Lei 12.965/2014). Fica eleito o foro do domicílio do consumidor
                para dirimir quaisquer litígios decorrentes deste instrumento.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
