const { LEVELS, getUserCheckInsForWeek, getUserValidationsForWeek, findUserById } = require('../models/data');

// Função para calcular o início e fim da semana atual
const getCurrentWeekDates = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  
  // Calcular o início da semana (domingo)
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);
  
  // Calcular o fim da semana (sábado)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};

// Função para calcular o início e fim de uma semana específica
const getWeekDates = (weekOffset = 0) => {
  const { startDate, endDate } = getCurrentWeekDates();
  
  // Ajustar para a semana desejada
  startDate.setDate(startDate.getDate() + (weekOffset * 7));
  endDate.setDate(endDate.getDate() + (weekOffset * 7));
  
  return { startDate, endDate };
};

// Validar se um check-in é válido (duração mínima e validação do professor)
const isValidCheckIn = (checkIn, validation, userLevel) => {
  // Verificar se o check-in foi validado pelo professor
  if (!validation || !validation.trainerValidated) {
    return false;
  }
  
  // Verificar se a duração mínima foi atingida
  const minDuration = LEVELS[userLevel].minDuration;
  return checkIn.durationMinutes >= minDuration;
};

// Calcular pontos baseados na frequência semanal
const calculateWeeklyPoints = (validCheckInsCount, userLevel) => {
  const levelConfig = LEVELS[userLevel];
  
  if (validCheckInsCount >= 7) {
    return levelConfig.points.sevenTimesWeek;
  } else if (validCheckInsCount >= 5) {
    return levelConfig.points.fiveTimesWeek;
  } else if (validCheckInsCount >= 3) {
    return levelConfig.points.threeTimesWeek;
  }
  
  return 0;
};

// Verificar se o usuário ganhou uma medalha
const checkForMedal = (user) => {
  const levelConfig = LEVELS[user.level];
  const requiredWeeks = levelConfig.medal.weeksRequired;
  const medalName = levelConfig.medal.name;
  
  // Verificar se o usuário já tem a medalha
  if (user.medals.includes(medalName)) {
    return null;
  }
  
  // Verificar se o usuário atingiu o número de semanas consecutivas necessárias
  if (user.consecutiveWeeks >= requiredWeeks) {
    return medalName;
  }
  
  return null;
};

// Calcular penalidades por ausência
const calculatePenalties = (user, currentDate) => {
  if (!user.lastVisit) {
    return 0;
  }
  
  const daysSinceLastVisit = Math.floor((currentDate - new Date(user.lastVisit)) / (1000 * 60 * 60 * 24));
  
  // Verificar se o usuário se ausentou por 8 semanas ou mais
  if (daysSinceLastVisit >= 56) { // 8 semanas * 7 dias
    return -user.points; // Zerar pontos
  }
  
  // Verificar se o usuário se ausentou por 2 semanas ou mais
  if (daysSinceLastVisit >= 14) { // 2 semanas * 7 dias
    const weeksMissed = Math.floor(daysSinceLastVisit / 7);
    return Math.max(-user.points, -10 * weeksMissed); // Limitar a penalidade aos pontos existentes
  }
  
  return 0;
};

// Validar a semana para um usuário específico
const validateWeek = (userId, weekOffset = 0) => {
  const user = findUserById(userId);
  
  if (!user) {
    return { success: false, message: 'Usuário não encontrado' };
  }
  
  const { startDate, endDate } = getWeekDates(weekOffset);
  
  // Obter check-ins e validações da semana
  const weekCheckIns = getUserCheckInsForWeek(userId, startDate, endDate);
  const weekValidations = getUserValidationsForWeek(userId, startDate, endDate);
  
  // Mapear validações por checkInId para fácil acesso
  const validationMap = {};
  weekValidations.forEach(validation => {
    validationMap[validation.checkInId] = validation;
  });
  
  // Contar check-ins válidos
  const validCheckIns = weekCheckIns.filter(checkIn => {
    return isValidCheckIn(checkIn, validationMap[checkIn.id], user.level);
  });
  
  const validCheckInsCount = validCheckIns.length;
  
  // Calcular pontos ganhos na semana
  const pointsEarned = calculateWeeklyPoints(validCheckInsCount, user.level);
  
  // Verificar se o usuário ganhou uma medalha
  let medalEarned = null;
  let consecutiveWeeks = user.consecutiveWeeks;
  
  if (validCheckInsCount >= 3) {
    // Incrementar semanas consecutivas apenas se o usuário foi pelo menos 3 vezes
    consecutiveWeeks += 1;
    medalEarned = checkForMedal({ ...user, consecutiveWeeks });
  } else {
    // Resetar semanas consecutivas se não atingiu o mínimo
    consecutiveWeeks = 0;
  }
  
  // Calcular penalidades (apenas para a semana atual)
  const penalties = weekOffset === 0 ? calculatePenalties(user, new Date()) : 0;
  
  // Resultado final
  return {
    success: true,
    weekStart: startDate.toISOString().split('T')[0],
    weekEnd: endDate.toISOString().split('T')[0],
    checkInsCount: weekCheckIns.length,
    validCheckInsCount,
    pointsEarned,
    penalties,
    netPointsChange: pointsEarned + penalties,
    medalEarned,
    consecutiveWeeks
  };
};

module.exports = {
  validateWeek,
  getCurrentWeekDates,
  getWeekDates,
  isValidCheckIn,
  calculateWeeklyPoints,
  checkForMedal,
  calculatePenalties
};