// backend/src/config/mailer.js
const nodemailer = require('nodemailer');

// Carregue as credenciais das variáveis de ambiente
const mailUser = process.env.MAIL_USER; // Seu email (ex: worki.app@gmail.com)
const mailPass = process.env.MAIL_PASS; // Sua SENHA DE APLICATIVO do Gmail

if (!mailUser || !mailPass) {
  console.warn(`
    *********************************************************
    * ATENÇÃO: Credenciais de email não configuradas em .env *
    * O envio de email de reset de senha NÃO FUNCIONARÁ.    *
    * Defina MAIL_USER e MAIL_PASS no seu arquivo .env.     *
    *********************************************************
  `);
}

const transporter = nodemailer.createTransport({
  service: 'gmail', // Ou outro serviço (SendGrid, Mailgun, etc.)
  auth: {
    user: mailUser,
    pass: mailPass, // IMPORTANTE: Use SENHA DE APLICATIVO se tiver 2FA no Gmail
  },
});

module.exports = transporter;