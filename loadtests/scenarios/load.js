import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const tokens = new SharedArray('users', function () {
  return JSON.parse(open('../test_tokens.json'));
});

const metadata = JSON.parse(open('../test_metadata.json'));

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Patamar 1: 50 VUs
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },  // Patamar 2: 100 VUs
    { duration: '1m', target: 100 },
    { duration: '30s', target: 250 },  // Patamar 3: 250 VUs
    { duration: '1m', target: 250 },
    { duration: '30s', target: 500 },  // Patamar 4: 500 VUs
    { duration: '1m', target: 500 },
    { duration: '30s', target: 1000 }, // Patamar 5: 1000 VUs
    { duration: '1m', target: 1000 },
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Erros abaixo de 5%
    http_req_duration: ['p(95)<1500'], // p95 < 1500ms
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

  const journeyRoll = Math.random();

  if (journeyRoll < 0.35) {
    // Jornada 1: Home/Dashboard & Grade de Disciplinas
    const dRes = http.get(`${BASE_URL}/dashboard`, params);
    check(dRes, {
      'dashboard 200': (r) => r.status === 200,
      'is not 429': (r) => r.status !== 429,
      'is not 500': (r) => r.status !== 500,
    });

    sleep(1);

    const sRes = http.get(`${BASE_URL}/subjects`, params);
    check(sRes, { 'subjects 200': (r) => r.status === 200 });
  } else if (journeyRoll < 0.65) {
    // Jornada 2: Editais / Meus Editais e Detalhe de Prova
    const cRes = http.get(`${BASE_URL}/contests`, params);
    check(cRes, {
      'contests 200': (r) => r.status === 200,
      'is not 429': (r) => r.status !== 429,
    });

    sleep(1);

    if (metadata.contestId) {
      const detailRes = http.get(`${BASE_URL}/contests/${metadata.contestId}`, params);
      check(detailRes, { 'contest detail 200': (r) => r.status === 200 });
    }
  } else if (journeyRoll < 0.85) {
    // Jornada 3: Revisão de Flashcards & Ranking
    const fRes = http.get(`${BASE_URL}/flashcards/due`, params);
    check(fRes, { 'flashcards 200': (r) => r.status === 200 });

    sleep(1);

    if (metadata.rankingBoardId) {
      const rRes = http.get(`${BASE_URL}/rankings/${metadata.rankingBoardId}/leaderboard`, params);
      check(rRes, { 'leaderboard 200': (r) => r.status === 200 });
    }
  } else {
    // Jornada 4: Resolução Ativa de Questão (Escrita e Gravação de Desempenho)
    if (metadata.questionId) {
      const sessionPayload = JSON.stringify({
        mode: 'STUDY',
        questionIds: [metadata.questionId],
      });
      const sRes = http.post(`${BASE_URL}/study/sessions`, sessionPayload, params);
      if (sRes.status === 200 || sRes.status === 201) {
        const body = JSON.parse(sRes.body);
        const sessionId = body?.data?.session?.id;
        if (sessionId) {
          sleep(0.8);
          const answerPayload = JSON.stringify({
            questionId: metadata.questionId,
            answer: metadata.correctAnswer || 'C',
            timeSpent: 15,
          });
          const aRes = http.post(`${BASE_URL}/study/sessions/${sessionId}/answer`, answerPayload, params);
          check(aRes, { 'answer submitted 200': (r) => r.status === 200 });

          sleep(0.8);
          const fRes = http.post(`${BASE_URL}/study/sessions/${sessionId}/finish`, JSON.stringify({}), params);
          check(fRes, { 'session finished 200': (r) => r.status === 200 });
        }
      } else {
        check(sRes, { 'session created ok': (r) => r.status === 200 || r.status === 201 });
      }
    }
  }

  sleep(1);
}
