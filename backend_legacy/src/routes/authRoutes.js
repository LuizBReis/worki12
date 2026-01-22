// src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
// ✅ Importe crypto e o transporter
const crypto = require('crypto'); 
const transporter = require('../config/mailer'); // Nosso config de email
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); // Certifique-se que bcryptjs está importado

// Define a rota POST para /register que chama a função register do controller
router.post('/register', authController.register);

router.post('/login', authController.login);

// Rota para SOLICITAR redefinição de senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Resposta genérica mesmo se o email não existir (por segurança)
    if (!user) {
      console.log(`Solicitação de reset para email não encontrado: ${email}`);
      return res.status(200).json({ message: 'Se um usuário com este email existir, um link de redefinição foi enviado.' });
    }

    // 1. Gerar Token Seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // Expira em 1 hora

    // 2. Salvar Token e Data de Expiração no Usuário (Prisma)
    await prisma.user.update({
      where: { email: email },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: passwordResetExpires
      }
    });

    // 3. Montar URL de Reset (usando variável de ambiente, com default)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4302';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // 4. Configurar Email
    const fromAddress = process.env.MAIL_USER || process.env.EMAIL_USER || 'no-reply@worki.local';
    const mailOptions = {
      to: user.email,
      from: fromAddress, // Remetente
      subject: 'Redefinição de Senha para WORKI',
      html: `
        <p>Você solicitou a redefinição de senha para sua conta WORKI.</p>
        <p>Por favor, clique no link a seguir para criar uma nova senha:</p>
        <p><a href="${resetUrl}">Redefinir Senha</a></p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou isso, ignore este email.</p>
        <p>Atenciosamente,<br>Equipe WORKI</p>
      `
    };

    // 5. Enviar Email em background para reduzir latência de resposta
    // Responder IMEDIATAMENTE ao cliente
    res.status(200).json({ message: 'Se um usuário com este email existir, um link de redefinição foi enviado.' });

    // Disparar envio assíncrono sem bloquear a requisição
    setImmediate(async () => {
      try {
        await transporter.sendMail(mailOptions);
        console.log(`Email de reset enviado para: ${email}`);
      } catch (mailError) {
        console.error('Erro ao ENVIAR email de redefinição:', mailError);
        // Reverta o token no banco em caso de falha para evitar tokens inválidos
        try {
          await prisma.user.update({
            where: { email: email },
            data: { passwordResetToken: null, passwordResetExpires: null }
          });
        } catch (revertError) {
          console.error('Erro ao reverter token após falha de email:', revertError);
        }
      }
    });

  } catch (error) {
    console.error('Erro GERAL ao solicitar redefinição:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Rota para REDEFINIR a senha com o token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body; // Nome da variável como no frontend antigo

    // 1. Validar Nova Senha
    if (!newPassword || newPassword.length < 6) { // Ajuste o mínimo se necessário
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    // 2. Encontrar Usuário pelo Token Válido (Prisma)
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date() // Verifica se a data de expiração é MAIOR que agora
        }
      }
    });

    // 3. Se não encontrar usuário ou token expirado
    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }

    // 4. Criptografar Nova Senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Atualizar Senha e Limpar Token (Prisma)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null, // Limpa o token
        passwordResetExpires: null // Limpa a expiração
      }
    });

    res.status(200).json({ message: 'Senha redefinida com sucesso!' });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;
