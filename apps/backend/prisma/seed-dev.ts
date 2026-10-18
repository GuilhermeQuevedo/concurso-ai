import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

// Seed SOMENTE para desenvolvimento local: cria um usuário de teste e conteúdo de exemplo
// para experimentar telas e jogos. Credenciais de teste (válidas apenas no banco local):
const DEV_EMAIL = 'dev@engrama.local';
const DEV_PASSWORD = 'dev-local-2026';

const prisma = new PrismaClient();

const DAY_MS = 86400000;

const CARDS: Array<[string, string, number]> = [
  ['O que é o princípio da legalidade?', 'Ninguém é obrigado a fazer ou deixar de fazer algo senão em virtude de lei.', 1],
  ['O que é habeas corpus?', 'Garantia que protege a liberdade de locomoção contra ilegalidade ou abuso de poder.', 6],
  ['O que é mandado de segurança?', 'Remédio para proteger direito líquido e certo não amparado por habeas corpus ou habeas data.', 3],
  ['O que é cláusula pétrea?', 'Dispositivo constitucional que não pode ser abolido nem por emenda constitucional.', 12],
  ['O que é devido processo legal?', 'Garantia de que ninguém será privado da liberdade ou de bens sem processo regular.', 2],
  ['O que é federalismo?', 'Forma de Estado em que há repartição de competências entre União, estados e municípios.', 8],
  ['O que é separação de poderes?', 'Divisão das funções do Estado em Legislativo, Executivo e Judiciário, independentes e harmônicos.', 5],
  ['O que é controle de constitucionalidade?', 'Verificação da compatibilidade das leis e atos normativos com a Constituição.', 10],
];

function question(statement: string, correct: string, options: string[]) {
  return {
    statement,
    alternatives: options.map((text, i) => ({ letter: 'ABCDE'[i], text })),
    correctAnswer: correct,
    difficulty: 'MEDIUM' as const,
    explanation: 'Questão de exemplo para desenvolvimento.',
    comments: [],
    source: 'MANUAL' as const,
  };
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed-dev não pode rodar em produção.');
  }

  const password = await bcrypt.hash(DEV_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: DEV_EMAIL },
    update: { password, role: 'ADMIN' },
    create: { email: DEV_EMAIL, name: 'Dev Local', password, role: 'ADMIN' },
  });

  const directLaw = await prisma.subject.create({ data: { name: 'Direito Constitucional (dev)', order: 1 } });
  const admin = await prisma.subject.create({ data: { name: 'Direito Administrativo (dev)', order: 2 } });

  for (const subjectId of [directLaw.id, admin.id]) {
    for (let i = 1; i <= 6; i++) {
      await prisma.question.create({
        data: {
          subjectId,
          ...question(`Questão de exemplo ${i}: qual alternativa está correta?`, 'B', [
            'Alternativa errada A',
            'Alternativa correta B',
            'Alternativa errada C',
            'Alternativa errada D',
            'Alternativa errada E',
          ]),
        },
      });
    }
  }

  const elapsedFactors = [0.4, 1.2, 2.5, 4];
  for (const [index, [front, back, intervalDays]] of CARDS.entries()) {
    const elapsedDays = intervalDays * elapsedFactors[index % elapsedFactors.length];
    await prisma.flashcard.create({
      data: {
        userId: user.id,
        subjectId: directLaw.id,
        front,
        back,
        interval: intervalDays,
        nextReview: new Date(Date.now() + (intervalDays - elapsedDays) * DAY_MS),
      },
    });
  }

  console.log(`Seed de desenvolvimento pronto. Login: ${DEV_EMAIL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
