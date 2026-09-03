export interface EssayTheme {
  category: string;
  theme: string;
  command: string;
  aspects: string;
}

export const ESSAY_THEMES: EssayTheme[] = [
  {
    category: 'Gestão pública / Trabalho',
    theme: 'Os desafios para a promoção da saúde mental no ambiente de trabalho no Brasil.',
    command:
      'Redija um texto dissertativo-argumentativo discutindo os fatores que agravam o adoecimento mental no trabalho e apresentando propostas para enfrentar o problema.',
    aspects:
      'Identificar causas (sobrecarga, assédio, precarização, cultura da produtividade); relacionar a impactos sociais e econômicos; propor medidas viáveis (políticas de prevenção, papel das instituições, legislação).',
  },
  {
    category: 'Tecnologia e sociedade',
    theme: 'Os impactos da inteligência artificial sobre o emprego e a qualificação profissional.',
    command:
      'Redija um texto dissertativo-argumentativo analisando os efeitos da IA no mercado de trabalho e propondo caminhos para lidar com essa transformação.',
    aspects:
      'Reconhecer automação e substituição de funções; ponderar oportunidades e riscos; propor requalificação, regulação e responsabilidade do Estado e das empresas.',
  },
  {
    category: 'Cidadania e direitos',
    theme: 'O combate à desinformação como condição para o fortalecimento da democracia.',
    command:
      'Redija um texto dissertativo-argumentativo discutindo os efeitos da desinformação sobre a vida democrática e apresentando propostas de enfrentamento.',
    aspects:
      'Caracterizar o problema (fake news, redes sociais, polarização); relacionar a riscos à democracia e a direitos; propor educação midiática, regulação e responsabilidade das plataformas.',
  },
  {
    category: 'Gestão pública',
    theme: 'A transparência como instrumento de eficiência e controle na administração pública.',
    command:
      'Redija um texto dissertativo-argumentativo defendendo a importância da transparência na gestão pública e indicando meios de fortalecê-la.',
    aspects:
      'Conceituar transparência e controle social; relacionar a combate à corrupção e boa aplicação de recursos; propor mecanismos (dados abertos, participação, fiscalização).',
  },
  {
    category: 'Meio ambiente',
    theme: 'Os desafios do acesso à água potável e da gestão sustentável dos recursos hídricos no Brasil.',
    command:
      'Redija um texto dissertativo-argumentativo analisando os obstáculos ao acesso à água e propondo soluções sustentáveis.',
    aspects:
      'Apontar desigualdade de acesso, desperdício e crise hídrica; relacionar a saúde, economia e meio ambiente; propor infraestrutura, educação ambiental e políticas públicas.',
  },
  {
    category: 'Cidadania e direitos',
    theme: 'A efetivação dos direitos das pessoas com deficiência na sociedade brasileira.',
    command:
      'Redija um texto dissertativo-argumentativo discutindo as barreiras à inclusão de pessoas com deficiência e apresentando propostas para superá-las.',
    aspects:
      'Identificar barreiras (acessibilidade, mercado de trabalho, preconceito); relacionar a cidadania e dignidade; propor políticas de inclusão, fiscalização da legislação e conscientização.',
  },
  {
    category: 'Gestão pública / Saúde',
    theme: 'Os desafios do envelhecimento da população brasileira para as políticas públicas.',
    command:
      'Redija um texto dissertativo-argumentativo analisando os impactos do envelhecimento populacional e propondo medidas de adaptação.',
    aspects:
      'Reconhecer a transição demográfica; relacionar a previdência, saúde e cuidado; propor políticas de amparo ao idoso e sustentabilidade dos sistemas públicos.',
  },
  {
    category: 'Tecnologia e sociedade',
    theme: 'A proteção de dados pessoais como direito fundamental na era digital.',
    command:
      'Redija um texto dissertativo-argumentativo discutindo a importância da proteção de dados e os desafios para garanti-la.',
    aspects:
      'Caracterizar coleta e uso de dados; relacionar a privacidade e segurança; propor aplicação da LGPD, educação digital e responsabilização.',
  },
  {
    category: 'Educação',
    theme: 'As causas e consequências da evasão escolar no Brasil.',
    command:
      'Redija um texto dissertativo-argumentativo discutindo os fatores que levam à evasão escolar e apresentando propostas para reduzi-la.',
    aspects:
      'Identificar causas (vulnerabilidade social, trabalho precoce, desmotivação); relacionar a desigualdade e futuro do país; propor políticas de permanência, apoio às famílias e valorização da escola.',
  },
  {
    category: 'Cidades / Meio ambiente',
    theme: 'Os desafios da mobilidade urbana sustentável nas cidades brasileiras.',
    command:
      'Redija um texto dissertativo-argumentativo analisando os problemas de mobilidade urbana e propondo alternativas sustentáveis.',
    aspects:
      'Apontar congestionamento, poluição e transporte precário; relacionar a qualidade de vida e meio ambiente; propor transporte coletivo, incentivo a modais limpos e planejamento urbano.',
  },
];

// Sorteia um tema diferente do atual, quando possível
export function pickRandomTheme(currentTheme?: string): EssayTheme {
  const pool = ESSAY_THEMES.filter((t) => t.theme !== currentTheme);
  const list = pool.length > 0 ? pool : ESSAY_THEMES;
  return list[Math.floor(Math.random() * list.length)];
}
