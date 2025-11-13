const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getIO } = require('../socket');

// Função auxiliar para determinar o destinatário de uma mensagem
const getRecipientId = async (conversationId, senderId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      application: {
        include: {
          applicant: { select: { id: true } },
          job: { 
            include: { 
              author: { select: { userId: true } } 
            } 
          }
        }
      }
    }
  });

  if (!conversation) return null;

  const applicantId = conversation.application.applicant.id;
  const employerId = conversation.application.job.author.userId;

  // Retorna o ID do outro usuário (não o remetente)
  return senderId === applicantId ? employerId : applicantId;
};

// Funções existentes (mantidas como estão)
const findOrCreateConversation = async (applicationId) => {
  let conversation = await prisma.conversation.findUnique({
    where: { applicationId },
    include: {
      application: {
        include: {
          job: { 
            include: { 
              author: true 
            } 
          },
          applicant: true
        }
      }
    }
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { applicationId },
      include: {
        application: {
          include: {
            job: { 
              include: { 
                author: true 
              } 
            },
            applicant: true
          }
        }
      }
    });
  }

  return conversation;
};

const getConversationsForUser = async (userId) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      application: {
        OR: [
          { applicantId: userId },
          { job: { author: { userId } } }
        ]
      }
    },
    include: {
      application: {
        include: {
          job: { 
            include: { 
              author: true 
            } 
          },
          applicant: true
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: { id: true, firstName: true }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Reordena pelo horário da última mensagem (ou criação da conversa)
  conversations.sort((a, b) => {
    const aTs = (a.messages && a.messages[0] ? new Date(a.messages[0].createdAt).getTime() : new Date(a.createdAt).getTime());
    const bTs = (b.messages && b.messages[0] ? new Date(b.messages[0].createdAt).getTime() : new Date(b.createdAt).getTime());
    return bTs - aTs;
  });

  return conversations;
};

const getMessagesForConversation = async (conversationId, userId) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      application: {
        OR: [
          { applicantId: userId },
          { job: { author: { userId } } }
        ]
      }
    }
  });

  if (!conversation) {
    throw new Error('Acesso negado para visualizar esta conversa.');
  }

  return await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: { id: true, firstName: true }
      }
    }
  });
};

const createMessage = async (conversationId, senderId, content, isSystemMessage = false) => {
  // 1. Verificação de segurança (com o include)
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      application: {
        OR: [
          { applicantId: senderId },
          { job: { author: { userId: senderId } } }
        ]
      }
    },
    // (O include aqui é para o 'getRecipientId' abaixo)
    include: {
      application: {
        include: {
          applicant: { select: { id: true } },
          job: {
            include: {
              author: { select: { userId: true } }
            }
          }
        }
      }
    }
  });

  if (!conversation) {
    throw new Error('Acesso negado para enviar mensagem nesta conversa.');
  }

  // 2. Cria a nova mensagem
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

  // 3. Determina o destinatário
  // (Usando os dados que já buscamos, em vez de chamar getRecipientId de novo)
  const applicantId = conversation.application.applicant.id;
  const clientId = conversation.application.job.author.userId;
  const recipientId = (senderId === applicantId) ? clientId : applicantId;

  // 4. Emissão via Socket.IO
  const io = getIO();

  // 4a. Emite para a sala da conversa (chat ao vivo)
  io.to(conversationId).emit('receive_message', newMessage);

  // 4b. Emite notificação para a sala pessoal do destinatário
  if (recipientId) {
    
    // --- ✅ A CORREÇÃO ESTÁ AQUI ---
    // Adiciona o prefixo "user:" para bater com a sala do socket.js
    const recipientRoom = `user:${recipientId}`;
    
    io.to(recipientRoom).emit('new_message_notification', {
      conversationId: conversationId,
      message: newMessage,
      isSystemMessage: isSystemMessage
    });

    console.log(`Notificação enviada para ${recipientRoom}`);
  }

  return newMessage;
};

module.exports = {
  findOrCreateConversation,
  getConversationsForUser,
  getMessagesForConversation,
  createMessage,
};