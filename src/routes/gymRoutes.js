const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { findUserById, checkIns, validations } = require('../models/data');
const { validateWeek } = require('../services/gamificationService');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /api/gym/checkin:
 *   post:
 *     summary: Registrar check-in na academia
 *     tags: [Academia]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Check-in registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 checkIn:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     checkInTime:
 *                       type: string
 *                       format: date-time
 *             examples:
 *               pedro:
 *                 value:
                   message: "Check-in registrado com sucesso"
                   checkIn:
                     id: "3-1701234567890"
                     userId: "3"
                     checkInTime: "2023-11-29T14:22:47.890Z"
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.post('/checkin', (req, res) => {
  const userId = req.userId;
  const user = findUserById(userId);
  
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  
  // Criar novo check-in
  const checkInTime = new Date();
  const newCheckIn = {
    id: `${userId}-${Date.now()}`,
    userId,
    checkInTime,
    checkOutTime: null,
    durationMinutes: 0
  };
  
  checkIns.push(newCheckIn);
  
  // Atualizar última visita do usuário
  user.lastVisit = checkInTime;
  
  return res.status(201).json({
    message: 'Check-in registrado com sucesso',
    checkIn: {
      id: newCheckIn.id,
      userId: newCheckIn.userId,
      checkInTime: newCheckIn.checkInTime
    }
  });
});

/**
 * @swagger
 * /api/gym/checkout/{checkInId}:
 *   post:
 *     summary: Registrar check-out na academia
 *     tags: [Academia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: checkInId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do check-in
 *     responses:
 *       200:
 *         description: Check-out registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 checkIn:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     checkInTime:
 *                       type: string
 *                       format: date-time
 *                     checkOutTime:
 *                       type: string
 *                       format: date-time
 *                     durationMinutes:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Check-in não encontrado ou não pertence ao usuário
 */
router.post('/checkout/:checkInId', (req, res) => {
  const userId = req.userId;
  const { checkInId } = req.params;
  
  // Buscar check-in
  const checkIn = checkIns.find(ci => ci.id === checkInId && ci.userId === userId);
  
  if (!checkIn) {
    return res.status(404).json({ message: 'Check-in não encontrado ou não pertence ao usuário' });
  }
  
  if (checkIn.checkOutTime) {
    return res.status(400).json({ message: 'Check-out já registrado para este check-in' });
  }
  
  // Registrar check-out
  const checkOutTime = new Date();
  checkIn.checkOutTime = checkOutTime;
  
  // Calcular duração em minutos
  const durationMs = checkOutTime - new Date(checkIn.checkInTime);
  checkIn.durationMinutes = Math.floor(durationMs / (1000 * 60));
  
  return res.json({
    message: 'Check-out registrado com sucesso',
    checkIn: {
      id: checkIn.id,
      userId: checkIn.userId,
      checkInTime: checkIn.checkInTime,
      checkOutTime: checkIn.checkOutTime,
      durationMinutes: checkIn.durationMinutes
    }
  });
});

/**
 * @swagger
 * /api/gym/trainer-validation/{checkInId}:
 *   post:
 *     summary: Registrar validação do professor
 *     tags: [Academia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: checkInId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do check-in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trainerValidated
 *             properties:
 *               trainerValidated:
 *                 type: boolean
 *                 description: Indica se o professor validou a presença
 *     responses:
 *       200:
 *         description: Validação registrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 validation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     checkInId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     trainerValidated:
 *                       type: boolean
 *                     date:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Check-in não encontrado
 */
router.post('/trainer-validation/:checkInId', (req, res) => {
  const userId = req.userId;
  const { checkInId } = req.params;
  const { trainerValidated } = req.body;
  
  // Validar dados
  if (trainerValidated === undefined) {
    return res.status(400).json({ message: 'O campo trainerValidated é obrigatório' });
  }
  
  // Buscar check-in
  const checkIn = checkIns.find(ci => ci.id === checkInId && ci.userId === userId);
  
  if (!checkIn) {
    return res.status(404).json({ message: 'Check-in não encontrado ou não pertence ao usuário' });
  }
  
  // Verificar se já existe uma validação para este check-in
  const existingValidation = validations.find(v => v.checkInId === checkInId);
  
  if (existingValidation) {
    // Atualizar validação existente
    existingValidation.trainerValidated = trainerValidated;
    
    return res.json({
      message: 'Validação atualizada com sucesso',
      validation: existingValidation
    });
  }
  
  // Criar nova validação
  const newValidation = {
    id: `${userId}-${Date.now()}`,
    checkInId,
    userId,
    trainerValidated,
    date: new Date()
  };
  
  validations.push(newValidation);
  
  return res.status(201).json({
    message: 'Validação registrada com sucesso',
    validation: newValidation
  });
});

/**
 * @swagger
 * /api/gym/validar-semana:
 *   get:
 *     summary: Validar semana atual do usuário
 *     tags: [Academia]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Validação da semana
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 weekStart:
 *                   type: string
 *                   format: date
 *                 weekEnd:
 *                   type: string
 *                   format: date
 *                 checkInsCount:
 *                   type: integer
 *                 validCheckInsCount:
 *                   type: integer
 *                 pointsEarned:
 *                   type: integer
 *                 penalties:
 *                   type: integer
 *                 netPointsChange:
 *                   type: integer
 *                 medalEarned:
 *                   type: string
 *                   nullable: true
 *                 consecutiveWeeks:
 *                   type: integer
 *             examples:
 *               maria:
 *                 value:
                   success: true
                   weekStart: "2023-11-27T00:00:00.000Z"
                   weekEnd: "2023-12-03T23:59:59.999Z"
                   checkInsCount: 4
                   validCheckInsCount: 3
                   pointsEarned: 30
                   penalties: 0
                   netPointsChange: 30
                   medalEarned: null
                   consecutiveWeeks: 9
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/validar-semana', (req, res) => {
  const userId = req.userId;
  const user = findUserById(userId);
  
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  
  // Validar a semana atual
  const result = validateWeek(userId);
  
  if (!result.success) {
    return res.status(400).json({ message: result.message });
  }
  
  // Atualizar dados do usuário
  user.points += result.netPointsChange;
  user.consecutiveWeeks = result.consecutiveWeeks;
  
  // Adicionar medalha se ganhou
  if (result.medalEarned && !user.medals.includes(result.medalEarned)) {
    user.medals.push(result.medalEarned);
  }
  
  return res.json(result);
});

/**
 * @swagger
 * /api/gym/validar-semana/{weekOffset}:
 *   get:
 *     summary: Validar semana específica do usuário
 *     tags: [Academia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: weekOffset
 *         required: true
 *         schema:
 *           type: integer
 *         description: Deslocamento da semana (0 = atual, -1 = semana passada, 1 = próxima semana)
 *     responses:
 *       200:
 *         description: Validação da semana
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 weekStart:
 *                   type: string
 *                   format: date
 *                 weekEnd:
 *                   type: string
 *                   format: date
 *                 checkInsCount:
 *                   type: integer
 *                 validCheckInsCount:
 *                   type: integer
 *                 pointsEarned:
 *                   type: integer
 *                 penalties:
 *                   type: integer
 *                 netPointsChange:
 *                   type: integer
 *                 medalEarned:
 *                   type: string
 *                   nullable: true
 *                 consecutiveWeeks:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/validar-semana/:weekOffset', (req, res) => {
  const userId = req.userId;
  const weekOffset = parseInt(req.params.weekOffset, 10);
  
  if (isNaN(weekOffset)) {
    return res.status(400).json({ message: 'Deslocamento de semana inválido' });
  }
  
  const user = findUserById(userId);
  
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  
  // Validar a semana específica
  const result = validateWeek(userId, weekOffset);
  
  if (!result.success) {
    return res.status(400).json({ message: result.message });
  }
  
  // Não atualizar dados do usuário para semanas passadas ou futuras
  // Apenas retornar a simulação
  
  return res.json(result);
});

/**
 * @swagger
 * /api/gym/points-history:
 *   get:
 *     summary: Obter histórico de pontuação do usuário
 *     tags: [Academia]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Histórico de pontuação
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
 *                     level:
 *                       type: integer
 *                     points:
 *                       type: integer
 *                     consecutiveWeeks:
 *                       type: integer
 *                     medals:
 *                       type: array
 *                       items:
 *                         type: string
 *                 pointsHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       points:
 *                         type: integer
 *                       reason:
 *                         type: string
 *             examples:
 *               pedro:
 *                 value:
 *                   user:
 *                     id: "3"
 *                     name: "Pedro Santos"
 *                     email: "pedro@example.com"
 *                     level: 3
 *                     points: 200
 *                     consecutiveWeeks: 12
 *                     medals: ["PRIMEIRO PASSO", "SEGUNDO PASSO"]
 *                     lastVisit: "2023-11-29T00:00:00.000Z"
 *                   pointsHistory:
 *                     - date: "2023-11-27T00:00:00.000Z"
 *                       points: 20
 *                       reason: "Frequência semanal (5x)"
 *                     - date: "2023-11-20T00:00:00.000Z"
 *                       points: 40
 *                       reason: "Frequência semanal (7x)"
 *                     - date: "2023-11-13T00:00:00.000Z"
 *                       points: 10
 *                       reason: "Frequência semanal (3x)"
 *                     - date: "2023-11-06T00:00:00.000Z"
 *                       points: 20
 *                       reason: "Frequência semanal (5x)"
 *                     - date: "2023-10-30T00:00:00.000Z"
 *                       points: 10
 *                       reason: "Frequência semanal (3x)"
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/points-history', (req, res) => {
  const userId = req.userId;
  const user = findUserById(userId);
  
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  
  // Criar histórico de pontuação mockado
  // Em um sistema real, isso seria armazenado em um banco de dados
  const now = new Date();
  const pointsHistory = [
    {
      date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
      points: 10,
      reason: 'Frequência semanal (3x)'
    },
    {
      date: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000), // 23 dias atrás
      points: 20,
      reason: 'Frequência semanal (5x)'
    },
    {
      date: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000), // 16 dias atrás
      points: 40,
      reason: 'Frequência semanal (7x)'
    },
    {
      date: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), // 9 dias atrás
      points: 10,
      reason: 'Frequência semanal (3x)'
    },
    {
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
      points: 20,
      reason: 'Frequência semanal (5x)'
    }
  ];
  
  // Ordenar por data (mais recente primeiro)
  pointsHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Retornar dados do usuário e histórico de pontuação
  const { password, ...userWithoutPassword } = user;
  
  return res.json({
    user: userWithoutPassword,
    pointsHistory
  });
});

/**
 * @swagger
 * /api/gym/history:
 *   get:
 *     summary: Obter histórico de check-ins do usuário
 *     tags: [Academia]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Histórico de check-ins
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkIns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       checkInTime:
 *                         type: string
 *                         format: date-time
 *                       checkOutTime:
 *                         type: string
 *                         format: date-time
 *                       durationMinutes:
 *                         type: integer
 *                       trainerValidated:
 *                         type: boolean
 *             examples:
 *               joao:
 *                 value:
                   checkIns:
                     - id: "1-0"
                       checkInTime: "2023-11-27T08:30:00.000Z"
                       checkOutTime: "2023-11-27T09:45:00.000Z"
                       durationMinutes: 75
                       trainerValidated: true
                     - id: "1-1"
                       checkInTime: "2023-11-29T16:15:00.000Z"
                       checkOutTime: "2023-11-29T17:30:00.000Z"
                       durationMinutes: 75
                       trainerValidated: true
                     - id: "1-2"
                       checkInTime: "2023-12-01T07:00:00.000Z"
                       checkOutTime: "2023-12-01T08:00:00.000Z"
                       durationMinutes: 60
                       trainerValidated: false
 *       401:
 *         description: Não autorizado
 */
router.get('/history', (req, res) => {
  const userId = req.userId;
  
  // Obter check-ins do usuário
  const userCheckIns = checkIns.filter(ci => ci.userId === userId);
  
  // Obter validações do usuário
  const userValidations = validations.filter(v => v.userId === userId);
  
  // Mapear validações por checkInId para fácil acesso
  const validationMap = {};
  userValidations.forEach(validation => {
    validationMap[validation.checkInId] = validation;
  });
  
  // Combinar check-ins com validações
  const history = userCheckIns.map(checkIn => {
    const validation = validationMap[checkIn.id];
    
    return {
      id: checkIn.id,
      checkInTime: checkIn.checkInTime,
      checkOutTime: checkIn.checkOutTime,
      durationMinutes: checkIn.durationMinutes,
      trainerValidated: validation ? validation.trainerValidated : false
    };
  });
  
  // Ordenar por data (mais recente primeiro)
  history.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
  
  return res.json({ checkIns: history });
});

module.exports = router;