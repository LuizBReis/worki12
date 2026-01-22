const express = require('express');
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Rota para iniciar (ou encontrar) uma conversa
router.post('/start', authMiddleware, messageController.startConversation);

router.get('/', authMiddleware, messageController.getMyConversations);

// Rota para listar todas as mensagens de uma conversa específica
router.get('/:id', authMiddleware, messageController.getMessages);

// Rota para ENVIAR uma mensagem em uma conversa específica
router.post('/:id', authMiddleware, messageController.sendMessage);

module.exports = router;