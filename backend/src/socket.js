// backend/src/socket.js

// ✅ NOVO ARQUIVO
const { Server } = require("socket.io");

let io; // Variável para guardar a instância do servidor socket

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:4200',
        'http://localhost:4302',
        'https://worki-1f58a.web.app'
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/api/socket.io'
  });

  io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    socket.on('join_conversation', (conversationId) => {
      console.log(`Socket ${socket.id} entrou na sala ${conversationId}`);
      socket.join(conversationId);
    });

    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.id}`);
    });
  });

  return io;
}

// Função para obter a instância do io em outros arquivos
function getIO() {
  if (!io) {
    throw new Error("Socket.io não foi inicializado!");
  }
  return io;
}

module.exports = { initSocket, getIO };