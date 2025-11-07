const { Server } = require("socket.io");
let io;

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

    // Quando o usuário se autentica, ele entra na sua "sala pessoal"
    socket.on('authenticate', (userId) => {
      console.log(`Usuário ${userId} autenticado no socket ${socket.id}`);
      socket.join(`user:${userId}`); // Sala pessoal do usuário
      socket.userId = userId; // Guarda o userId no socket para referência
    });

    // Entra em uma sala de conversa específica (para o chat ao vivo)
    socket.on('join_conversation', (conversationId) => {
      console.log(`Socket ${socket.id} (user: ${socket.userId}) entrou na sala ${conversationId}`);
      socket.join(conversationId);
    });

    // Sai de uma sala de conversa
    socket.on('leave_conversation', (conversationId) => {
      console.log(`Socket ${socket.id} (user: ${socket.userId}) saiu da sala ${conversationId}`);
      socket.leave(conversationId);
    });

    // Marca notificações como lidas
    socket.on('mark_notifications_read', () => {
      if (socket.userId) {
        console.log(`Usuário ${socket.userId} marcou notificações como lidas`);
        // Confirma para o cliente
        socket.emit('notifications_cleared');
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.id} (user: ${socket.userId})`);
    });
  });

  return io;
}

function getIO() {
  if (!io) { 
    throw new Error("Socket.io não foi inicializado!"); 
  }
  return io;
}

module.exports = { initSocket, getIO };