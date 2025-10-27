const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getIO } = require('../socket');

const findOrCreateConversation = async (applicationId, currentUserId) => {
  // 1. Busca a candidatura para garantir que o usuário logado (cliente) é o dono da vaga
  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job: {
        author: {
          userId: currentUserId,
        },
      },
    },
  });

  // 2. Se não encontrar (ou se o usuário não for o dono), nega o acesso
  if (!application) {
    throw new Error('Acesso negado ou candidatura não encontrada.');
  }

  // 3. Tenta encontrar uma conversa que já exista para esta candidatura
  let conversation = await prisma.conversation.findUnique({
    where: { applicationId: applicationId },
  });

  // 4. Se não encontrar, cria uma nova
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        applicationId: applicationId,
      },
    });
  }

  return conversation;
};

// --- NOVA FUNÇÃO: BUSCAR TODAS AS CONVERSAS DE UM USUÁRIO ---
const getConversationsForUser = async (userId) => {
  return prisma.conversation.findMany({
    where: {
      // A condição OR busca conversas onde o usuário logado é
      // ou o candidato (applicant) ou o dono da vaga (cliente).
      application: {
        OR: [
          { applicantId: userId }, // Onde eu sou o candidato
          { job: { author: { userId: userId } } } // Onde eu sou o dono da vaga
        ]
      }
    },
    include: {
      // Incluímos os dados necessários para exibir na lista
      application: {
        include: {
          applicant: true, // O freelancer
          job: { include: { author: { include: { user: true } } } } // A vaga e o cliente
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

// --- NOVA FUNÇÃO: BUSCAR MENSAGENS DE UMA CONVERSA ---
const getMessagesForConversation = async (conversationId, currentUserId) => {
  // 1. Garante que o usuário logado pertence a esta conversa
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      application: {
        OR: [
          { applicantId: currentUserId },
          { job: { author: { userId: currentUserId } } }
        ]
      }
    }
  });

  if (!conversation) {
    throw new Error('Acesso negado.');
  }

  // 2. Se a permissão estiver ok, busca as mensagens
  return prisma.message.findMany({
    where: { conversationId: conversationId },
    orderBy: { createdAt: 'asc' }, // Mensagens da mais antiga para a mais nova
    include: {
      sender: {
        select: { id: true, firstName: true }
      }
    }
  });
};

const createMessage = async (conversationId, senderId, content) => {
  // 1. Verificação de segurança (seu código original, está perfeito)
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      application: {
        OR: [
          { applicantId: senderId },
          { job: { author: { userId: senderId } } }
        ]
      }
    }
  });

  if (!conversation) {
    throw new Error('Acesso negado para enviar mensagem nesta conversa.');
  }

  // 2. Cria a nova mensagem (seu código original)
  const newMessage = await prisma.message.create({
    data: {
      content: content,
      conversationId: conversationId,
      senderId: senderId,
    },
    include: {
      sender: {
        select: { id: true, firstName: true }
      }
    }
  });

  // 🚀 -> NOVO: Emite a nova mensagem para todos os clientes na "sala" da conversa
const io = getIO();
  io.to(conversationId).emit('receive_message', newMessage);

  return newMessage;
};

module.exports = {
  findOrCreateConversation,
  getConversationsForUser,
  getMessagesForConversation,
  createMessage,
};