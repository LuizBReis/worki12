const messageService = require('../services/messageService');

const startConversation = async (req, res) => {
  try {
    const { applicationId } = req.body; // O ID virá do corpo da requisição
    const { userId: currentUserId } = req.user;

    if (!applicationId) {
      return res.status(400).json({ message: 'O ID da candidatura é obrigatório.' });
    }

    const conversation = await messageService.findOrCreateConversation(applicationId, currentUserId);
    res.status(200).json(conversation);
  } catch (error) {
    if (error.message.includes('Acesso negado')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erro ao iniciar conversa.', error: error.message });
  }
};

const getMyConversations = async (req, res) => {
  try {
    const { userId } = req.user;
    const conversations = await messageService.getConversationsForUser(userId);
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar conversas.', error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { userId } = req.user;
    const messages = await messageService.getMessagesForConversation(conversationId, userId);
    res.status(200).json(messages);
  } catch (error) {
    if (error.message.includes('Acesso negado')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erro ao buscar mensagens.', error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { userId: senderId } = req.user;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'O conteúdo da mensagem é obrigatório.' });
    }

    const message = await messageService.createMessage(conversationId, senderId, content);
    res.status(201).json(message);
  } catch (error) {
    if (error.message.includes('Acesso negado')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erro ao enviar mensagem.', error: error.message });
  }
};

module.exports = {
  startConversation,
  getMyConversations,
  getMessages,
  sendMessage, // Exporte
};