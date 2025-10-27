// src/controllers/jobController.js
const jobService = require('../services/jobService');
const { PrismaClient } = require('@prisma/client'); // Importe o PrismaClient
const prisma = new PrismaClient(); // Crie uma instância
const listAllJobs = async (req, res) => {
  try {
    // req.query contém os parâmetros da URL (ex: ?search=valor&minBudget=outro_valor)
    const jobs = await jobService.getAllJobs(req.query);
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar vagas.', error: error.message });
  }
};

// --- FUNÇÃO DE CRIAR VAGA REFATORADA ---
const createNewJob = async (req, res) => {
  try {
    const { userId } = req.user; // Pega o ID do User logado

    // 1. Encontra o ClientProfile associado a este User
    const clientProfile = await prisma.clientProfile.findUnique({
      where: {
        userId: userId,
      },
    });

    // 2. Se não encontrar um perfil de cliente, nega o acesso.
    // Isso também garante que um Freelancer não possa postar vagas.
    if (!clientProfile) {
      return res.status(403).json({ message: 'Apenas clientes podem postar vagas.' });
    }

    // 3. Se encontrou, usa o ID do perfil para criar a vaga
    const job = await jobService.createJob(req.body, clientProfile.id);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar vaga.', error: error.message });
  }
};


// --- NOVA FUNÇÃO PARA PEGAR UMA VAGA ---
const getSingleJob = async (req, res) => {
   try {
     const { id } = req.params;
     const currentUserId = req.user?.userId;
     const job = await jobService.getJobById(id, currentUserId);

     if (!job) {
       return res.status(404).json({ message: 'Vaga não encontrada.' });
     }

     res.status(200).json(job);
   } catch (error) {
     res.status(500).json({ message: 'Erro ao buscar vaga.', error: error.message });
   }
 };

// --- NOVA FUNÇÃO PARA SE CANDIDATAR ---
const applyToJob = async (req, res) => {
  try {
    const { id: jobId } = req.params; // Pega o ID da vaga da URL
    const { userId: applicantId } = req.user; // Pega o ID do usuário do token (via middleware)

    const application = await jobService.applyForJob(jobId, applicantId);

    res.status(201).json({ message: 'Candidatura enviada com sucesso!', application });
  } catch (error) {
    // Se o erro for de duplicata, retorna um status 'Conflict'
    if (error.message === 'Você já se candidatou para esta vaga.') {
      return res.status(409).json({ message: error.message });
    }
    // Para outros erros, retorna um erro de servidor
    res.status(500).json({ message: 'Erro ao processar candidatura.', error: error.message });
  }
};

// --- NOVA FUNÇÃO PARA ATUALIZAR VAGA ---
const updateJob = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { userId } = req.user;
    // Encontra o perfil de cliente associado
    const clientProfile = await prisma.clientProfile.findUnique({ where: { userId } });
    if (!clientProfile) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }
    // Passa o ID do perfil para o serviço
    const result = await jobService.updateJob(jobId, clientProfile.id, req.body);
    if (result.count === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada.' });
    }
    res.status(200).json({ message: 'Vaga atualizada com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar vaga.', error: error.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { userId } = req.user;
    // Encontra o perfil de cliente associado
    const clientProfile = await prisma.clientProfile.findUnique({ where: { userId } });
    if (!clientProfile) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }
    // Passa o ID do perfil para o serviço
    const result = await jobService.deleteJob(jobId, clientProfile.id);
    if (result.count === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada.' });
    }
    res.status(200).json({ message: 'Vaga removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover vaga.', error: error.message });
  }
};

const listJobApplicants = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const { userId } = req.user;
        const clientProfile = await prisma.clientProfile.findUnique({ where: { userId } });
        if (!clientProfile) {
            return res.status(403).json({ message: "Acesso negado." });
        }
        const applicants = await jobService.getApplicantsForJob(jobId, clientProfile.id, req.query);
        res.status(200).json(applicants);
    } catch (error) {
        if (error.message === 'Acesso negado.') {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Erro ao buscar candidatos.', error: error.message });
    }
};


module.exports = {
  listAllJobs,
  createNewJob,
  getSingleJob,
  applyToJob,
  updateJob,
  deleteJob,
  listJobApplicants,
};