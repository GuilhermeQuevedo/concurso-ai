const { PrismaClient } = require('C:/Users/user/concurso-ai/apps/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const questions = await prisma.question.count();
  const subjects = await prisma.subject.count();
  const contests = await prisma.contest.count();
  const questionSets = await prisma.questionSet.count();
  const flashcards = await prisma.flashcard.count();
  const sampleUser = await prisma.user.findFirst({ select: { id: true, email: true } });
  const sampleQuestion = await prisma.question.findFirst({ select: { id: true, correctAnswer: true } });
  const sampleContest = await prisma.contest.findFirst({ select: { id: true, name: true } });
  const sampleBoard = await prisma.rankingBoard.findFirst({ select: { id: true, title: true } });

  console.log({
    users,
    questions,
    subjects,
    contests,
    questionSets,
    flashcards,
    sampleUser,
    sampleQuestion,
    sampleContest,
    sampleBoard,
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
