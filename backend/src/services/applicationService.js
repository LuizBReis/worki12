// backend/src/services/applicationService.js

const { PrismaClient, JobStatus } = require('@prisma/client');
const prisma = new PrismaClient();
const messageService = require('./messageService');
const { getIO } = require('../socket'); // ✅ Importado o getIO

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
  
  await messageService.createMessage(
   conversation.id,
   currentUserId,
   messageContent,
   true // isSystemMessage = true
  );
 }
 else if (newStatus === 'REJECTED') {
  const messageContent = `Olá ${application.applicant.firstName}. Agradecemos seu interesse na vaga "${application.job.title}", mas infelizmente decidimos seguir com outros candidatos. Desejamos sucesso na sua busca!`;
  
  await messageService.createMessage(
   conversation.id,
   currentUserId,
   messageContent,
   true // isSystemMessage = true
  );
  
  await prisma.conversation.update({
   where: { id: conversation.id },
   data: { isLocked: true },
  });
 }
};

const deleteApplication = async (applicationId, applicantId) => {
 const result = await prisma.jobApplication.deleteMany({
  where: {
   id: applicationId,
   applicantId: applicantId,
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
     author: { select: { userId: true, user: { select: { firstName: true } } } }
    } 
   },
   applicant: { select: { id: true, firstName: true } }
  }
 });

 if (!application) {
  throw new Error('Acesso negado ou candidatura não encontrada.');
 }

 // Atualiza o status para PENDING_CLOSE
 await prisma.jobApplication.update({
  where: { id: applicationId },
  data: { jobStatus: JobStatus.PENDING_CLOSE }
 });

 // Determina quem está solicitando
 const isClient = requesterId === application.job.author.userId;
 const requesterName = isClient ? (application.job.author.user.firstName || 'O cliente') : application.applicant.firstName;
 

 // --- AJUSTE 1: REMOVIDO O ENVIO DE MENSAGEM PARA O CHAT ---
 // A linha abaixo foi comentada para não poluir o chat.
 /*
 // Busca ou cria conversa
 let conversation = await prisma.conversation.findUnique({
  where: { applicationId: applicationId },
 });
 if (!conversation) {
  conversation = await prisma.conversation.create({
   data: { applicationId: applicationId },
  });
 }
 const messageContent = `${requesterName} solicitou o encerramento deste trabalho. Aguardando confirmação da outra parte.`;
 await messageService.createMessage(
  conversation.id,
  requesterId,
  messageContent,
  true // isSystemMessage = true
 );
 */
 // --- FIM DO AJUSTE 1 ---


 // --- LÓGICA DE NOTIFICAÇÃO DO "SININHO" ---
 const io = getIO();
 let recipientId = null;
 let notificationMessage = "";

 if (isClient) {
  recipientId = application.applicantId; // Notifica o Freelancer
  notificationMessage = `${requesterName} solicitou o encerramento do trabalho "${application.job.title}".`;
 } else {
  recipientId = application.job.author.userId; // Notifica o Cliente
  notificationMessage = `${requesterName} solicitou o encerramento do trabalho "${application.job.title}".`;
 }

 if (recipientId) {
  io.to(`user:${recipientId}`).emit('new_notification', {
   message: notificationMessage,
   // --- AJUSTE 2: LINK ALTERADO PARA "MEUS TRABALHOS" ---
   link: `/my-jobs` 
  });
 }
 // --- FIM DA LÓGICA DE NOTIFICAÇÃO ---

 return { success: true, message: 'Solicitação de encerramento enviada.' };
};

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


const confirmJobClosure = async (applicationId, confirmerId) => {
 const application = await prisma.jobApplication.findFirst({
  where: {
   id: applicationId,
   jobStatus: JobStatus.PENDING_CLOSE, // Só pode confirmar se estiver pendente
   OR: [
    { applicantId: confirmerId }, // O confirmante é o Freelancer
    { job: { author: { userId: confirmerId } } } // O confirmante é o Cliente
   ]
  },
  include: {
   job: { 
    select: { 
     title: true,
     author: { select: { userId: true, user: { select: { firstName: true } } } } 
    } 
   },
   applicant: { select: { id: true, firstName: true } }
  }
 });

 if (!application) {
  throw new Error('Acesso negado ou não há solicitação de encerramento pendente.');
 }

 // Atualiza o status do trabalho para COMPLETED
 await prisma.jobApplication.update({
  where: { id: applicationId },
  data: { jobStatus: JobStatus.COMPLETED } 
 });

 // --- AJUSTE 3: REMOVIDO O ENVIO DE MENSAGEM PARA O CHAT ---
 // O código abaixo foi comentado para não poluir o chat com a confirmação.
 /*
 // Busca conversa
 const conversation = await prisma.conversation.findUnique({
  where: { applicationId: applicationId },
 });

 if (conversation) {
  const messageContent = `Trabalho "${application.job.title}" foi marcado como concluído. Obrigado!`;
  
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
 */
 // --- FIM DO AJUSTE 3 ---


 // --- ✅ LÓGICA DE NOTIFICAÇÃO DO "SININHO" ---
 const io = getIO();
 const isClient = confirmerId === application.job.author.userId;

 let recipientId = null;
 let notificationMessage = "";

 if (isClient) {
  // Cliente confirmou (o freela que pediu)
  recipientId = application.applicantId;
  notificationMessage = `O cliente confirmou o encerramento do trabalho "${application.job.title}".`;
 } else {
  // Freelancer confirmou (o cliente que pediu - cenário principal)
  recipientId = application.job.author.userId;
  notificationMessage = `${application.applicant.firstName} confirmou o encerramento do trabalho "${application.job.title}".`;
 }
 
 if (recipientId) {
  io.to(`user:${recipientId}`).emit('new_notification', {
   message: notificationMessage,
   // --- AJUSTE 4: LINK ALTERADO PARA "MEUS TRABALHOS" ---
   link: `/my-jobs` 
  });
 }
 // --- FIM DA LÓGICA DE NOTIFICAÇÃO ---

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