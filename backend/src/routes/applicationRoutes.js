const express = require('express');
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

const router = express.Router();

// Rota para atualizar o status de uma candidatura específica
router.patch('/:id/status', authMiddleware, applicationController.updateStatus);

// --- NOVA ROTA PARA DELETAR UMA CANDIDATURA ---
router.delete('/:id', authMiddleware, applicationController.deleteMyApplication);

// Cliente solicita o encerramento
router.patch('/:id/request-closure', authMiddleware, applicationController.requestClosure);

// Freelancer confirma o encerramento
router.patch('/:id/confirm-closure', authMiddleware, applicationController.confirmClosure);

// Freelancer avalia o Cliente (só freelancers podem acessar)
router.post('/:id/review-client', authMiddleware, checkRole(['FREELANCER']), applicationController.reviewClient);

// Cliente avalia o Freelancer (só clientes podem acessar)
router.post('/:id/review-freelancer', authMiddleware, checkRole(['CLIENT']), applicationController.reviewFreelancer);

module.exports = router;