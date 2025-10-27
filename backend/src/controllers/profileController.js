// src/controllers/profileController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const userService = require('../services/userService');

const getMyProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    // Chama o serviço para obter o perfil completo
    const userProfile = await userService.getUserById(userId);
    if (!userProfile) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    res.status(200).json(userProfile);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar perfil.', error: error.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { userId } = req.user; // Pega o ID do usuário logado (do token)
    const profileData = req.body; // Pega os dados a serem atualizados (ex: { description })

    // Filtra para permitir apenas a atualização de campos seguros
    const allowedUpdates = {
      description: profileData.description,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
    };

    const updatedUser = await userService.updateUserProfile(userId, allowedUpdates);

    delete updatedUser.password; // Sempre remova a senha da resposta
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar perfil.', error: error.message });
  }
};

// --- NOVA FUNÇÃO PARA ADICIONAR SKILL ---
const addSkill = async (req, res) => {
  try {
    const { userId } = req.user;
    const { skillName } = req.body;
    if (!skillName) {
      return res.status(400).json({ message: 'O nome da skill é obrigatório.' });
    }
    const updatedUser = await userService.addSkillToUser(userId, skillName);
    delete updatedUser.password;
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar skill.', error: error.message });
  }
};

// --- NOVA FUNÇÃO PARA REMOVER SKILL ---
const removeSkill = async (req, res) => {
  try {
    const { userId } = req.user;
    const { skillName } = req.body;
    if (!skillName) {
      return res.status(400).json({ message: 'O nome da skill é obrigatório.' });
    }
    const updatedUser = await userService.removeSkillFromUser(userId, skillName);
    delete updatedUser.password;
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover skill.', error: error.message });
  }
};

// --- NOVAS FUNÇÕES PARA EXPERIÊNCIA DE TRABALHO ---
const addExperience = async (req, res) => {
  try {
    const { userId } = req.user;
    const experience = await userService.addWorkExperience(userId, req.body);
    res.status(201).json(experience);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar experiência.', error: error.message });
  }
};

const updateExperience = async (req, res) => {
  try {
    const { userId } = req.user;
    const { expId } = req.params; // Pega o ID da experiência da URL
    await userService.updateWorkExperience(userId, expId, req.body);
    res.status(200).json({ message: 'Experiência atualizada com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar experiência.', error: error.message });
  }
};

const deleteExperience = async (req, res) => {
  try {
    const { userId } = req.user;
    const { expId } = req.params;
    await userService.deleteWorkExperience(userId, expId);
    res.status(200).json({ message: 'Experiência removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover experiência.', error: error.message });
  }
};

const deleteMyAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    await userService.deleteUser(userId);
    res.status(200).json({ message: 'Conta excluída com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir conta.', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { userId } = req.user;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'A senha antiga e a nova são obrigatórias.' });
    }

    await userService.changePassword(userId, oldPassword, newPassword);
    res.status(200).json({ message: 'Senha alterada com sucesso.' });

  } catch (error) {
    // Se o erro for de senha incorreta, retorna um erro específico
    if (error.message === 'A senha antiga está incorreta.') {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erro ao alterar senha.', error: error.message });
  }
};

// --- NOVA FUNÇÃO PARA MUDAR O E-MAIL ---
const changeEmail = async (req, res) => {
  try {
    const { userId } = req.user;
    const { password, newEmail } = req.body;

    if (!password || !newEmail) {
      return res.status(400).json({ message: 'A senha e o novo e-mail são obrigatórios.' });
    }

    const updatedUser = await userService.changeEmail(userId, password, newEmail);
    delete updatedUser.password;
    res.status(200).json(updatedUser);

  } catch (error) {
    if (error.message === 'A senha está incorreta.') {
      return res.status(401).json({ message: error.message });
    }
    if (error.message === 'Este e-mail já está em uso por outra conta.') {
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    res.status(500).json({ message: 'Erro ao alterar e-mail.', error: error.message });
  }
};

// --- NOVAS FUNÇÕES PARA A PÁGINA "MY JOBS" ---

const getMyPostedJobs = async (req, res) => {
  try {
    const { userId } = req.user;
    const jobs = await userService.getPostedJobsByUser(userId);
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar vagas postadas.', error: error.message });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const { userId } = req.user;
    const applications = await userService.getApplicationsByUser(userId);
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar candidaturas.', error: error.message });
  }
};


module.exports = {
  getMyProfile,
  updateMyProfile,
  addSkill,
  removeSkill,
  addExperience,
  updateExperience,
  deleteExperience,
  deleteMyAccount,
  changePassword,
  changeEmail,
  getMyPostedJobs,
  getMyApplications,
};