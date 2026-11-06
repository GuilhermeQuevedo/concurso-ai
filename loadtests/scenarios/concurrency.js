import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const tokens = new SharedArray('users', function () {
  return JSON.parse(open('../test_tokens.json'));
});

const metadata = JSON.parse(open('../test_metadata.json'));

export const options = {
  scenarios: {
    // 50 usuários concorrentes tentando alterar O MESMO recurso ao mesmo tempo
    concurrent_write_same_session: {
      executor: 'per-vu-iterations',
      vus: 50,
      iterations: 5,
      maxDuration: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:3333/api';

// Setup: cria uma única sessão compartilhada para todos os VUs concorrentes
export function setup() {
  const adminToken = tokens[0].token;
  const res = http.post(
    `${BASE_URL}/study/sessions`,
    JSON.stringify({
      mode: 'STUDY',
      questionIds: [metadata.questionId],
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );
  const body = JSON.parse(res.body);
  const sharedSessionId = body?.data?.session?.id;
  return { sharedSessionId, ownerToken: adminToken };
}

export default function (data) {
  // Cenário 1: 50 requisições simultâneas submetendo respostas para a MESMA sessão
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.ownerToken}`,
    },
  };

  const answerPayload = JSON.stringify({
    questionId: metadata.questionId,
    answer: metadata.correctAnswer || 'C',
    timeSpent: 10,
  });

  const res = http.post(`${BASE_URL}/study/sessions/${data.sharedSessionId}/answer`, answerPayload, params);
  check(res, {
    'answer status 200': (r) => r.status === 200,
    'not deadlock 500': (r) => r.status !== 500,
  });

  // Cenário 2: 50 requisições simultâneas tentando finalizar a MESMA sessão ao mesmo tempo
  const finishRes = http.post(`${BASE_URL}/study/sessions/${data.sharedSessionId}/finish`, JSON.stringify({}), params);
  check(finishRes, {
    'finish status 200': (r) => r.status === 200,
    'finish not 500': (r) => r.status !== 500,
  });
}
