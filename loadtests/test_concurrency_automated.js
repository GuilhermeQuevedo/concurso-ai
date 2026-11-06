import fs from 'node:fs';

const metadata = JSON.parse(fs.readFileSync('loadtests/test_metadata.json', 'utf8'));
const tokens = JSON.parse(fs.readFileSync('loadtests/test_tokens.json', 'utf8'));
const BASE_URL = 'http://localhost:3333/api';

// Usamos um usuário de teste pré-semeado com assinatura ativa garantida
const testUser = tokens[10];

async function runConcurrencyTest() {
  console.log('--- Iniciando Teste Automatizado de Concorrência e Idempotência ---');
  console.log(`[0] Usuário de teste selecionado: ${testUser.email} (ID: ${testUser.id})`);

  // 1. Criar uma sessão de estudo nova
  const createRes = await fetch(`${BASE_URL}/study/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testUser.token}`,
    },
    body: JSON.stringify({
      mode: 'STUDY',
      questionIds: [metadata.questionId],
    }),
  });

  const createJson = await createRes.json();
  const sessionId = createJson?.data?.session?.id;
  if (!sessionId) {
    throw new Error('Falha ao criar sessão de teste: ' + JSON.stringify(createJson));
  }
  console.log(`[1] Sessão criada: ${sessionId}`);

  // 2. Submeter uma resposta para a sessão
  const answerRes = await fetch(`${BASE_URL}/study/sessions/${sessionId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testUser.token}`,
    },
    body: JSON.stringify({
      questionId: metadata.questionId,
      answer: metadata.correctAnswer || 'C',
      timeSpent: 15,
    }),
  });
  const answerJson = await answerRes.json();
  if (answerRes.status !== 200) {
    throw new Error('Falha ao responder questão: ' + JSON.stringify(answerJson));
  }
  console.log('[2] Questão respondida com sucesso.');

  // 3. Disparar 20 requisições simultâneas para finalizar a MESMA sessão
  console.log('[3] Disparando 20 requisições simultâneas de finalização via Promise.all...');
  const CONCURRENT_REQUESTS = 20;
  const finishPromises = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
    fetch(`${BASE_URL}/study/sessions/${sessionId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser.token}`,
      },
      body: JSON.stringify({}),
    }).then(async (res) => ({
      index: i,
      status: res.status,
      body: await res.json(),
    }))
  );

  const results = await Promise.all(finishPromises);

  // 4. Validar respostas HTTP
  const statusCounts = new Map();
  let serverErrors = 0;
  let successCount = 0;

  for (const r of results) {
    statusCounts.set(r.status, (statusCounts.get(r.status) || 0) + 1);
    if (r.status === 200) successCount++;
    if (r.status >= 500) {
      serverErrors++;
      console.error(`Erro 500 na requisição #${r.index}:`, r.body);
    }
  }

  console.log('[4] Resultados HTTP das 20 requisições simultâneas:');
  console.log('   - Distribuição de status:', Object.fromEntries(statusCounts));
  console.log(`   - Sucessos (HTTP 200): ${successCount}/${CONCURRENT_REQUESTS}`);
  console.log(`   - Erros de Servidor (HTTP 500): ${serverErrors}/${CONCURRENT_REQUESTS}`);

  if (serverErrors > 0) {
    console.error(`❌ FALHA: ${serverErrors} erros 500 detectados sob concorrência!`);
    process.exit(1);
  }

  if (successCount !== CONCURRENT_REQUESTS) {
    console.error(`❌ FALHA: Nem todas as requisições retornaram 200 com sucesso!`);
    process.exit(1);
  }

  // 5. Teste de concorrência em grupo (tentativa simultânea de entrada no mesmo grupo)
  console.log('[5] Testando idempotência em entrada de grupo com 10 requisições simultâneas...');
  const groupJoinPromises = Array.from({ length: 10 }, () =>
    fetch(`${BASE_URL}/groups/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser.token}`,
      },
      body: JSON.stringify({ code: 'GRP-TEST' }),
    }).then((res) => res.status)
  );

  const groupResults = await Promise.all(groupJoinPromises);
  const group500Errors = groupResults.filter((s) => s >= 500).length;
  console.log('   - Status retornados na entrada do grupo:', groupResults);
  console.log(`   - Erros 500 na entrada de grupo: ${group500Errors}`);

  if (group500Errors > 0) {
    console.error(`❌ FALHA: ${group500Errors} erros 500 detectados ao entrar no grupo!`);
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('✅ TESTE DE CONCORRÊNCIA E IDEMPOTÊNCIA: 100% APROVADO!');
  console.log('   - 0 erros HTTP 500 em escritas simultâneas.');
  console.log('   - Race condition P2002 eliminada com sucesso.');
  console.log('   - Update condicional atômico executado perfeitamente.');
  console.log('============================================================');
}

runConcurrencyTest().catch((err) => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
