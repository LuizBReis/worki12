// backend/src/routes/publicUserRoutes.js
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Perfil público não exige autenticação
router.get('/:id', userController.getPublicUserProfile);

module.exports = router;

