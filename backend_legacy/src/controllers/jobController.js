// src/controllers/jobController.js
const jobService = require('../services/jobService');
const { PrismaClient } = require('@prisma/client'); // Importe o PrismaClient
const prisma = new PrismaClient(); // Crie uma instância
const { notifyUser } = require('../services/realtimeService'); // ✅ Migrado para Supabase
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

    // ✅ Emite uma notificação para o próprio cliente confirmando a criação
    try {
      const message = `Sua vaga "${job.title}" foi criada com sucesso.`;
      await notifyUser(userId, 'new_notification', {
        message,
        link: '/my-jobs'
      });
    } catch (e) {
      console.error('Falha ao emitir notificação de criação de vaga:', e);
    }

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
    // ✅ Notifica o autor da vaga (cliente) sobre a nova candidatura
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          title: true,
          author: { select: { userId: true, user: { select: { firstName: true } } } }
        }
      });
      if (job?.author?.userId) {
        const message = `Nova candidatura recebida na vaga "${job.title}".`;
        await notifyUser(job.author.userId, 'new_notification', {
          message,
          link: '/my-jobs'
        });
      }
    } catch (e) {
      console.error('Falha ao emitir notificação de nova candidatura:', e);
    }

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
    await jobService.updateJob(jobId, clientProfile.id, req.body);
    res.status(200).json({ message: 'Vaga atualizada com sucesso.' });
  } catch (error) {
    console.error('ERRO DETALHADO AO ATUALIZAR VAGA:', error);
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('acesso negado')) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }
    if (msg.includes('não encontrada')) {
      return res.status(404).json({ message: 'Vaga não encontrada.' });
    }
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
    res.status(200).json(result);
  } catch (error) {
    console.error('ERRO DETALHADO AO REMOVER VAGA:', error);
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('acesso negado')) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }
    if (msg.includes('não encontrada')) {
      return res.status(404).json({ message: 'Vaga não encontrada.' });
    }
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