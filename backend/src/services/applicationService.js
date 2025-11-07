const { PrismaClient, JobStatus } = require('@prisma/client');
const prisma = new PrismaClient();
const messageService = require('./messageService');

const updateApplicationStatus = async (applicationId, newStatus, currentUserId) => {
  // 1. Busca candidatura e dados
  const application = await prisma.jobApplication.findFirst({
    where: { id: applicationId, job: { author: { userId: currentUserId } } },
    include: {
      job: { select: { title: true } },
      applicant: { select: { id: true, firstName: true } }
    }
  });
  
  if (!application) {
    throw new Error('Acesso negado ou candidatura não encontrada.');
  }

  // 2. Atualiza o status
  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: newStatus },
  });

  // 3. Busca ou cria conversa
  let conversation = await prisma.conversation.findUnique({
    where: { applicationId: applicationId },
  });
  
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { applicationId: applicationId },
    });
  }

  // 4. Envia mensagens automáticas usando messageService
  if (newStatus === 'SHORTLISTED') {
    const messageContent = `Olá ${application.applicant.firstName}, gostei do seu perfil para a vaga "${application.job.title}" e gostaria de conversar mais.`;
    
    // Usa messageService.createMessage para disparar notificação
    await messageService.createMessage(
      conversation.id,
      currentUserId,
      messageContent,
      true // isSystemMessage = true
    );
  }
  else if (newStatus === 'REJECTED') {
    const messageContent = `Olá ${application.applicant.firstName}. Agradecemos seu interesse na vaga "${application.job.title}", mas infelizmente decidimos seguir com outros candidatos. Desejamos sucesso na sua busca!`;
    
    // Usa messageService.createMessage para disparar notificação
    await messageService.createMessage(
      conversation.id,
      currentUserId,
      messageContent,
      true // isSystemMessage = true
    );
    
    // Trava a conversa
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { isLocked: true },
    });
  }
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

// Função para solicitar encerramento de trabalho
const requestJobClosure = async (applicationId, requesterId) => {
  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      OR: [
        { applicantId: requesterId },
        { job: { author: { userId: requesterId } } }
      ]
    },
    include: {
      job: { 
        select: { 
          title: true,
          author: { select: { userId: true } }
        } 
      },
      applicant: { select: { id: true, firstName: true } }
    }
  });

  if (!application) {
    throw new Error('Acesso negado ou candidatura não encontrada.');
  }

  // Busca ou cria conversa
  let conversation = await prisma.conversation.findUnique({
    where: { applicationId: applicationId },
  });
  
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { applicationId: applicationId },
    });
  }

  // Determina quem está solicitando
  const isClient = requesterId === application.job.author.userId;
  const requesterName = isClient ? 'O cliente' : application.applicant.firstName;
  
  const messageContent = `${requesterName} solicitou o encerramento deste trabalho. Aguardando confirmação da outra parte.`;

  // Envia mensagem automática com notificação
  await messageService.createMessage(
    conversation.id,
    requesterId,
    messageContent,
    true // isSystemMessage = true
  );

  return { success: true, message: 'Solicitação de encerramento enviada.' };
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

// Função para confirmar encerramento
const confirmJobClosure = async (applicationId, confirmerId) => {
  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      OR: [
        { applicantId: confirmerId },
        { job: { author: { userId: confirmerId } } }
      ]
    },
    include: {
      job: { select: { title: true } }
    }
  });

  if (!application) {
    throw new Error('Acesso negado ou candidatura não encontrada.');
  }

  // Atualiza o status para COMPLETED
  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: 'COMPLETED' }
  });

  // Busca conversa
  const conversation = await prisma.conversation.findUnique({
    where: { applicationId: applicationId },
  });

  if (conversation) {
    const messageContent = `Trabalho "${application.job.title}" foi marcado como concluído. Obrigado!`;
    
    // Envia mensagem de confirmação
    await messageService.createMessage(
      conversation.id,
      confirmerId,
      messageContent,
      true // isSystemMessage = true
    );

    // Trava a conversa
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { isLocked: true },
    });
  }

  return { success: true, message: 'Trabalho marcado como concluído.' };
};

module.exports = {
  updateApplicationStatus,
  deleteApplication,
  requestJobClosure,
  confirmJobClosure,
  submitClientReview,
  submitFreelancerReview,
};