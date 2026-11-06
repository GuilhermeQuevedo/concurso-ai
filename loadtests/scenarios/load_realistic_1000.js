import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const tokens = new SharedArray('users', function () {
  return JSON.parse(open('../test_tokens.json'));
});

const metadata = JSON.parse(open('../test_metadata.json'));

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Rampa inicial para 100 usuários
    { duration: '1m', target: 250 },   // Rampa para 250 usuários
    { duration: '1m', target: 500 },   // Rampa para 500 usuários
    { duration: '2m', target: 1000 },  // Rampa para 1000 usuários
    { duration: '2m', target: 1000 },  // Sustentação em 1000 usuários reais
    { duration: '30s', target: 0 },    // Resfriamento
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // Erros < 1%
    'http_req_duration{expected_response:true}': ['p(95)<500', 'p(99)<1500'], // p95 < 500ms
  },
};

const BASE_URL = 'http://localhost:3333/api';

// Helper de think time realista: 5 a 15 segundos (média ~10s)
function thinkTime() {
  sleep(Math.random() * 10 + 5);
}

export default function () {
  const user = tokens[__VU % tokens.length];
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.token}`,
    },
  };

  const journeyRoll = Math.random();

  if (journeyRoll < 0.40) {
    // Jornada 1: Home/Dashboard & Grade de Disciplinas
    const dRes = http.get(`${BASE_URL}/dashboard`, params);
    check(dRes, {
      'dashboard 200': (r) => r.status === 200,
      'dashboard not 429': (r) => r.status !== 429,
    });

    thinkTime();

    const sRes = http.get(`${BASE_URL}/subjects`, params);
    check(sRes, {
      'subjects 200': (r) => r.status === 200,
      'subjects not 429': (r) => r.status !== 429,
    });
  } else if (journeyRoll < 0.70) {
    // Jornada 2: Meus Editais
    const cRes = http.get(`${BASE_URL}/contests`, params);
    check(cRes, {
      'contests 200': (r) => r.status === 200,
      'contests not 429': (r) => r.status !== 429,
    });

    thinkTime();
  } else if (journeyRoll < 0.85) {
    // Jornada 3: Revisão de Flashcards & Ranking
    const fRes = http.get(`${BASE_URL}/flashcards/due`, params);
    check(fRes, {
      'flashcards 200': (r) => r.status === 200,
      'flashcards not 429': (r) => r.status !== 429,
    });

    thinkTime();

    if (metadata.rankingBoardId) {
      const rRes = http.get(`${BASE_URL}/rankings/${metadata.rankingBoardId}/leaderboard`, params);
      check(rRes, {
        'leaderboard 200': (r) => r.status === 200,
        'leaderboard not 429': (r) => r.status !== 429,
      });
    }
  } else {
    // Jornada 4: Resolução de Questão
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
          thinkTime(); // Aluno lê a questão e alternativas

          const answerPayload = JSON.stringify({
            questionId: metadata.questionId,
            answer: metadata.correctAnswer || 'C',
            timeSpent: 12,
          });
          const aRes = http.post(`${BASE_URL}/study/sessions/${sessionId}/answer`, answerPayload, params);
          check(aRes, { 'answer 200': (r) => r.status === 200 });

          thinkTime(); // Aluno lê o comentário/gabarito

          const fRes = http.post(`${BASE_URL}/study/sessions/${sessionId}/finish`, JSON.stringify({}), params);
          check(fRes, { 'finish 200': (r) => r.status === 200 });
        }
      } else {
        check(sRes, { 'session created ok': (r) => r.status === 200 || r.status === 201 });
      }
    }
  }

  thinkTime();
}
