const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      freelancerProfile: {
        include: {
          skills: true,
          workExperiences: { orderBy: { startDate: 'desc' } },
        },
      },
      clientProfile: true, // Isso busca todos os campos escalares (id, companyName, city, state, address, etc.)
    },
  });
  if (!user) return null;
  if (user) delete user.password;

  // --- Aggregates for ratings and review lists ---
  // (Seu código de agregação de avaliações está ótimo, sem mudanças)
  const freelancerAgg = await prisma.freelancerReview.aggregate({
    where: { recipientId: userId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  user.averageFreelancerRating = freelancerAgg._avg.rating ?? null;
  user.freelancerReviewsReceived = await prisma.freelancerReview.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, rating: true, comment: true, createdAt: true,
      author: { select: { id: true, firstName: true, lastName: true, email: true, clientProfile: { select: { companyName: true } } } },
    },
  });

  if (user.clientProfile) {
    const clientAgg = await prisma.clientReview.aggregate({
      where: { recipientId: userId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    user.clientProfile.averageRating = clientAgg._avg.rating ?? null;
    user.clientProfile.receivedReviews = await prisma.clientReview.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, rating: true, comment: true, createdAt: true,
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  return user;
};

// --- ✅ FUNÇÃO updateUserProfile CORRIGIDA ---
const updateUserProfile = async (userId, profileData) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado.');

  // Atualiza os dados do 'User' (nome, sobrenome)
  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
    },
  });

  if (user.role === 'FREELANCER') {
    await prisma.freelancerProfile.update({
      where: { userId },
      data: { description: profileData.description },
    });
  } else if (user.role === 'CLIENT') {
    // Atualiza o ClientProfile com os novos campos
    await prisma.clientProfile.update({
      where: { userId },
      data: {
        companyName: profileData.companyName,
        description: profileData.description,
        // --- ✅ CAMPOS CORRIGIDOS ---
        city: profileData.city,
        state: profileData.state,
        address: profileData.address
        // location: profileData.location, // ❌ Campo antigo removido
      },
    });
  }

  return getUserById(userId);
};

const addSkillToUser = async (userId, skillName) => {
  // A ação agora é no FreelancerProfile, não no User
  const profile = await prisma.freelancerProfile.update({
    where: { userId },
    data: {
      skills: {
        connectOrCreate: {
          where: { name: skillName },
          create: { name: skillName },
        },
      },
    },
  });
  return getUserById(userId); // Retorna o user completo
};

const removeSkillFromUser = async (userId, skillName) => {
  await prisma.freelancerProfile.update({
    where: { userId },
    data: {
      skills: {
        disconnect: { name: skillName },
      },
    },
  });
  return getUserById(userId);
};

const addWorkExperience = async (userId, experienceData) => {
  const profile = await prisma.freelancerProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('Perfil de freelancer não encontrado.');
  return prisma.workExperience.create({
    data: {
      ...experienceData,
      freelancerProfileId: profile.id, // Conecta com o ID do perfil, não do usuário
    },
  });
};

const updateWorkExperience = async (userId, experienceId, experienceData) => {
  const profile = await prisma.freelancerProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('Perfil de freelancer não encontrado.');
  return prisma.workExperience.updateMany({
    where: { id: experienceId, freelancerProfileId: profile.id },
    data: experienceData,
  });
};

const deleteWorkExperience = async (userId, experienceId) => {
  const profile = await prisma.freelancerProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('Perfil de freelancer não encontrado.');
  return prisma.workExperience.deleteMany({
    where: { id: experienceId, freelancerProfileId: profile.id },
  });
};

const deleteUser = async (userId) => {
  // Exclui usuário e cascata cuida do resto
  await prisma.user.delete({ where: { id: userId } });
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado.');
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error('A senha antiga está incorreta.');
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
};

const changeEmail = async (userId, password, newEmail) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado.');
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('A senha está incorreta.');
  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing && existing.id !== userId) {
    throw new Error('Este e-mail já está em uso por outra conta.');
  }
  const updatedUser = await prisma.user.update({ where: { id: userId }, data: { email: newEmail } });
  delete updatedUser.password;
  return updatedUser;
};

const getPostedJobsByUser = async (userId) => {
  // Primeiro encontra o perfil de cliente
  const profile = await prisma.clientProfile.findUnique({ where: { userId } });
  if (!profile) return []; // Se não for um cliente, retorna array vazio
  // Depois busca as vagas associadas ao perfil
  return prisma.job.findMany({
    where: { authorId: profile.id },
    orderBy: { createdAt: 'desc' },
  });
};

const getApplicationsByUser = async (userId) => {
  return prisma.jobApplication.findMany({
    where: { applicantId: userId },
    include: {
      job: {
        include: {
          author: { // ClientProfile
            select: {
              companyName: true, // Pega o nome da empresa
              user: { select: { firstName: true, lastName: true } } // Pega o nome como fallback
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const updateUserAvatar = async (userId, newAvatarUrl) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      avatarUrl: newAvatarUrl // Atualiza o campo que criamos no schema
    }
  });
  
  // Retorna o perfil completo e atualizado
  return getUserById(userId); 
};

const deleteUserAvatar = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      avatarUrl: null // Define o avatarUrl como null
    }
  });
  
  // Retorna o perfil completo e atualizado
  return getUserById(userId); 
};

// --- ✅ NOVA FUNÇÃO ---
const updateUserVideo = async (userId, newVideoUrl) => {
  // Atualiza o FreelancerProfile, não o User
  await prisma.freelancerProfile.update({
    where: { userId: userId }, // Encontra o perfil pelo userId
    data: {
      videoUrl: newVideoUrl 
    }
  });
  return getUserById(userId); 
};

// --- ✅ NOVA FUNÇÃO ---
const deleteUserVideo = async (userId) => {
  await prisma.freelancerProfile.update({
    where: { userId: userId },
    data: {
      videoUrl: null // Define o videoUrl como null
    }
  });
  return getUserById(userId); 
};

module.exports = {
  getUserById,
  updateUserProfile,
  addSkillToUser,
  removeSkillFromUser,
  addWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  deleteUser,
  changePassword,
  changeEmail,
  getPostedJobsByUser,
  getApplicationsByUser,
  updateUserAvatar,
  deleteUserAvatar,
  updateUserVideo, // ✅ Exporta
  deleteUserVideo, // ✅ Exporta
};