// src/routes/profileRoutes.js
const express = require('express');
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware'); // Importa o middleware

const router = express.Router();

// Aplica o middleware a esta rota.
// A requisição primeiro passa pelo authMiddleware e, se for válida, chega ao getMyProfile.
router.get('/me', authMiddleware, profileController.getMyProfile);
router.patch('/me', authMiddleware, profileController.updateMyProfile);

// --- NOVAS ROTAS PARA GERENCIAR SKILLS ---
router.post('/me/skills', authMiddleware, profileController.addSkill);
router.delete('/me/skills', authMiddleware, profileController.removeSkill);

// --- NOVAS ROTAS PARA GERENCIAR EXPERIÊNCIAS ---
router.post('/me/experience', authMiddleware, profileController.addExperience);
router.patch('/me/experience/:expId', authMiddleware, profileController.updateExperience);
router.delete('/me/experience/:expId', authMiddleware, profileController.deleteExperience);

router.delete('/me', authMiddleware, profileController.deleteMyAccount);
router.post('/me/change-password', authMiddleware, profileController.changePassword);
// --- NOVA ROTA PARA MUDAR O E-MAIL ---
router.post('/me/change-email', authMiddleware, profileController.changeEmail);

// --- NOVAS ROTAS PARA A PÁGINA "MY JOBS" ---
router.get('/me/jobs', authMiddleware, profileController.getMyPostedJobs);
router.get('/me/applications', authMiddleware, profileController.getMyApplications);

module.exports = router;