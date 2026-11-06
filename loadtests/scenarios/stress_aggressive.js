import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const tokens = new SharedArray('users', function () {
  return JSON.parse(open('../test_tokens.json'));
});

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '30s', target: 300 },
    { duration: '30s', target: 600 },
    { duration: '30s', target: 1000 },
    { duration: '1m', target: 1200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    'http_req_duration{expected_response:true}': ['p(95)<1000'],
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

  sleep(0.3);
}
