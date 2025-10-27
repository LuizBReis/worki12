// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Pega o token do header da requisição
  const authHeader = req.headers.authorization;

  // 2. Verifica se o header existe e se está no formato 'Bearer token'
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  // 3. Extrai o token (remove a parte 'Bearer ')
  const token = authHeader.split(' ')[1];

  try {
    // 4. Verifica se o token é válido usando a chave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Adiciona os dados do usuário (payload do token) ao objeto da requisição
    req.user = decoded;

    // 6. Chama a próxima função (o controller)
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido.' });
  }
};

module.exports = authMiddleware;