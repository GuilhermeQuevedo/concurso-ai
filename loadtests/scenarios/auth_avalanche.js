import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const tokens = new SharedArray('users', function () {
  return JSON.parse(open('../test_tokens.json'));
});

export const options = {
  scenarios: {
    login_avalanche: {
      executor: 'per-vu-iterations',
      vus: 15,
      iterations: 2,
      maxDuration: '20s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3333/api';

export default function () {
  const user = tokens[Math.floor(Math.random() * 20)];

  // 1. Requisição de login com bcrypt
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: user.email,
      password: 'Password123!',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(res, {
    'login status 200': (r) => r.status === 200,
    'not 500 error': (r) => r.status !== 500,
  });

  // 2. Requisição concorrente de leitura para garantir que o login não congela a API
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check fast': (r) => r.status === 200 && r.timings.duration < 100,
  });
}
