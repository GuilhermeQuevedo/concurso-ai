import { useNavigate } from 'react-router';
import { BookOpen, Users, Sparkles, Layers, Trophy } from 'lucide-react';
import { EngramaLogo } from '@/components/EngramaLogo';

const features = [
  {
    icon: Sparkles,
    title: 'Questões com IA',
    description: 'Gere questões inéditas no estilo da sua banca usando inteligência artificial.',
  },
  {
    icon: Users,
    title: 'Competição com amigos',
    description: 'Crie grupos e dispute rankings semanais de estudo com seus colegas.',
  },
  {
    icon: Layers,
    title: 'Flashcards inteligentes',
    description: 'Cards de estudo que repetem mais o que você erra e menos o que já sabe.',
  },
  {
    icon: Trophy,
    title: 'Conquistas e streaks',
    description: 'Ganhe conquistas, mantenha seu streak e acompanhe sua evolução.',
  },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <EngramaLogo className="h-10 w-10 text-primary-600" />
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            engrama
          </h1>
        </div>

        <p className="mx-auto mb-2 max-w-xl text-xl font-semibold text-primary-600">
          O que você estuda, fica.
        </p>
        <p className="mx-auto mb-2 max-w-xl text-base text-gray-600 dark:text-gray-400">
          Plataforma de estudos para concursos que usa a ciência da memória para você aprender e não esquecer.
        </p>
        <p className="mx-auto mb-10 max-w-xl text-sm text-gray-500 dark:text-gray-500">
          Projeto em fase de testes — uso gratuito e sem fins comerciais.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-200 bg-white p-5 text-left transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <feature.icon className="mb-2 h-6 w-6 text-primary-600" />
              <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/register')}
            className="rounded-lg bg-primary-600 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Criar conta grátis
          </button>
          <button
            onClick={() => navigate('/login')}
            className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Entrar
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400 dark:text-gray-600">
          Feito com <BookOpen className="inline h-3 w-3" /> para quem estuda.
        </p>
      </div>
    </div>
  );
}
