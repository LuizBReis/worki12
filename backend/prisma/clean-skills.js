// backend/prisma/clean-skills.js
// Script de limpeza das skills no banco (Prisma + Postgres)
// Ações:
// - Remove skills com nome vazio/branco e sem relações
// - Desmarca isSuggested para skills inválidas (nome em branco) que possuem relações
// - Opcional: normaliza nomes com espaços extras (trim) quando não há conflito

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Iniciando limpeza de skills...');
  const skills = await prisma.skill.findMany({
    include: {
      freelancers: { select: { id: true } },
      jobs: { select: { id: true } },
    },
    orderBy: { name: 'asc' }
  });

  let deleted = 0;
  let updated = 0;
  let suggestedDisabled = 0;

  // Map para detectar duplicatas por case-insensitive na lista (apenas para sugestão)
  const seen = new Map();

  for (const s of skills) {
    const original = s.name;
    const trimmed = typeof original === 'string' ? original.trim() : '';
    const hasRelations = (s.freelancers?.length || 0) + (s.jobs?.length || 0) > 0;

    // 1) Nome vazio/branco
    if (!trimmed) {
      if (!hasRelations) {
        await prisma.skill.delete({ where: { id: s.id } });
        deleted++;
        console.log(`Excluída skill sem nome (id=${s.id}).`);
      } else {
        if (s.isSuggested) {
          await prisma.skill.update({ where: { id: s.id }, data: { isSuggested: false } });
          suggestedDisabled++;
          console.log(`Desmarcada de sugestões (nome vazio) id=${s.id}.`);
        }
        // Mantém a skill devido às relações
      }
      continue;
    }

    // 2) Normalização por trim quando não há conflito
    if (trimmed !== original) {
      try {
        await prisma.skill.update({ where: { id: s.id }, data: { name: trimmed } });
        updated++;
        console.log(`Normalizado nome: "${original}" -> "${trimmed}" (id=${s.id}).`);
      } catch (err) {
        // Pode haver conflito com nome existente
        console.warn(`Conflito ao normalizar "${original}" -> "${trimmed}" (id=${s.id}). Mantendo nome original.`);
        // Como fallback, se estiver sugerida e conflitante, ocultamos da sugestão
        if (s.isSuggested) {
          await prisma.skill.update({ where: { id: s.id }, data: { isSuggested: false } });
          suggestedDisabled++;
          console.log(`Desmarcada de sugestões (conflito de nome) id=${s.id}.`);
        }
      }
    }

    // 3) Duplicatas por case-insensitive (apenas para sugestão)
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      const canonical = seen.get(key);
      if (s.isSuggested) {
        await prisma.skill.update({ where: { id: s.id }, data: { isSuggested: false } });
        suggestedDisabled++;
        console.log(`Desmarcada de sugestões (duplicata ci) id=${s.id}, mantém id=${canonical.id}(${canonical.name}).`);
      }
    } else {
      seen.set(key, { id: s.id, name: trimmed });
    }
  }

  console.log('Resumo da limpeza:');
  console.log(` - Excluídas: ${deleted}`);
  console.log(` - Nomes normalizados: ${updated}`);
  console.log(` - Removidas das sugestões: ${suggestedDisabled}`);

  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error('Erro na limpeza de skills:', err);
  await prisma.$disconnect();
  process.exit(1);
});