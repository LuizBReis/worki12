const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');

// Rota pública: lista skills sugeridas (filtradas pelo serviço)
router.get('/suggestions', skillController.listSuggestedSkills);

module.exports = router;
