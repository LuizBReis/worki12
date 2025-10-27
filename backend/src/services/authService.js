// src/services/authService.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log("JWT_SECRET:", process.env.JWT_SECRET);


const prisma = new PrismaClient();

// --- FUNÇÃO DE REGISTRO REFATORADA ---
const registerUser = async (userData) => {
  const { firstName, lastName, email, password, role, companyName, location } = userData;

  // 1. Verificar se o email já existe (permanece igual)
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new Error('Este e-mail já está em uso.');
  }

  // 2. Hashear a senha (permanece igual)
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
        // 2. Agora, passamos os novos dados para a criação do perfil
        create: {
          companyName: companyName,
          location: location,
        },
      } : undefined,
    },
  });

  delete newUser.password;
  return newUser;
};

// --- NOVA FUNÇÃO DE LOGIN ---
const loginUser = async (loginData) => {
  const { email, password } = loginData;

  // 1. Encontrar o usuário pelo e-mail
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Credenciais inválidas'); // Mensagem genérica por segurança
  }

  // 2. Comparar a senha enviada com a senha hasheada no banco
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Credenciais inválidas');
  }

  // 3. Se as credenciais estiverem corretas, gerar um token JWT
  const token = jwt.sign(
    { userId: user.id, role: user.role }, // Payload: o que queremos guardar no token
    process.env.JWT_SECRET, // A chave secreta para assinar o token
    { expiresIn: '24h' } // Opções, como o tempo de expiração do token
  );

  // 4. Remover a senha do objeto de usuário antes de retornar
  delete user.password;

  // 5. Retornar os dados do usuário e o token
  return { user, token };
};

module.exports = {
  registerUser,
  loginUser,
};