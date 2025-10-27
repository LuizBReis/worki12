const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSuggestedSkills = async () => {
  const skills = await prisma.skill.findMany({
    where: {
      isSuggested: true,
    },
    orderBy: {
      name: 'asc', // Retorna as skills em ordem alfabética
    },
  });
  // Limpeza básica: remove nomes vazios/brancos
  return skills.filter((s) => typeof s.name === 'string' && s.name.trim().length > 0);
};

module.exports = {
  getSuggestedSkills,
};