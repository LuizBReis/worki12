// src/routes/profileRoutes.js
const express = require('express');
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware'); // Importa o middleware
const { uploadAvatar, uploadVideo } = require('../config/cloudinary'); // ✅ Importa os dois

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

router.post(
  '/me/avatar',          // A rota da API
  authMiddleware,        // 1º: Garante que o usuário está logado
  uploadAvatar.single('avatar'), // 2º: O Multer intercepta UM arquivo chamado 'avatar'
  profileController.updateMyAvatar // 3º: O controller finaliza
);

router.delete(
  '/me/avatar',        // A rota da API (mesma da POST, mas método DELETE)
  authMiddleware,      // Garante que o usuário está logado
  profileController.deleteMyAvatar // O controller que fará o trabalho
);

router.post(
  '/me/video',
  authMiddleware,
  uploadVideo.single('video'), // Usa o novo uploader
  profileController.updateMyVideo // Nova função
);

router.delete(
  '/me/video',
  authMiddleware,
  profileController.deleteMyVideo // Nova função
);

module.exports = router;