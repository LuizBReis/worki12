// backend/src/services/jobService.js (VERSÃO ATUALIZADA)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- ✅ FUNÇÃO getAllJobs ATUALIZADA ---
const getAllJobs = async (filters) => {
  // 1. Pega os novos filtros (city, state, address)
  const { search, minBudget, maxBudget, skills, match, city, state, address } = filters;
  
  const whereClause = {}; // Filtros da vaga (Job)
  const authorWhere = {}; // Filtros do autor (ClientProfile)

  // Filtro de Título (Job)
  if (search) {
    whereClause.title = { contains: search, mode: 'insensitive' };
  }
  // Filtro de Orçamento (Job)
  if (minBudget) {
    whereClause.budget = { ...whereClause.budget, gte: parseFloat(minBudget) };
  }
  if (maxBudget) {
    whereClause.budget = { ...whereClause.budget, lte: parseFloat(maxBudget) };
  }

  // Filtro por skills (Job)
  if (skills) {
    const skillList = String(skills)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (skillList.length > 0) {
      if ((match || 'any') === 'all') {
        // Todas as skills
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

  // --- ✅ NOVOS FILTROS DE LOCALIZAÇÃO (ClientProfile) ---
  // Estes filtros são aplicados ao autor (ClientProfile) da vaga
  if (city) {
    authorWhere.city = { contains: city, mode: 'insensitive' };
  }
  if (state) {
    authorWhere.state = { equals: state }; // Busca exata para o Estado
  }
  if (address) {
    // Filtra pelo endereço completo (sua ideia)
    authorWhere.address = { contains: address, mode: 'insensitive' };
  }

  // 4. Adiciona o filtro de autor (se houver) ao filtro principal
  if (Object.keys(authorWhere).length > 0) {
    whereClause.author = authorWhere;
  }
  // --- FIM DA NOVA LÓGICA ---

  const jobs = await prisma.job.findMany({
    where: whereClause, // O whereClause agora contém { title: ..., author: { city: ... } }
    include: {
      author: {
        select: {
          id: true,
          companyName: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      skills: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return jobs;
};

// --- O RESTANTE DO ARQUIVO CONTINUA IGUAL ---

const createJob = async (jobData, clientProfileId) => {
 const { title, description, budget, requiredSkills } = jobData;
 return prisma.job.create({
  data: {
   title,
   description,
   budget,
   author: { connect: { id: clientProfileId } },
   skills: requiredSkills && requiredSkills.length > 0
    ? {
      connectOrCreate: requiredSkills.map((name) => ({
       where: { name },
       create: { name },
      })),
     }
    : undefined,
  },
  include: {
   author: {
    select: {
     id: true,
     companyName: true,
     user: { select: { firstName: true, lastName: true } },
    },
   },
   skills: { select: { id: true, name: true } },
  },
 });
};

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
   skills: { select: { id: true, name: true } },
  },
 });
 if (!job) return null;
 if (currentUserId) {
  const application = await prisma.jobApplication.findUnique({
   where: {
    jobId_applicantId: {
     jobId: jobId,
     applicantId: currentUserId,
    },
   },
  });
  job.hasApplied = !!application;
 }
  // Renomeia 'skills' para 'requiredSkills' para o frontend
 job.requiredSkills = job.skills;
 delete job.skills;
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
 const { requiredSkills, ...rest } = jobData; 
 const updatedJobMeta = await prisma.job.updateMany({
  where: {
   id: jobId,
   authorId: clientProfileId, 
  },
  data: rest,
 });

 if (updatedJobMeta.count === 0) {
   throw new Error('Vaga não encontrada ou acesso negado.');
 }

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

    await prisma.job.update({
      where: { id: jobId },
      data: {
        skills: {
          set: [], // Desconecta todas
          connectOrCreate: requiredSkills.map((name) => ({ // Conecta ou cria as novas
            where: { name },
            create: { name },
          })),
        },
      },
    });
 }
 return getJobById(jobId, null);
};


const deleteJob = async (jobId, clientProfileId) => {
  // Confirma que a vaga pertence ao perfil do cliente
  const job = await prisma.job.findFirst({
    where: { id: jobId, authorId: clientProfileId },
    select: { id: true },
  });
  if (!job) {
    throw new Error('Vaga não encontrada ou acesso negado.');
  }

  // Busca candidaturas da vaga para remover conversas vinculadas antes
  const applications = await prisma.jobApplication.findMany({
    where: { jobId: jobId },
    select: { id: true },
  });
  const applicationIds = applications.map(a => a.id);

  await prisma.$transaction(async (tx) => {
    // Remove conversas vinculadas às candidaturas desta vaga
    if (applicationIds.length > 0) {
      await tx.conversation.deleteMany({
        where: { applicationId: { in: applicationIds } },
      });
    }

    // Remove candidaturas da vaga (reviews e mensagens são cascata pelos FKs existentes)
    await tx.jobApplication.deleteMany({ where: { jobId: jobId } });

    // Remove a vaga
    await tx.job.delete({ where: { id: jobId } });
  });

  return { message: 'Vaga removida com sucesso.' };
};

const getApplicantsForJob = async (jobId, clientProfileId, filters = {}) => {
 const job = await prisma.job.findFirst({
  where: { id: jobId, authorId: clientProfileId },
 });
 if (!job) {
  throw new Error('Acesso negado.');
 }
 const { skill } = filters;
 const whereClause = { jobId };
 if (skill) {
  whereClause.applicant = {
   freelancerProfile: { 
    skills: { some: { name: { contains: skill, mode: 'insensitive' } } },
   },
  };
 }
 
  const applications = await prisma.jobApplication.findMany({
  where: whereClause,
  include: {
   applicant: {
    select: {
     id: true,
     firstName: true,
     lastName: true,
    },
   },
      freelancerReview: { // Pega a review do freelancer
        select: { id: true }
      }
  },
  });

  // Mapeia para adicionar o campo 'hasFreelancerReview'
  return applications.map(app => ({
      ...app,
      hasFreelancerReview: app.freelancerReview !== null,
      freelancerReview: undefined
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