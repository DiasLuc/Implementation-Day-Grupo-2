const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Verificar se o header de autorização existe
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  // Verificar se o formato do token é válido
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2) {
    return res.status(401).json({ message: 'Erro no formato do token' });
  }

  const [scheme, token] = parts;
  
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  // Verificar se o token é válido
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Adicionar o ID do usuário decodificado à requisição
    req.userId = decoded.id;
    return next();
  });
};

module.exports = authMiddleware;