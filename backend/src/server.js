// backend/src/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./socket');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const jobRoutes = require('./routes/jobRoutes');
const userRoutes = require('./routes/userRoutes');
const publicUserRoutes = require('./routes/publicUserRoutes');
const skillRoutes = require('./routes/skillRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const transporter = require('./config/mailer');

const app = express();
const PORT = process.env.PORT || 8080;

// Configurar CORS para dev e produção
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://localhost:4302',
    'https://worki-1f58a.web.app'
  ],
  credentials: true
}));
app.use(express.json());

// Servir arquivos estáticos enviados localmente (fallback quando Cloudinary não está configurado)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const server = http.createServer(app);
initSocket(server);

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/public/users', publicUserRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  // Pré-aquecer conexão SMTP para reduzir latência no primeiro envio
  transporter.verify()
    .then(() => console.log('SMTP verificado e pronto para envio (pool ativo).'))
    .catch(err => console.warn('Aviso: SMTP não verificado no startup:', err && err.message ? err.message : err));
});
