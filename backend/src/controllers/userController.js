// backend/src/controllers/userController.js
const userService = require('../services/userService');

const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar perfil do usuário.', error: error.message });
  }
};

module.exports = {
  getUserProfile,
};