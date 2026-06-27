import { BookOpen, Brain, BarChart3, FileText } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Questões por IA',
    description: 'Gere questões inéditas com inteligência artificial no estilo da sua banca.',
  },
  {
    icon: BookOpen,
    title: 'Biblioteca de conteúdos',
    description: 'Organize disciplinas, assuntos e subassuntos em estrutura hierárquica.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard inteligente',
    description: 'Acompanhe seu desempenho com estatísticas detalhadas e gráficos.',
  },
  {
    icon: FileText,
    title: 'Importe seus materiais',
    description: 'PDFs, editais, leis e apostilas como contexto para gerar questões.',
  },
];

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          Concurso <span className="text-primary-600">AI</span>
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Plataforma inteligente para preparação de concursos públicos.
          Gere questões inéditas, estude no estilo da sua banca e acompanhe sua evolução.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <feature.icon className="mb-3 h-8 w-8 text-primary-600" />
              <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <button className="rounded-lg bg-primary-600 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700">
            Começar agora
          </button>
        </div>
      </div>
    </div>
  );
}
