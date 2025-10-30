// backend/src/services/jobService.js (VERSÃO CORRIGIDA)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllJobs = async (filters) => {
  const { search, minBudget, maxBudget, skills, match } = filters;
  const whereClause = {};
  if (search) {
    whereClause.title = { contains: search, mode: 'insensitive' };
  }
  if (minBudget) {
    whereClause.budget = { ...whereClause.budget, gte: parseFloat(minBudget) };
  }
  if (maxBudget) {
    whereClause.budget = { ...whereClause.budget, lte: parseFloat(maxBudget) };
  }

  // Filtro por skills (any/all)
  if (skills) {
    const skillList = String(skills)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (skillList.length > 0) {
      if ((match || 'any') === 'all') {
        // Todas as skills devem estar presentes na vaga
        whereClause.AND = skillList.map((name) => ({
          skills: { some: { name: { equals: name } } },
        }));
      } else {
        // Pelo menos uma skill
        whereClause.skills = {
          some: { name: { in: skillList } },
        };
      }
    }
  }

  const jobs = await prisma.job.findMany({
    where: whereClause,
    include: {
      author: {
        select: {
          id: true,
          companyName: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      skills: { select: { id: true, name: true } }, // ✅ Inclui ID e Nome
    },
    orderBy: { createdAt: 'desc' },
  });
  return jobs;
};

const createJob = async (jobData, clientProfileId) => {
  const { title, description, budget, requiredSkills } = jobData;
  return prisma.job.create({
    data: {
      title,
      description,
      budget,
      author: { connect: { id: clientProfileId } },
      // Conecta ou cria as skills pelo nome
      skills: requiredSkills && requiredSkills.length > 0
        ? {
            connectOrCreate: requiredSkills.map((name) => ({
              where: { name },
              create: { name },
            })),
          }
        : undefined,
    },
    include: { // Retorna o job criado com os dados completos
      author: {
        select: {
          id: true,
          companyName: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      skills: { select: { id: true, name: true } }, // ✅ Inclui ID e Nome
    },
  });
};

// --- ✅ FUNÇÃO getJobById CORRIGIDA ---
const getJobById = async (jobId, currentUserId) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      author: {
        select: {
          id: true,
          companyName: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      // ✅ Certifica-se de incluir ID e NOME das skills
      skills: { select: { id: true, name: true } }, 
    },
  });

  if (!job) return null;

  // Verifica se o usuário atual já se candidatou (se for freelancer)
  if (currentUserId) {
    const application = await prisma.jobApplication.findUnique({
      where: {
        jobId_applicantId: {
          jobId: jobId,
          applicantId: currentUserId,
        },
      },
    });
    job.hasApplied = !!application; // Adiciona true/false
  }

  // Renomeia o campo 'skills' para 'requiredSkills' para consistência com o frontend
  // (O frontend espera 'requiredSkills' na interface Job)
  job.requiredSkills = job.skills;
  delete job.skills; // Remove o campo original 'skills'

  return job;
};


const applyForJob = async (jobId, applicantId) => {
  const existingApplication = await prisma.jobApplication.findUnique({
    where: {
      jobId_applicantId: { jobId, applicantId },
    },
  });
  if (existingApplication) {
    throw new Error('Você já se candidatou para esta vaga.');
  }
  return prisma.jobApplication.create({
    data: { jobId, applicantId },
  });
};

const updateJob = async (jobId, clientProfileId, jobData) => {
  const { requiredSkills, ...rest } = jobData; // Separa skills dos outros dados

  // 1. Atualiza dados básicos da vaga (title, description, budget)
  const updatedJobMeta = await prisma.job.updateMany({
    where: {
      id: jobId,
      authorId: clientProfileId, // Segurança: só o autor pode editar
    },
    data: rest,
  });

  // Se a atualização dos dados básicos falhou (job não encontrado ou não pertence ao user), lança erro
  if (updatedJobMeta.count === 0) {
      throw new Error('Vaga não encontrada ou acesso negado.');
  }

  // 2. Sincroniza as skills (se `requiredSkills` foi enviado)
  if (Array.isArray(requiredSkills)) {
    // Busca os IDs das skills existentes pelos nomes fornecidos
    const skillsToConnect = await prisma.skill.findMany({
        where: { name: { in: requiredSkills } },
        select: { id: true }
    });
    const skillIdsToConnect = skillsToConnect.map(s => s.id);

    // Identifica skills que precisam ser criadas
    const existingSkillNames = skillsToConnect.map(s => s.name);
    const skillsToCreate = requiredSkills.filter(name => !existingSkillNames.includes(name));

    // Atualiza a relação: desfaz todas as conexões antigas e conecta/cria as novas
    await prisma.job.update({
      where: { id: jobId },
      data: {
        skills: {
          // Desconecta todas as skills atuais (set: [])
          set: [], 
          // Conecta as skills existentes encontradas pelo ID
          connect: skillIdsToConnect.map(id => ({ id })),
          // Cria as novas skills que não foram encontradas
          create: skillsToCreate.map(name => ({ name })),
        },
      },
    });
  }

  // 3. Retorna a vaga atualizada completa
  return getJobById(jobId, null); // Reutiliza a função getJobById para buscar com includes
};


const deleteJob = async (jobId, clientProfileId) => {
  // Deleta a vaga, garantindo que pertence ao ClientProfile correto
  const result = await prisma.job.deleteMany({
    where: {
      id: jobId,
      authorId: clientProfileId, // Segurança
    },
  });
   if (result.count === 0) throw new Error('Vaga não encontrada ou acesso negado.');
   return { message: 'Vaga removida com sucesso.' };
};

// --- Função getApplicantsForJob ATUALIZADA ---
const getApplicantsForJob = async (jobId, clientProfileId, filters = {}) => {
  // 1. Verifica se a vaga existe e pertence ao ClientProfile logado
  const job = await prisma.job.findFirst({
    where: { id: jobId, authorId: clientProfileId }, // Segurança
  });
  if (!job) {
    throw new Error('Acesso negado ou vaga não encontrada.');
  }

  // 2. Monta a condição de busca (incluindo filtro de skill)
  const { skill } = filters;
  const whereClause = { jobId };
  if (skill) {
    whereClause.applicant = {
      freelancerProfile: {
        skills: { some: { name: { contains: skill, mode: 'insensitive' } } },
      },
    };
  }

  // 3. Busca as candidaturas, incluindo a revisão do freelancer
  const applications = await prisma.jobApplication.findMany({
    where: whereClause,
    include: {
      applicant: { // Dados do candidato
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      freelancerReview: { // Relação 1-para-1
          select: { id: true } // Só precisamos saber se existe
      }
    },
    orderBy: { createdAt: 'asc' }
  });

   // 4. Adiciona o campo `hasFreelancerReview`
   return applications.map(app => ({
      ...app,
      hasFreelancerReview: app.freelancerReview !== null,
      freelancerReview: undefined // Remove o objeto original
  }));
};


module.exports = {
  getAllJobs,
  createJob,
  getJobById,
  applyForJob,
  updateJob,
  deleteJob,
  getApplicantsForJob,
};