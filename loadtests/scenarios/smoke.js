import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const tokens = new SharedArray('users', function () {
  return JSON.parse(open('../test_tokens.json'));
});

const metadata = JSON.parse(open('../test_metadata.json'));

export const options = {
  vus: 3,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
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

  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, { 'health status 200': (r) => r.status === 200 });

  sleep(0.3);

  // 2. Dashboard summary
  const dashRes = http.get(`${BASE_URL}/dashboard`, params);
  check(dashRes, { 'dashboard status 200': (r) => r.status === 200 });

  sleep(0.3);

  // 3. Subjects list
  const subjRes = http.get(`${BASE_URL}/subjects`, params);
  check(subjRes, { 'subjects status 200': (r) => r.status === 200 });

  sleep(0.3);

  // 4. Contests list
  const contestRes = http.get(`${BASE_URL}/contests`, params);
  check(contestRes, { 'contests status 200': (r) => r.status === 200 });

  sleep(0.3);

  // 5. Flashcards due
  const cardsRes = http.get(`${BASE_URL}/flashcards/due`, params);
  check(cardsRes, { 'flashcards due status 200': (r) => r.status === 200 });

  sleep(0.3);

  // 6. Write flow: Create session & submit answer
  if (metadata.questionId) {
    const sessionPayload = JSON.stringify({
      mode: 'STUDY',
      questionIds: [metadata.questionId],
    });
    const sessionRes = http.post(`${BASE_URL}/study/sessions`, sessionPayload, params);
    const sessionOk = check(sessionRes, { 'create study session 201': (r) => r.status === 201 || r.status === 200 });

    if (sessionOk) {
      const sessionBody = JSON.parse(sessionRes.body);
      const sessionId = sessionBody.data.session.id;

      sleep(0.3);

      const answerPayload = JSON.stringify({
        questionId: metadata.questionId,
        answer: metadata.correctAnswer || 'C',
        timeSpent: 12,
      });

      const answerRes = http.post(`${BASE_URL}/study/sessions/${sessionId}/answer`, answerPayload, params);
      check(answerRes, { 'submit answer 200': (r) => r.status === 200 });

      sleep(0.3);

      const finishRes = http.post(`${BASE_URL}/study/sessions/${sessionId}/finish`, JSON.stringify({}), params);
      check(finishRes, { 'finish session 200': (r) => r.status === 200 });
    }
  }

  sleep(0.5);
}
