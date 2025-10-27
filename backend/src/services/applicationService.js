const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updateApplicationStatus = async (applicationId, newStatus, currentUserId) => {
  // 1. Busca a candidatura e informações importantes em uma única query
  const application = await prisma.jobApplication.findFirst({
    where: { id: applicationId, job: { author: { userId: currentUserId } } },
    include: {
      job: { select: { title: true } },
      applicant: { select: { id: true, firstName: true } }
    }
  });

  // 2. Se não encontrar, nega o acesso
  if (!application) {
    throw new Error('Acesso negado ou candidatura não encontrada.');
  }

  // 3. Atualiza o status da candidatura
  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: newStatus },
  });

  // 4. Lógica de Mensagens Automáticas
  let conversation = await prisma.conversation.findUnique({
    where: { applicationId: applicationId },
  });

  // Se a conversa não existe, cria
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { applicationId: applicationId },
    });
  }

  // Se o status for SELECIONADO...
  if (newStatus === 'SHORTLISTED') {
    const messageContent = `Olá ${application.applicant.firstName}, gostei do seu perfil para a vaga "${application.job.title}" e gostaria de conversar mais.`;
    await prisma.message.create({
      data: {
        content: messageContent,
        conversationId: conversation.id,
        senderId: currentUserId, // O cliente é o remetente
      },
    });
  }

  return { message: 'Status atualizado com sucesso.' };
};

const deleteApplication = async (applicationId, applicantId) => {
  // A cláusula 'where' garante que um usuário só pode deletar sua PRÓPRIA candidatura
  const result = await prisma.jobApplication.deleteMany({
    where: {
      id: applicationId,
      applicantId: applicantId, // Verificação de segurança
    },
  });
  return result;
};

// Cliente solicita o encerramento do job
const requestJobClosure = async (applicationId, currentUserId) => {
  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: { include: { author: true } },
    },
  });

  if (!app || app.job.author.userId !== currentUserId) {
    throw new Error('Acesso negado.');
  }

  if (app.jobStatus === 'COMPLETED' || app.jobStatus === 'REVIEWED') {
    throw new Error('A vaga já foi encerrada.');
  }

  return prisma.jobApplication.update({
    where: { id: applicationId },
    data: { jobStatus: 'PENDING_CLOSE' },
  });
};

// Freelancer confirma o encerramento
const confirmJobClosure = async (applicationId, currentUserId) => {
  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { conversation: true },
  });

  if (!app || app.applicantId !== currentUserId) {
    throw new Error('Acesso negado.');
  }

  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { jobStatus: 'COMPLETED' },
  });

  // Opcional: trava a conversa após encerramento
  if (app.conversation) {
    await prisma.conversation.update({
      where: { id: app.conversation.id },
      data: { isLocked: true },
    });
  }

  return updated;
};

// Freelancer avalia o Cliente
const submitClientReview = async (applicationId, freelancerId, { rating, comment }) => {
  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: { include: { author: true } }, clientReview: true },
  });

  if (!app || app.applicantId !== freelancerId) {
    throw new Error('Acesso negado.');
  }

  if (app.jobStatus !== 'COMPLETED' && app.jobStatus !== 'REVIEWED') {
    throw new Error('Encerramento não confirmado.');
  }

  if (app.clientReview) {
    throw new Error('Você já avaliou este cliente para esta candidatura.');
  }

  const review = await prisma.clientReview.create({
    data: {
      applicationId,
      authorId: freelancerId,
      recipientId: app.job.author.userId,
      rating,
      comment,
    },
  });

  // Se já houver a outra avaliação, marca como REVIEWED
  const hasFreelancerReview = await prisma.freelancerReview.findUnique({
    where: { applicationId },
  });

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { jobStatus: hasFreelancerReview ? 'REVIEWED' : app.jobStatus },
  });

  return review;
};

// Cliente avalia o Freelancer
const submitFreelancerReview = async (applicationId, clientId, { rating, comment }) => {
  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { freelancerReview: true },
  });

  if (!app) {
    throw new Error('Candidatura não encontrada.');
  }

  // Verifica se o clientId é de fato o autor da vaga
  const job = await prisma.job.findUnique({
    where: { id: app.jobId },
    include: { author: true },
  });

  if (!job || job.author.userId !== clientId) {
    throw new Error('Acesso negado.');
  }

  if (app.jobStatus !== 'COMPLETED' && app.jobStatus !== 'REVIEWED') {
    throw new Error('Encerramento não confirmado.');
  }

  if (app.freelancerReview) {
    throw new Error('Você já avaliou este freelancer para esta candidatura.');
  }

  const review = await prisma.freelancerReview.create({
    data: {
      applicationId,
      authorId: clientId,
      recipientId: app.applicantId,
      rating,
      comment,
    },
  });

  const hasClientReview = await prisma.clientReview.findUnique({
    where: { applicationId },
  });

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { jobStatus: hasClientReview ? 'REVIEWED' : app.jobStatus },
  });

  return review;
};

module.exports = {
  updateApplicationStatus,
  deleteApplication,
  requestJobClosure,
  confirmJobClosure,
  submitClientReview,
  submitFreelancerReview,
};