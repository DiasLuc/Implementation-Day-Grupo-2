const express = require('express');
const jwt = require('jsonwebtoken');
const { users, findUserByEmail } = require('../models/data');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar um novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - level
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do usuário
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *               level:
 *                 type: integer
 *                 description: Nível escolhido (1, 2 ou 3)
 *                 enum: [1, 2, 3]
 *           examples:
 *             novoUsuario:
 *               value:
 *                 name: "Roberto Almeida"
 *                 email: "roberto@example.com"
 *                 password: "senha123"
 *                 level: 2
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     level:
 *                       type: integer
 *             examples:
 *               novoUsuario:
 *                 value:
 *                   user:
 *                     id: "6"
 *                     name: "Roberto Almeida"
 *                     email: "roberto@example.com"
 *                     level: 2
 *       400:
 *         description: Dados inválidos ou usuário já existe
 */
router.post('/register', (req, res) => {
  const { name, email, password, level } = req.body;
  
  // Validar dados
  if (!name || !email || !password || !level) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }
  
  // Validar nível
  if (![1, 2, 3].includes(Number(level))) {
    return res.status(400).json({ message: 'Nível deve ser 1, 2 ou 3' });
  }
  
  // Verificar se o usuário já existe
  if (findUserByEmail(email)) {
    return res.status(400).json({ message: 'Usuário já existe' });
  }
  
  // Criar novo usuário
  const newUser = {
    id: (users.length + 1).toString(),
    name,
    email,
    password, // Em um sistema real, a senha seria criptografada
    level: Number(level),
    points: 0,
    consecutiveWeeks: 0,
    medals: [],
    lastVisit: new Date()
  };
  
  users.push(newUser);
  
  // Retornar usuário sem a senha
  const { password: _, ...userWithoutPassword } = newUser;
  
  return res.status(201).json({ user: userWithoutPassword });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autenticar usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *           examples:
 *             joao:
 *               value:
 *                 email: joao@example.com
 *                 password: senha123
 *             maria:
 *               value:
 *                 email: maria@example.com
 *                 password: senha123
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticação
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     level:
 *                       type: integer
 *             examples:
 *               joao:
 *                 value:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   user:
 *                     id: "1"
 *                     name: "João Silva"
 *                     email: "joao@example.com"
 *                     level: 1
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Validar dados
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }
  
  // Buscar usuário
  const user = findUserByEmail(email);
  
  // Verificar se o usuário existe e a senha está correta
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }
  
  // Gerar token JWT
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: '1d' // Token expira em 1 dia
  });
  
  // Retornar usuário sem a senha
  const { password: _, ...userWithoutPassword } = user;
  
  return res.json({ token, user: userWithoutPassword });
});

module.exports = router;