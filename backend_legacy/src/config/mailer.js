// backend/src/config/mailer.js
const nodemailer = require('nodemailer');

// Suporte a múltiplas convenções de env e SMTP custom
const mailUser = process.env.MAIL_USER || process.env.EMAIL_USER;
const mailPass = process.env.MAIL_PASS || process.env.EMAIL_PASS;
const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
const smtpPort = process.env.SMTP_PORT || process.env.EMAIL_PORT;
const smtpSecureRaw = process.env.SMTP_SECURE || process.env.EMAIL_SECURE; // 'true' | 'false' | undefined
const smtpSecure = String(smtpSecureRaw).toLowerCase() === 'true';
const mailService = process.env.MAIL_SERVICE || undefined; // ex: 'gmail'

let transporter;

if (smtpHost && mailUser && mailPass) {
  // Configuração SMTP custom com pool para conexões persistentes
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort ? Number(smtpPort) : 587,
    secure: smtpSecure, // true para 465, false para outros
    auth: { user: mailUser, pass: mailPass },
    pool: true,
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 3),
    maxMessages: Number(process.env.SMTP_MAX_MESSAGES || 100),
    connectionTimeout: Number(process.env.SMTP_CONN_TIMEOUT || 10000),
    greetingTimeout: Number(process.env.SMTP_GREET_TIMEOUT || 10000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 20000)
  });
} else if (mailService && mailUser && mailPass) {
  // Serviço configurado explicitamente (ex: gmail) com pool
  transporter = nodemailer.createTransport({
    service: mailService,
    auth: { user: mailUser, pass: mailPass },
    pool: true,
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 3),
    maxMessages: Number(process.env.SMTP_MAX_MESSAGES || 100)
  });
} else if (mailUser && mailPass) {
  // Default amigável: Gmail quando apenas user/pass existem, com pool
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: mailUser, pass: mailPass },
    pool: true,
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 3),
    maxMessages: Number(process.env.SMTP_MAX_MESSAGES || 100)
  });
} else {
  // Fallback de desenvolvimento: não envia, mas não quebra
  console.warn(`
    *********************************************************
    * ATENÇÃO: Credenciais de email não configuradas em .env *
    * O envio REAL de e-mails está desativado (dev fallback).*
    * Defina MAIL_USER/MAIL_PASS OU SMTP_* em seu .env.      *
    *********************************************************
  `);
  transporter = nodemailer.createTransport({ jsonTransport: true });
}

module.exports = transporter;
