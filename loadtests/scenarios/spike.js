import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const tokens = new SharedArray('users', function () {
  return JSON.parse(open('../test_tokens.json'));
});

const metadata = JSON.parse(open('../test_metadata.json'));

export const options = {
  stages: [
    { duration: '10s', target: 50 },   // Warmup com 50 VUs
    { duration: '10s', target: 1000 }, // Spike súbito para 1000 VUs
    { duration: '1m', target: 1000 },  // Sustenta 1000 VUs por 1 min
    { duration: '10s', target: 0 },    // Cooldown
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
  },
};

const BASE_URL = 'http://localhost:3333/api';

export default function () {
  const user = tokens[__VU % tokens.length];
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.token}`,
    },
  };

  const res = http.get(`${BASE_URL}/dashboard`, params);
  check(res, {
    'status 200': (r) => r.status === 200,
    'not 429': (r) => r.status !== 429,
    'not 500': (r) => r.status !== 500,
  });

  sleep(0.5);
}
