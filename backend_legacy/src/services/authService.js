// backend/src/services/authService.js (VERSÃO CORRIGIDA)

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log("JWT_SECRET:", process.env.JWT_SECRET);

const prisma = new PrismaClient();

// --- FUNÇÃO DE REGISTRO CORRIGIDA ---
const registerUser = async (userData) => {
  // ✅ Pega os novos campos 'city' e 'state'
  const { 
    firstName, lastName, email, password, role, 
    companyName, city, state // 'location' não é mais usado
  } = userData;

  // 1. Verificar se o email já existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new Error('Este e-mail já está em uso.');
  }

  // 2. Hashear a senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Criar o novo usuário E o seu perfil correspondente
  const newUser = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      freelancerProfile: role === 'FREELANCER' ? {
        create: {},
      } : undefined,
      clientProfile: role === 'CLIENT' ? {
        // ✅ CRIA O PERFIL COM OS NOVOS CAMPOS
        create: {
          companyName: companyName,
          city: city,   // Salva a cidade do registro
          state: state, // Salva o estado do registro
          // 'address' (Item #8) será adicionado depois no perfil
        },
      } : undefined,
    },
  });

  delete newUser.password;
  return newUser;
};

// --- FUNÇÃO DE LOGIN (sem mudanças) ---
const loginUser = async (loginData) => {
  const { email, password } = loginData;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Credenciais inválidas');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Credenciais inválidas');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  delete user.password;
  return { user, token };
};

module.exports = {
  registerUser,
  loginUser,
};