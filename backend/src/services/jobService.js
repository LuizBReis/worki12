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
      skills: { select: { name: true } },
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
      skills: { select: { name: true } },
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
      skills: { select: { name: true } },
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
  // Atualiza dados básicos
  const updatedCount = await prisma.job.updateMany({
    where: {
      id: jobId,
      authorId: clientProfileId,
    },
    data: rest,
  });

  // Se houver skills, sincroniza
  if (updatedCount.count > 0 && Array.isArray(requiredSkills)) {
    // Primeiro, desconecta todas
    await prisma.job.update({
      where: { id: jobId },
      data: {
        skills: { set: [] },
      },
    });
    // Depois conecta/cria as novas
    await prisma.job.update({
      where: { id: jobId },
      data: {
        skills: {
          connectOrCreate: requiredSkills.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
    });
  }

  return { count: updatedCount.count };
};

const deleteJob = async (jobId, clientProfileId) => {
  return prisma.job.deleteMany({
    where: {
      id: jobId,
      authorId: clientProfileId,
    },
  });
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
  return prisma.jobApplication.findMany({
    where: whereClause,
    include: {
      applicant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          freelancerProfile: { select: { description: true, skills: { select: { name: true } } } },
        },
      },
    },
  });
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