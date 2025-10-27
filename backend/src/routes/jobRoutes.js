// src/routes/jobRoutes.js
const express = require('express');
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

const router = express.Router();

// Rota pública para listar todas as vagas
router.get('/', jobController.listAllJobs);

// Rota protegida para criar uma nova vaga
// A requisição passa primeiro pelo authMiddleware, depois pelo checkRole('CLIENT'), e só então chega ao controller.
router.post('/', authMiddleware, checkRole(['CLIENT']), jobController.createNewJob);

router.get('/:id', authMiddleware, jobController.getSingleJob);

// --- NOVA ROTA PARA SE CANDIDATAR ---
// Apenas usuários logados (authMiddleware) com o papel 'FREELANCER' (checkRole) podem acessar.
router.post('/:id/apply', authMiddleware, checkRole(['FREELANCER']), jobController.applyToJob);

router.patch('/:id', authMiddleware, jobController.updateJob);

// --- NOVA ROTA PARA DELETAR VAGA ---
router.delete('/:id', authMiddleware, jobController.deleteJob);

router.get('/:id/applications', authMiddleware, jobController.listJobApplicants);


module.exports = router;