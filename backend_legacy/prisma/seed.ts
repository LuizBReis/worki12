/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  const skillsToCreate = [
        'Atendimento ao Cliente',
        'Comunicação Interpessoal',
        'Vendas e Persuasão',
        'Trabalho em Equipe',
        'Proatividade',
        'Flexibilidade e Adaptabilidade',
        'Resiliência',
        'Multitarefa',
        'Liderança',
        'Negociação',
        'Empatia',
        'Organização',
        'Resolução de Conflitos',
        'Gerenciamento de Tempo',

        // Skills de Eventos e Hospitalidade
        'Operação de Caixa',
        'Serviço de Garçom / Garçonete',
        'Bartending / Coquetelaria',
        'Barista / Preparo de Café',
        'Recepção de Eventos',
        'Promoção de Eventos',
        'Fotografia',

        // Outras
        'Inglês Fluente',
        'Espanhol Fluente'
  ];

  for (const skillName of skillsToCreate) {
    await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: {
        name: skillName,
        isSuggested: true, // Marcamos como uma sugestão
      },
    });
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });