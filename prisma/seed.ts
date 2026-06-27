import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const boards = [
    { name: 'CESPE/CEBRASPE', slug: 'cespe' },
    { name: 'FCC', slug: 'fcc' },
    { name: 'FGV', slug: 'fgv' },
    { name: 'VUNESP', slug: 'vunesp' },
    { name: 'IBFC', slug: 'ibfc' },
    { name: 'CESGRANRIO', slug: 'cesgranrio' },
    { name: 'Quadrix', slug: 'quadrix' },
    { name: 'IADES', slug: 'iades' },
  ];

  for (const board of boards) {
    await prisma.examBoard.upsert({
      where: { slug: board.slug },
      update: {},
      create: board,
    });
  }

  console.log('Seed completed: exam boards created');

  const subjects = [
    {
      name: 'Direito Constitucional',
      children: ['Princípios Fundamentais', 'Direitos e Garantias Fundamentais', 'Organização do Estado', 'Poder Executivo', 'Poder Legislativo', 'Poder Judiciário'],
    },
    {
      name: 'Direito Administrativo',
      children: ['Princípios da Administração', 'Atos Administrativos', 'Licitações e Contratos', 'Servidores Públicos', 'Responsabilidade Civil do Estado'],
    },
    {
      name: 'Português',
      children: ['Interpretação de Texto', 'Gramática', 'Redação Oficial', 'Concordância', 'Regência'],
    },
    {
      name: 'Raciocínio Lógico',
      children: ['Proposições', 'Equivalências', 'Probabilidade', 'Análise Combinatória', 'Sequências'],
    },
    {
      name: 'Informática',
      children: ['Sistemas Operacionais', 'Redes de Computadores', 'Segurança da Informação', 'Pacote Office', 'Banco de Dados'],
    },
  ];

  for (const subject of subjects) {
    const parent = await prisma.subject.upsert({
      where: { id: subject.name },
      update: {},
      create: { name: subject.name },
    });

    for (let i = 0; i < subject.children.length; i++) {
      await prisma.subject.create({
        data: {
          name: subject.children[i],
          parentId: parent.id,
          order: i,
        },
      });
    }
  }

  console.log('Seed completed: subjects created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
