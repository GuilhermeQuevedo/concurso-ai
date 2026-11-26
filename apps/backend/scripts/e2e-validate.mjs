import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:4173';

// Mock data fixtures
const mockUser = {
  id: 'usr_admin_123',
  name: 'Guilherme Quevedo',
  email: 'admin@concurso.ai',
  role: 'ADMIN',
  createdAt: new Date().toISOString(),
};

const mockOverview = {
  users: { total: 42, newLast7: 8, newLast30: 25 },
  subscriptions: { active: 18 },
  engagement: {
    questionsAnswered: 1350,
    essays: 45,
    flashcards: 320,
    sessions: 88,
    contests: 5,
  },
  revenue: { receivedCents: 189000, paymentsCount: 19 },
};

const mockUsers = [
  {
    id: 'usr_1',
    name: 'C*** S***',
    email: 'c***@***.com',
    phone: '***-****',
    isMasked: true,
    role: 'USER',
    createdAt: '2026-11-01T10:00:00.000Z',
    activeSubscriber: true,
    access: null,
    streak: 5,
    questionsAnswered: 120,
    essays: 3,
    flashcards: 40,
    sessions: 12,
  },
  {
    id: 'usr_2',
    name: 'M*** O***',
    email: 'm***@***.com',
    phone: null,
    isMasked: true,
    role: 'USER',
    createdAt: '2026-11-05T12:00:00.000Z',
    activeSubscriber: false,
    access: null,
    streak: 0,
    questionsAnswered: 15,
    essays: 0,
    flashcards: 10,
    sessions: 2,
  },
];

const mockContacts = [
  {
    id: 'ct_1',
    name: 'A*** F***',
    phone: '(61) 9****-****',
    email: 'a***@***.com',
    source: 'leads-webinar',
    isMasked: true,
    createdAt: '2026-11-10T14:00:00.000Z',
  },
];

const mockStats = {
  questionsAnswered: 150,
  correctAnswers: 120,
  accuracy: 80,
  totalSessions: 15,
  totalTimeSeconds: 7200,
};

const mockDashboardSummary = {
  streak: { current: 7, longest: 14, shields: 1, shieldedDates: [] },
  heatmap: [
    { date: '2026-11-10', count: 15 },
    { date: '2026-11-11', count: 22 },
    { date: '2026-11-12', count: 30 },
  ],
  goal: { dailyQuestions: 30, todayQuestions: 25, todayStudyMinutes: 45 },
  averages: { questionsLast30: 450, questionsLast7: 160, activeDaysLast30: 22, perActiveDay: 20 },
};

async function setupApiMocks(page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/api/auth/profile') || url.includes('/api/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockUser }),
      });
    }

    if (url.includes('/api/payments/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            active: true,
            enforced: false,
            status: 'ADMIN',
            expiresAt: null,
          },
        }),
      });
    }

    if (url.includes('/api/admin/overview')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockOverview }),
      });
    }

    if (url.includes('/api/admin/users/') && url.includes('/reveal') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...mockUsers[0],
            name: 'Carlos Silva',
            email: 'carlos.silva@email.com',
            phone: '(61) 98888-7777',
            isMasked: false,
          },
        }),
      });
    }

    if (url.includes('/api/admin/users')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            users: mockUsers,
            pagination: { total: 2, page: 1, limit: 50, totalPages: 1 },
          },
        }),
      });
    }

    if (url.includes('/api/admin/contacts/') && url.includes('/reveal') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...mockContacts[0],
            name: 'Ana Ferreira',
            phone: '(61) 99999-1111',
            email: 'ana.ferreira@email.com',
            isMasked: false,
          },
        }),
      });
    }

    if (url.includes('/api/admin/contacts')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            contacts: mockContacts,
            pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
          },
        }),
      });
    }

    if (url.includes('/api/admin/access')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    if (url.includes('/api/study/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockStats }),
      });
    }

    if (url.includes('/api/study/history') || url.includes('/api/study/sessions')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    if (url.includes('/api/dashboard')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockDashboardSummary }),
      });
    }

    if (url.includes('/api/gamification/xp') || url.includes('/api/xp')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalXp: 1250,
            level: { level: 4, tier: { name: 'Bronze', color: 'amber' }, progress: 0.65 },
            today: { total: 80, cap: 200, bySource: {} },
            multiplier: 1.0,
          },
        }),
      });
    }

    if (url.includes('/api/friends')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            friends: [],
            received: [],
            sent: [],
          },
        }),
      });
    }

    if (url.includes('/api/games')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            earnedToday: 0,
            cap: 200,
            games: [],
          },
        }),
      });
    }

    if (url.includes('/api/subjects') || url.includes('/api/contests') || url.includes('/api/flashcards')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }

    if (url.includes('/api/gamification/profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            profile: {
              nickname: 'guilherme_q',
              totalXp: 1250,
              level: 4,
              streakDays: 7,
              stats: {
                totalQuestions: 150,
                correctQuestions: 120,
                accuracy: 80,
                studyTimeHours: 2,
                totalSessions: 15,
                longestStreak: 14,
              },
            },
            unlockedAchievements: [],
            availableAchievements: [],
          },
        }),
      });
    }

    // Default fallback mock
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
}

async function runValidation() {
  console.log('🚀 Iniciando validação E2E com Playwright em ' + BASE_URL);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error('❌ PageError:', err.message);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.warn('⚠️ Console Error:', msg.text());
    }
  });

  await setupApiMocks(page);

  const results = [];

  async function testRoute(name, path, assertionFn) {
    const errorCountBefore = pageErrors.length;
    try {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 8000 });
      if (assertionFn) {
        await assertionFn(page);
      }
      const hasNewError = pageErrors.length > errorCountBefore;
      if (hasNewError) {
        results.push({ name, path, status: 'FAILED', error: pageErrors[pageErrors.length - 1] });
      } else {
        results.push({ name, path, status: 'PASSED' });
        console.log(`✅ [${name}] OK em ${path}`);
      }
    } catch (err) {
      results.push({ name, path, status: 'FAILED', error: err.message });
      console.error(`❌ [${name}] Falhou:`, err.message);
    }
  }

  // --- 1. ROTAS PÚBLICAS ---
  console.log('\n--- 1. Validando Rotas Públicas ---');
  await testRoute('Landing Page', '/', async (p) => {
    await p.waitForSelector('text=Engrama', { timeout: 4000 });
  });

  await testRoute('Login Page', '/login', async (p) => {
    await p.waitForSelector('input[type="email"]');
    await p.waitForSelector('input[type="password"]');
  });

  await testRoute('Register Page', '/register', async (p) => {
    await p.waitForSelector('input[name="name"]');
    await p.waitForSelector('input[name="email"]');
    await p.waitForSelector('input[name="acceptTerms"]');
    await p.waitForSelector('input[name="acceptPrivacy"]');
    await p.waitForSelector('input[name="acceptAgeOrGuardian"]');
  });

  await testRoute('Política de Cookies', '/politica-de-cookies', async (p) => {
    await p.waitForSelector('text=Política de Cookies');
  });

  await testRoute('Política de Privacidade', '/politica-de-privacidade', async (p) => {
    await p.waitForSelector('text=Política de Privacidade');
  });

  await testRoute('Termos de Uso', '/termos-de-uso', async (p) => {
    await p.waitForSelector('text=Termos de Uso');
  });

  // --- 2. CONFIGURANDO SESSÃO AUTENTICADA ---
  console.log('\n--- 2. Injetando Sessão Autenticada de Administrador ---');
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'mock_jwt_token_admin');
    localStorage.setItem('refreshToken', 'mock_refresh_token_admin');
    localStorage.setItem('tour_done', 'true');
    localStorage.setItem(
      'engrama_cookie_consent',
      JSON.stringify({
        version: 'consent_v1',
        timestamp: new Date().toISOString(),
        preferences: { necessary: true, analytics: true, marketing: false },
      }),
    );
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'usr_admin_123',
        name: 'Guilherme Quevedo',
        email: 'admin@concurso.ai',
        role: 'ADMIN',
      }),
    );
  });

  // --- 3. ROTAS ADMINISTRATIVAS E PRINCIPAIS ---
  console.log('\n--- 3. Validando Painel Geral e Administração ---');

  await testRoute('Painel Geral (Admin)', '/admin', async (p) => {
    await p.waitForSelector('h1:has-text("Administração")', { timeout: 5000 });
    await p.waitForSelector('h2:has-text("Usuários")', { timeout: 5000 });

    // Verifica que a tabela de usuários renderizou sem crash no .map
    await p.waitForSelector('td:has-text("C*** S***")');

    // Testa interação com o botão "Revelar" de PII da LGPD
    const revealBtn = await p.waitForSelector('button:has-text("Revelar")');
    await revealBtn.click();

    // Verifica que o Modal de Justificativa de PII abriu
    await p.waitForSelector('text=Visualizar Dados Pessoais do Usuário');
    await p.waitForSelector('text=Aviso de Conformidade LGPD');

    // Preenche justificativa de auditoria e confirma
    await p.fill('#justification', 'Acesso solicitado para auditoria técnica de homologação');
    const confirmBtn = await p.waitForSelector('button:has-text("Revelar Dados Pessoais")');
    await confirmBtn.click();

    // Verifica que o dado foi desmascarado
    await p.waitForSelector('td:has-text("Carlos Silva")', { timeout: 4000 });
  });

  await testRoute('Painel de Leads (Admin Contatos)', '/admin/contatos', async (p) => {
    await p.waitForSelector('h1:has-text("Possíveis Clientes")', { timeout: 5000 });
    await p.waitForSelector('td:has-text("A*** F***")');

    // Testa botão Revelar de contato
    const revealBtn = await p.waitForSelector('button[title*="Revelar dados pessoais"]');
    await revealBtn.click();

    await p.waitForSelector('text=Visualizar Dados do Contato');
    await p.fill('#justification', 'Auditoria de lead para conformidade regulatória LGPD');
    await p.click('button:has-text("Revelar Dados Pessoais")');

    await p.waitForSelector('td:has-text("Ana Ferreira")', { timeout: 4000 });
  });

  // --- 4. DASHBOARD DO USUÁRIO ---
  console.log('\n--- 4. Validando Dashboard Geral de Estudos ---');
  await testRoute('Dashboard do Usuário', '/dashboard', async (p) => {
    await p.waitForSelector('text=Olá, Guilherme!', { timeout: 5000 });
    await p.waitForSelector('text=Questões resolvidas');
    await p.waitForSelector('text=Taxa de acerto');
    await p.waitForSelector('text=Tempo estudado');
    await p.waitForSelector('text=Sessões completadas');
    await p.waitForSelector('text=Meta diária');
    await p.waitForSelector('text=Constância');
  });

  // --- 5. OUTRAS FUNCIONALIDADES DA PLATAFORMA ---
  console.log('\n--- 5. Validando Demais Funcionalidades da Plataforma ---');

  const otherRoutes = [
    { name: 'Disciplinas / Matérias', path: '/subjects' },
    { name: 'Bancas Examinadoras', path: '/exam-boards' },
    { name: 'Gerador de Questões', path: '/generate' },
    { name: 'Fatiador de Provas', path: '/exam-slicer' },
    { name: 'Caderno de Erros', path: '/error-notebook' },
    { name: 'Flashcards', path: '/flashcards' },
    { name: 'Conquistas', path: '/achievements' },
    { name: 'Cronograma', path: '/cronograma' },
    { name: 'Concursos Alvo', path: '/contests' },
    { name: 'Calendário de Estudos', path: '/calendar' },
    { name: 'Redações com IA', path: '/essays' },
    { name: 'Grupos de Estudo', path: '/groups' },
    { name: 'Amigos & Ofensiva', path: '/friends' },
    { name: 'Estatísticas', path: '/stats' },
    { name: 'Simulador de Memória', path: '/memory-simulator' },
    { name: 'Arena de Jogos', path: '/games' },
    { name: 'Rankings', path: '/rankings' },
    { name: 'Configurações & Privacidade DSAR', path: '/settings' },
    { name: 'Perfil do Usuário', path: '/profile' },
    { name: 'Central de Ajuda', path: '/help' },
    { name: 'Metodologia', path: '/metodologia' },
    { name: 'Getting Started', path: '/getting-started' },
  ];

  for (const item of otherRoutes) {
    await testRoute(item.name, item.path);
  }

  await browser.close();

  // Relatório Final
  console.log('\n=======================================');
  console.log('       RELATÓRIO DE EXECUÇÃO E2E');
  console.log('=======================================');
  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;

  console.log(`Total de Funcionalidades Testadas: ${results.length}`);
  console.log(`Sucessos: ${passed}`);
  console.log(`Falhas: ${failed}`);
  console.log(`Page Errors: ${pageErrors.length}`);

  if (failed > 0 || pageErrors.length > 0) {
    console.error('\n❌ Erros Encontrados:');
    results
      .filter((r) => r.status === 'FAILED')
      .forEach((r) => console.error(` - [${r.name}] ${r.path}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('\n🎉 TODAS AS FUNCIONALIDADES PASSARAM COM SUCESSO! ZERO CRASHES!');
    process.exit(0);
  }
}

runValidation().catch((err) => {
  console.error('Erro crítico no executor:', err);
  process.exit(1);
});
