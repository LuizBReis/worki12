// src/middleware/roleMiddleware.js

// Este middleware recebe um array de papéis permitidos
const checkRole = (roles) => {
  return (req, res, next) => {
    // Pega o usuário que foi adicionado pelo authMiddleware
    const user = req.user;

    if (!user || !roles.includes(user.role)) {
      // Se o papel do usuário não estiver na lista de papéis permitidos, nega o acesso.
      return res.status(403).json({ message: 'Acesso proibido. Permissões insuficientes.' });
    }

    // Se o papel for permitido, continua para a próxima função (o controller)
    next();
  };
};

module.exports = checkRole;