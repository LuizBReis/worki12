const applicationService = require('../services/applicationService');

const updateStatus = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const { status: newStatus } = req.body;
    const { userId: currentUserId } = req.user;

    // A lógica de validação do status está correta
    if (!newStatus || !['PENDING', 'SHORTLISTED', 'REJECTED'].includes(newStatus)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    // A chamada ao serviço está correta
    const result = await applicationService.updateApplicationStatus(
      applicationId, 
      newStatus, 
      currentUserId
    );

    // A validação de resultado foi movida para o service, então podemos simplificar aqui.
    res.status(200).json(result);

  } catch (error) {
    // ==========================================================
    // ✅ A ÚNICA MUDANÇA É ADICIONAR ESTA LINHA:
    // Ela vai forçar a exibição do erro completo no terminal.
    // ==========================================================
    console.error('ERRO DETALHADO AO ATUALIZAR STATUS:', error);

    res.status(500).json({ message: 'Erro ao atualizar status da candidatura.', error: error.message });
  }
};

const deleteMyApplication = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const { userId } = req.user;

    const result = await applicationService.deleteApplication(applicationId, userId);
    if (!result || result.count === 0) {
      return res.status(404).json({ message: 'Candidatura não encontrada.' });
    }

    res.status(200).json({ message: 'Candidatura deletada com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar candidatura.', error: error.message });
  }
};

const cancelApplication = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const { userId } = req.user;

    const result = await applicationService.cancelApplication(applicationId, userId);
    return res.status(200).json(result);
  } catch (error) {
    const msg = String(error.message || '');
    if (msg.includes('Acesso negado') || msg.includes('não encontrada')) {
      return res.status(403).json({ message: 'Acesso negado ou candidatura não encontrada.' });
    }
    if (msg.includes('não pode ser cancelada')) {
      return res.status(409).json({ message: error.message });
    }
    if (msg.includes('conversa está bloqueada')) {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Erro ao cancelar candidatura.', error: error.message });
  }
};

const requestClosure = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const { userId: currentUserId } = req.user;

    const result = await applicationService.requestJobClosure(applicationId, currentUserId);
    res.status(200).json({ message: 'Solicitação de encerramento enviada.' });

  } catch (error) {
    console.error('ERRO DETALHADO AO SOLICITAR ENCERRAMENTO:', error);
    if (error.message.includes('Acesso negado')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erro ao solicitar encerramento.', error: error.message });
  }
};

const confirmClosure = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const { userId: currentUserId } = req.user;

    const result = await applicationService.confirmJobClosure(applicationId, currentUserId);
    res.status(200).json({ message: 'Encerramento confirmado. Agora vocês podem se avaliar.' });

  } catch (error) {
    console.error('ERRO DETALHADO AO CONFIRMAR ENCERRAMENTO:', error);
    if (error.message.includes('Acesso negado')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erro ao confirmar encerramento.', error: error.message });
  }
};

const reviewClient = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const { userId: freelancerId, role } = req.user;
    const { rating, comment } = req.body;

    console.log('Review Client Request =>', { applicationId, freelancerId, role, rating, comment });

    if (rating == null || typeof rating !== 'number' || rating < 1 || rating > 5) {
       return res.status(400).json({ message: 'A nota (rating) deve ser um número entre 1 e 5.' });
    }

    const result = await applicationService.submitClientReview(applicationId, freelancerId, { rating, comment });
    res.status(201).json(result);

  } catch (error) {
    console.error('ERRO DETALHADO AO AVALIAR CLIENTE:', error);

    if (error.code === 'P2002' || (error.message && error.message.includes('Unique constraint'))) {
      return res.status(409).json({ message: 'Você já avaliou este usuário para esta candidatura.' });
    }
    if (error.message.includes('Acesso negado')) {
      return res.status(403).json({ message: error.message });
    }
    if (error.message.includes('Encerramento não confirmado')) {
      return res.status(409).json({ message: error.message });
    }
    if (error.message.includes('Você já avaliou')) {
      return res.status(409).json({ message: error.message });
    }
    if (error.message.includes('Candidatura não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erro ao enviar avaliação.', error: error.message });
  }
};

const reviewFreelancer = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const { userId: currentUserId, role } = req.user;
    const { rating, comment } = req.body;

    console.log('Review Freelancer Request =>', { applicationId, currentUserId, role, rating, comment });

     if (rating == null || typeof rating !== 'number' || rating < 1 || rating > 5) {
       return res.status(400).json({ message: 'A nota (rating) deve ser um número entre 1 e 5.' });
    }

    const result = await applicationService.submitFreelancerReview(applicationId, currentUserId, { rating, comment });
    res.status(201).json(result);

  } catch (error) {
    console.error('ERRO DETALHADO AO AVALIAR FREELANCER:', error);

    if (error.code === 'P2002' || (error.message && error.message.includes('Unique constraint'))) {
      return res.status(409).json({ message: 'Você já avaliou este usuário para esta candidatura.' });
    }
    if (error.message.includes('Acesso negado')) {
      return res.status(403).json({ message: error.message });
    }
    if (error.message.includes('Encerramento não confirmado')) {
      return res.status(409).json({ message: error.message });
    }
    if (error.message.includes('Você já avaliou')) {
      return res.status(409).json({ message: error.message });
    }
    if (error.message.includes('Candidatura não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erro ao enviar avaliação.', error: error.message });
  }
};

module.exports = {
  updateStatus,
  deleteMyApplication,
  requestClosure,
  confirmClosure,
  reviewClient,
  reviewFreelancer,
  cancelApplication,
};
