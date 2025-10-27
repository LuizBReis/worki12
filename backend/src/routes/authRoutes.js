// src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Define a rota POST para /register que chama a função register do controller
router.post('/register', authController.register);

router.post('/login', authController.login);

module.exports = router;