// Dados mockados para armazenamento em memória

// Níveis disponíveis
const LEVELS = {
  1: {
    name: 'Nível 1',
    minDuration: 30, // minutos
    points: {
      threeTimesWeek: 10,
      fiveTimesWeek: 20,
      sevenTimesWeek: 40
    },
    medal: {
      name: 'PRIMEIRO PASSO',
      weeksRequired: 5
    }
  },
  2: {
    name: 'Nível 2',
    minDuration: 60, // minutos
    points: {
      threeTimesWeek: 20,
      fiveTimesWeek: 30,
      sevenTimesWeek: 50
    },
    medal: {
      name: 'SEGUNDO PASSO',
      weeksRequired: 10
    }
  },
  3: {
    name: 'Nível 3',
    minDuration: 90, // minutos
    points: {
      threeTimesWeek: 30,
      fiveTimesWeek: 40,
      sevenTimesWeek: 50
    },
    medal: {
      name: 'TERCEIRO PASSO',
      weeksRequired: 15
    }
  }
};

// Usuários mockados
const users = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    password: 'senha123',
    level: 1,
    points: 50,
    consecutiveWeeks: 3,
    medals: [],
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 dias atrás
  },
  {
    id: '2',
    name: 'Maria Oliveira',
    email: 'maria@example.com',
    password: 'senha123',
    level: 2,
    points: 120,
    consecutiveWeeks: 8,
    medals: ['PRIMEIRO PASSO'],
    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 dia atrás
  },
  {
    id: '3',
    name: 'Pedro Santos',
    email: 'pedro@example.com',
    password: 'senha123',
    level: 3,
    points: 200,
    consecutiveWeeks: 12,
    medals: ['PRIMEIRO PASSO', 'SEGUNDO PASSO'],
    lastVisit: new Date() // hoje
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana@example.com',
    password: 'senha123',
    level: 1,
    points: 30,
    consecutiveWeeks: 2,
    medals: [],
    lastVisit: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 dias atrás
  },
  {
    id: '5',
    name: 'Carlos Ferreira',
    email: 'carlos@example.com',
    password: 'senha123',
    level: 2,
    points: 0,
    consecutiveWeeks: 0,
    medals: [],
    lastVisit: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 dias atrás
  }
];

// Função para gerar data aleatória nos últimos 2 meses
const getRandomDate = () => {
  const now = new Date();
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(now.getMonth() - 2);
  
  return new Date(twoMonthsAgo.getTime() + Math.random() * (now.getTime() - twoMonthsAgo.getTime()));
};

// Função para gerar duração aleatória entre 30 e 120 minutos
const getRandomDuration = () => {
  return Math.floor(Math.random() * (120 - 30 + 1)) + 30;
};

// Gerar check-ins mockados para os últimos 2 meses
const checkIns = [];
const validations = [];

// Gerar dados para cada usuário
users.forEach(user => {
  // Gerar entre 10 e 30 check-ins por usuário nos últimos 2 meses
  const numCheckIns = Math.floor(Math.random() * 21) + 10;
  
  for (let i = 0; i < numCheckIns; i++) {
    const checkInDate = getRandomDate();
    const durationMinutes = getRandomDuration();
    
    // Calcular checkout adicionando a duração ao checkin
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setMinutes(checkOutDate.getMinutes() + durationMinutes);
    
    const checkIn = {
      id: `${user.id}-${i}`,
      userId: user.id,
      checkInTime: checkInDate,
      checkOutTime: checkOutDate,
      durationMinutes
    };
    
    checkIns.push(checkIn);
    
    // Gerar validação do professor (80% de chance de ser validado)
    const isValidated = Math.random() < 0.8;
    
    const validation = {
      id: `${user.id}-${i}`,
      checkInId: checkIn.id,
      userId: user.id,
      trainerValidated: isValidated,
      date: checkInDate
    };
    
    validations.push(validation);
  }
});

module.exports = {
  LEVELS,
  users,
  checkIns,
  validations,
  // Funções auxiliares para manipulação dos dados
  findUserById: (id) => users.find(user => user.id === id),
  findUserByEmail: (email) => users.find(user => user.email === email),
  getUserCheckIns: (userId) => checkIns.filter(checkIn => checkIn.userId === userId),
  getUserValidations: (userId) => validations.filter(validation => validation.userId === userId),
  // Função para obter check-ins de um usuário em uma semana específica
  getUserCheckInsForWeek: (userId, startDate, endDate) => {
    return checkIns.filter(checkIn => {
      return checkIn.userId === userId && 
             checkIn.checkInTime >= startDate && 
             checkIn.checkInTime <= endDate;
    });
  },
  // Função para obter validações de um usuário em uma semana específica
  getUserValidationsForWeek: (userId, startDate, endDate) => {
    return validations.filter(validation => {
      return validation.userId === userId && 
             validation.date >= startDate && 
             validation.date <= endDate;
    });
  }
};