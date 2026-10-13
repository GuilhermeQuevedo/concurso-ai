export interface TourStep {
  selector?: string;
  path?: string;
  title: string;
  text: string;
  placement?: 'auto' | 'center';
}

export const TOUR_STEPS: TourStep[] = [
  {
    placement: 'center',
    title: 'Bem-vindo ao Engrama! 👋',
    text: 'Em menos de 1 minuto eu te mostro o essencial pra você já começar a estudar. Pode pular quando quiser.',
  },
  {
    selector: '[data-tour="/dashboard"]',
    path: '/dashboard',
    title: 'Visão Geral',
    text: 'Seu ponto de partida: aqui você acompanha metas, revisões do dia e sua evolução.',
  },
  {
    selector: '[data-tour="metas"]',
    path: '/dashboard',
    title: 'Meta diária',
    text: 'Defina quantas questões quer fazer por dia e acompanhe o progresso. É só clicar em "editar".',
  },
  {
    selector: '[data-tour="revisoes"]',
    path: '/dashboard',
    title: 'Revisões de hoje',
    text: 'As revisões dos tópicos do seu edital que vencem hoje aparecem aqui. Marque "Revisei" ao concluir.',
  },
  {
    selector: '[data-tour="pomodoro"]',
    path: '/dashboard',
    title: 'Pomodoro',
    text: 'Estude com foco em blocos de tempo. Inicie um ciclo de 25 minutos e dê pausas.',
  },
  {
    selector: '[data-tour="constancia"]',
    path: '/dashboard',
    title: 'Constância',
    text: 'Seu mapa de ofensiva: cada dia que você estuda pinta um quadradinho. Mantenha a sequência!',
  },
  {
    selector: '[data-tour="/contests"]',
    title: 'Meus Objetivos (o coração)',
    text: 'Suba o edital aqui. Cada tópico ganha revisão espaçada automática e um score de prioridade pra você saber o que estudar primeiro.',
  },
  {
    selector: '[data-tour="/generate"]',
    title: 'Gerar Questões',
    text: 'A IA cria questões no estilo da sua banca — inclusive a partir das suas próprias anotações.',
  },
  {
    selector: '[data-tour="/flashcards"]',
    title: 'Flashcards',
    text: 'Gere flashcards automáticos do que você estuda e revise no estilo Anki (Esqueci/Difícil/Bom/Fácil).',
  },
  {
    selector: '[data-tour="/essays"]',
    title: 'Redações',
    text: 'Envie sua redação e receba correção detalhada da IA — incluindo estudo de caso no estilo banca.',
  },
  {
    selector: '[data-tour="/memory-simulator"]',
    title: 'Simulador de Memória',
    text: 'Veja a curva do esquecimento e escolha o melhor plano de revisões pro seu perfil.',
  },
  {
    selector: '[data-tour="help"]',
    title: 'Ajuda sempre à mão',
    text: 'Dúvida em qualquer momento? Clique aqui para a Central de Ajuda — e você pode refazer este tour quando quiser.',
  },
  {
    placement: 'center',
    title: 'Pronto pra começar! 🚀',
    text: 'Dica de ouro: suba seu edital em "Meus Objetivos" e deixe a plataforma montar suas revisões. Bons estudos!',
  },
];
