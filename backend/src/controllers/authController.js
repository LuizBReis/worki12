// src/controllers/authController.js
const authService = require('../services/authService');

const register = async (req, res) => {
  try {
    // Pega os dados do corpo da requisição
    const newUser = await authService.registerUser(req.body);
    // Responde com sucesso (201 Created) e os dados do novo usuário
    res.status(201).json(newUser);
  } catch (error) {
    // Em caso de erro (ex: email já existe), envia uma resposta de erro
    res.status(400).json({ message: error.message });
  }
};

// --- NOVA FUNÇÃO DE LOGIN ---
const login = async (req, res) => {
  try {
    const { user, token } = await authService.loginUser(req.body);
    res.status(200).json({
      message: 'Login bem-sucedido!',
      user,
      token,
    });
  } catch (error) {
    // Responde com 401 Unauthorized para credenciais inválidas
    res.status(401).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
};