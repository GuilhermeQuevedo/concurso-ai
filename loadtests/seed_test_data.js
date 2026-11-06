const { PrismaClient } = require('C:/Users/user/concurso-ai/apps/backend/node_modules/@prisma/client');
const { SignJWT } = require('C:/Users/user/concurso-ai/apps/backend/node_modules/jose');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const JWT_SECRET = 'concurso-ai-development-jwt-secret-key-min-32-chars-long';

async function createToken(userId, role) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

async function seed() {
  console.log('Seeding load test environment data...');

  // 1. Create or ensure test ExamBoard
  const board = await prisma.examBoard.upsert({
    where: { slug: 'cespe' },
    update: {},
    create: { name: 'CESPE/CEBRASPE', slug: 'cespe' },
  });

  // 2. Create or ensure Subjects
  const parentSubject = await prisma.subject.upsert({
    where: { id: 'test-subject-dir-const' },
    update: {},
    create: { id: 'test-subject-dir-const', name: 'Direito Constitucional' },
  });

  const childSubject = await prisma.subject.upsert({
    where: { id: 'test-subject-dir-fund' },
    update: {},
    create: {
      id: 'test-subject-dir-fund',
      name: 'Direitos e Garantias Fundamentais',
      parentId: parentSubject.id,
    },
  });

  // 3. Create sample Questions
  const questionsCount = await prisma.question.count();
  if (questionsCount < 20) {
    console.log('Creating sample questions...');
    for (let i = 1; i <= 25; i++) {
      await prisma.question.create({
        data: {
          statement: `Questão de teste de carga #${i}: A respeito dos direitos e garantias fundamentais previstos na CF/88, julgue o item a seguir. Homens e mulheres são iguais em direitos e obrigações nos termos da Constituição.`,
          alternatives: [
            { letter: 'C', text: 'Certo' },
            { letter: 'E', text: 'Errado' }
          ],
          correctAnswer: 'C',
          difficulty: i % 3 === 0 ? 'HARD' : i % 2 === 0 ? 'MEDIUM' : 'EASY',
          explanation: 'Art. 5º, I, da CF/88: homens e mulheres são iguais em direitos e obrigações.',
          comments: [],
          subjectId: childSubject.id,
          examBoardId: board.id,
          source: 'IMPORTED',
        },
      });
    }
  }

  // 4. Create sample Flashcards
  const flashcardsCount = await prisma.flashcard.count();
  if (flashcardsCount < 20) {
    console.log('Creating sample flashcards...');
    const adminUser = await prisma.user.findFirst();
    if (adminUser) {
      for (let i = 1; i <= 20; i++) {
        await prisma.flashcard.create({
          data: {
            userId: adminUser.id,
            subjectId: childSubject.id,
            front: `Flashcard de carga #${i}: O que diz o art. 5º, I da CF?`,
            back: 'Homens e mulheres são iguais em direitos e obrigações.',
            nextReview: new Date(),
          },
        });
      }
    }
  }

  // 5. Create or ensure RankingBoard
  let rankingBoard = await prisma.rankingBoard.findFirst({ where: { status: 'APPROVED' } });
  if (!rankingBoard) {
    const adminUser = await prisma.user.findFirst();
    if (adminUser) {
      rankingBoard = await prisma.rankingBoard.create({
        data: {
          title: 'Ranking Geral Concurso AI 2026',
          description: 'Classificação geral dos alunos em simulados e exercícios',
          createdById: adminUser.id,
          subjectId: parentSubject.id,
          status: 'APPROVED',
        },
      });
    }
  }

  // 6. Create 100 test users with tokens & active entitlements
  console.log('Ensuring 100 test users with active tokens and entitlements...');
  const testUsersTokens = [];

  for (let i = 1; i <= 100; i++) {
    const email = `loadtest_user_${i}@concurso.ai`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Load Test User ${i}`,
        role: 'USER',
        dailyGoal: 30,
      },
    });

    // Active Entitlement for requireSubscription
    await prisma.entitlement.upsert({
      where: { email },
      update: { status: 'ACTIVE', expiresAt: new Date('2099-01-01') },
      create: {
        email,
        status: 'ACTIVE',
        provider: 'loadtest',
        expiresAt: new Date('2099-01-01'),
      },
    });

    // Join ranking participant
    if (rankingBoard) {
      await prisma.rankingParticipant.upsert({
        where: { rankingId_userId: { rankingId: rankingBoard.id, userId: user.id } },
        update: {},
        create: { rankingId: rankingBoard.id, userId: user.id },
      });
    }

    const token = await createToken(user.id, user.role);
    testUsersTokens.push({
      userId: user.id,
      email: user.email,
      token,
    });
  }

  // Save tokens to JSON for k6 to consume
  const tokensPath = path.resolve(__dirname, 'test_tokens.json');
  fs.writeFileSync(tokensPath, JSON.stringify(testUsersTokens, null, 2), 'utf8');
  console.log(`Saved ${testUsersTokens.length} test user tokens to ${tokensPath}`);

  // Fetch sample IDs for k6 scripts
  const sampleQuestion = await prisma.question.findFirst({ select: { id: true, correctAnswer: true } });
  const sampleContest = await prisma.contest.findFirst({ select: { id: true } });

  const metadata = {
    rankingBoardId: rankingBoard?.id || '',
    subjectId: childSubject.id,
    questionId: sampleQuestion?.id || '',
    correctAnswer: sampleQuestion?.correctAnswer || 'C',
    contestId: sampleContest?.id || '',
  };

  const metaPath = path.resolve(__dirname, 'test_metadata.json');
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`Saved test metadata to ${metaPath}`);

  console.log('Seeding completed successfully!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
