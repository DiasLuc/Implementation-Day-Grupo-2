require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const gymRoutes = require('./routes/gymRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Academia Gamificação API',
      version: '1.0.0',
      description: 'API REST para sistema de gamificação de academia',
    },
    servers: [
      {
        url: process.env.API_URL,
        description: 'Servidor de Desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use(process.env.SWAGGER_URL, swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gym', gymRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API de Gamificação da Academia' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Documentação Swagger disponível em: ${process.env.API_URL}${process.env.SWAGGER_URL}`);
});