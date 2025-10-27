// backend/src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Como perfis só devem ser vistos por usuários logados, protegemos a rota
router.get('/:id', authMiddleware, userController.getUserProfile);

module.exports = router;