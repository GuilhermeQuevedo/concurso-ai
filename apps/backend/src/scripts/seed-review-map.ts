import { prisma } from '../database/prisma.js';
import { RelationStatus, RelationType, TopicLevel } from '@prisma/client';

async function main() {
  console.log('--- Iniciando Semeadura do Mapa de Revisão (Engrama) ---');

  // Garante uma matéria (Subject)
  let subject = await prisma.subject.findFirst({
    where: { name: 'Direito' },
  });

  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        name: 'Direito',
      },
    });
  }

  // 1. Disciplinas (Nível 0)
  const constId = 'disc-const';
  const admId = 'disc-adm';

  await prisma.topic.upsert({
    where: { id: constId },
    update: {},
    create: {
      id: constId,
      name: 'Direito Constitucional',
      slug: 'direito-constitucional',
      level: TopicLevel.DISCIPLINE,
      order: 1,
      subjectId: subject.id,
      description: 'Estrutura fundamental do Estado, direitos e garantias constitucionais.',
    },
  });

  await prisma.topic.upsert({
    where: { id: admId },
    update: {},
    create: {
      id: admId,
      name: 'Direito Administrativo',
      slug: 'direito-administrativo',
      level: TopicLevel.DISCIPLINE,
      order: 2,
      subjectId: subject.id,
      description: 'Regime jurídico-administrativo, atos, poderes e serviços públicos.',
    },
  });

  // 2. Tópicos (Nível 1)
  const topDireitos = 'top-direitos-fundamentais';
  const topControle = 'top-controle-const';
  const topPrincipios = 'top-principios-adm';
  const topAtos = 'top-atos-adm';
  const topPoderes = 'top-poderes-adm';

  await prisma.topic.upsert({
    where: { id: topDireitos },
    update: {},
    create: {
      id: topDireitos,
      name: 'Direitos Fundamentais',
      slug: 'direitos-fundamentais',
      level: TopicLevel.TOPIC,
      order: 1,
      parentId: constId,
      subjectId: subject.id,
      description: 'Direitos individuais, coletivos, sociais e nacionalidade.',
    },
  });

  await prisma.topic.upsert({
    where: { id: topControle },
    update: {},
    create: {
      id: topControle,
      name: 'Controle de Constitucionalidade',
      slug: 'controle-constitucionalidade',
      level: TopicLevel.TOPIC,
      order: 2,
      parentId: constId,
      subjectId: subject.id,
      description: 'Controle difuso e concentrado, ações diretas e súmulas vinculantes.',
    },
  });

  await prisma.topic.upsert({
    where: { id: topPrincipios },
    update: {},
    create: {
      id: topPrincipios,
      name: 'Princípios da Administração Pública',
      slug: 'principios-adm',
      level: TopicLevel.TOPIC,
      order: 1,
      parentId: admId,
      subjectId: subject.id,
      description: 'Princípios expressos e implícitos do art. 37 da CF/88.',
    },
  });

  await prisma.topic.upsert({
    where: { id: topAtos },
    update: {},
    create: {
      id: topAtos,
      name: 'Atos Administrativos',
      slug: 'atos-adm',
      level: TopicLevel.TOPIC,
      order: 2,
      parentId: admId,
      subjectId: subject.id,
      description: 'Requisitos, atributos, classificação, anulação e revogação.',
    },
  });

  await prisma.topic.upsert({
    where: { id: topPoderes },
    update: {},
    create: {
      id: topPoderes,
      name: 'Poderes Administrativos',
      slug: 'poderes-adm',
      level: TopicLevel.TOPIC,
      order: 3,
      parentId: admId,
      subjectId: subject.id,
      description: 'Poder vinculado, discricionário, hierárquico, disciplinar e de polícia.',
    },
  });

  // 3. Subtópicos (Nível 2)
  const subDomicilio = 'sub-inviolabilidade-domicilio';
  const subPolicia = 'sub-poder-policia';

  await prisma.topic.upsert({
    where: { id: subDomicilio },
    update: {},
    create: {
      id: subDomicilio,
      name: 'Inviolabilidade de Domicílio',
      slug: 'inviolabilidade-domicilio',
      level: TopicLevel.SUBTOPIC,
      order: 1,
      parentId: topDireitos,
      subjectId: subject.id,
      description: 'Exceções do art. 5º, XI da CF/88 e tese do Tema 280 STF.',
    },
  });

  await prisma.topic.upsert({
    where: { id: subPolicia },
    update: {},
    create: {
      id: subPolicia,
      name: 'Poder de Polícia',
      slug: 'poder-policia',
      level: TopicLevel.SUBTOPIC,
      order: 1,
      parentId: topPoderes,
      subjectId: subject.id,
      description: 'Conceito, atributos, discricionariedade, autoexecutoriedade e coercibilidade.',
    },
  });

  // 4. Banca e Incidências
  const board = await prisma.examBoard.upsert({
    where: { slug: 'fgv' },
    update: {},
    create: {
      name: 'FGV',
      slug: 'fgv',
    },
  });

  const incidences = [
    { topicId: constId, weight: 3.5 },
    { topicId: admId, weight: 3.8 },
    { topicId: topDireitos, weight: 3.2 },
    { topicId: topControle, weight: 2.8 },
    { topicId: topPrincipios, weight: 2.9 },
    { topicId: topAtos, weight: 3.7 },
    { topicId: topPoderes, weight: 3.0 },
    { topicId: subDomicilio, weight: 2.4 },
    { topicId: subPolicia, weight: 2.6 },
  ];

  for (const inc of incidences) {
    const existing = await prisma.topicIncidence.findFirst({
      where: { topicId: inc.topicId, examBoardId: board.id },
    });
    if (!existing) {
      await prisma.topicIncidence.create({
        data: {
          topicId: inc.topicId,
          examBoardId: board.id,
          weight: inc.weight,
        },
      });
    }
  }

  // 5. Relações Aprovadas
  const approvedRelations = [
    {
      sourceTopicId: topPrincipios,
      targetTopicId: topAtos,
      type: RelationType.PREREQUISITE,
      evidence: 'A validade dos atos administrativos pressupõe estrita conformidade com os princípios da legalidade e moralidade.',
      source: 'Lei 9.784/99, art. 2º; CF/88, art. 37',
      status: RelationStatus.APPROVED,
      confidence: 0.95,
    },
    {
      sourceTopicId: subDomicilio,
      targetTopicId: subPolicia,
      type: RelationType.CONFUSED_WITH,
      evidence: 'As bancas frequentemente exploram os limites do poder de polícia fiscalizatório versus a garantia da inviolabilidade domiciliar.',
      source: 'STF, RE 603.616/RO (Tema 280)',
      status: RelationStatus.APPROVED,
      confidence: 0.91,
    },
    {
      sourceTopicId: topDireitos,
      targetTopicId: topControle,
      type: RelationType.CO_OCCURRING,
      evidence: 'Questões discursivas de alto nível costumam demandar controle concentrado para sanar ofensas a preceitos fundamentais.',
      source: 'STF, ADPF 54; ADI 4.430',
      status: RelationStatus.APPROVED,
      confidence: 0.88,
    },
  ];

  for (const rel of approvedRelations) {
    const existing = await prisma.topicRelation.findUnique({
      where: {
        sourceTopicId_targetTopicId_type: {
          sourceTopicId: rel.sourceTopicId,
          targetTopicId: rel.targetTopicId,
          type: rel.type,
        },
      },
    });

    if (!existing) {
      await prisma.topicRelation.create({
        data: rel,
      });
    }
  }

  // 6. Calcula posições de layout espacial determinístico estável via MapService
  console.log('Calculando coordenadas estáveis do layout via d3-force...');
  const { mapService } = await import('../services/map.service.js');
  await mapService.getGraph();

  // 7. Simula overlay para os primeiros usuários caso existam
  const users = await prisma.user.findMany({ take: 2 });
  for (const user of users) {
    await prisma.userTopicMastery.upsert({
      where: {
        userId_topicId: {
          userId: user.id,
          topicId: topAtos,
        },
      },
      update: {},
      create: {
        userId: user.id,
        topicId: topAtos,
        masteryScore: 82.5,
        state: 'MASTERED',
        accuracy: 0.85,
        attemptsCount: 20,
        correctCount: 17,
        dueFlashcardsCount: 3,
        priorityScore: 35.0,
      },
    });

    await prisma.userTopicMastery.upsert({
      where: {
        userId_topicId: {
          userId: user.id,
          topicId: topDireitos,
        },
      },
      update: {},
      create: {
        userId: user.id,
        topicId: topDireitos,
        masteryScore: 55.0,
        state: 'IN_PROGRESS',
        accuracy: 0.6,
        attemptsCount: 10,
        correctCount: 6,
        dueFlashcardsCount: 2,
        priorityScore: 50.0,
      },
    });
  }

  console.log('--- Semeadura concluída com sucesso! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
