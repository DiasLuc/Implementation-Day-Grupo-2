const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { findUserById, LEVELS } = require('../models/data');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obter perfil do usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 level:
 *                   type: integer
 *                 points:
 *                   type: integer
 *                 consecutiveWeeks:
 *                   type: integer
 *                 medals:
 *                   type: array
 *                   items:
 *                     type: string
 *                 lastVisit:
 *                   type: string
 *                   format: date-time
 *             examples:
 *               maria:
 *                 value:
 *                   id: "2"
 *                   name: "Maria Oliveira"
 *                   email: "maria@example.com"
 *                   level: 2
 *                   points: 120
 *                   consecutiveWeeks: 8
 *                   medals: ["PRIMEIRO PASSO"]
 *                   lastVisit: "2023-11-29T10:30:00Z"
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/profile', (req, res) => {
  const userId = req.userId;
  const user = findUserById(userId);
  
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  
  // Retornar usuário sem a senha
  const { password, ...userWithoutPassword } = user;
  
  return res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/level:
 *   put:
 *     summary: Atualizar nível do usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - level
 *             properties:
 *               level:
 *                 type: integer
 *                 description: Novo nível (1, 2 ou 3)
 *                 enum: [1, 2, 3]
 *           examples:
 *             joao:
 *               value:
 *                 level: 2
 *     responses:
 *       200:
 *         description: Nível atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     level:
 *                       type: integer
 *       400:
 *         description: Nível inválido
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/level', (req, res) => {
  const userId = req.userId;
  const { level } = req.body;
  
  // Validar nível
  if (!level || ![1, 2, 3].includes(Number(level))) {
    return res.status(400).json({ message: 'Nível deve ser 1, 2 ou 3' });
  }
  
  const user = findUserById(userId);
  
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  
  // Atualizar nível
  user.level = Number(level);
  
  return res.json({
    message: 'Nível atualizado com sucesso',
    user: {
      id: user.id,
      level: user.level
    }
  });
});

/**
 * @swagger
 * /api/users/levels:
 *   get:
 *     summary: Obter informações sobre os níveis disponíveis
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informações sobre os níveis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 levels:
 *                   type: object
 *       401:
 *         description: Não autorizado
 */
router.get('/levels', (req, res) => {
  return res.json({ levels: LEVELS });
});

module.exports = router;