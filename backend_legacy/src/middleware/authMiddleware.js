// src/middleware/authMiddleware.js
const supabase = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifica o token chamando a API do Supabase (mais seguro e simples para migração)
    // Isso valida a assinatura e a expiração.
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Erro na validação do token Supabase:', error);
      return res.status(403).json({ message: 'Token inválido ou expirado.' });
    }

    // Adiciona o user ao request. 
    // NOTA: O objeto user do Supabase é diferente do seu antigo payload.
    // user.id é o ID único.
    req.user = user;

    // BACKWARD COMPATIBILITY:
    // Se seus controllers esperam 'userId' ou 'role' diretamente no req.user, mapeie aqui:
    req.user.userId = user.id;
    // req.user.role = user.user_metadata?.role || "CLIENT"; // Exemplo se usar metadata

    next();
  } catch (error) {
    console.error('Erro inesperado no middleware:', error);
    return res.status(500).json({ message: 'Erro interno na autenticação.' });
  }
};

module.exports = authMiddleware;