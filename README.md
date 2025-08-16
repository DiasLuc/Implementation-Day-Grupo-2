# API de Gamificação para Academia

Esta é uma API REST para um sistema de gamificação de academia, desenvolvida em JavaScript com Express. A API permite o controle de presença, validação por professores e um sistema de pontuação baseado em níveis.

## Funcionalidades

- Autenticação de usuários (registro e login)
- Check-in e check-out na academia
- Validação de presença por professores
- Sistema de pontuação baseado em frequência semanal
- Sistema de medalhas por metas alcançadas
- Penalidades por ausência

## Regras de Gamificação

### Requisitos Básicos
- Validação da presença do aluno por um profissional da academia
- Permanência mínima na academia (varia conforme o nível)

### Níveis e Pontuação

#### Nível 1: Permanência mínima de 30 minutos
- 3x/semana → 10 pontos
- 5x/semana → 20 pontos
- 7x/semana → 40 pontos (bônus extra)
- Medalha: PRIMEIRO PASSO (5 semanas seguidas)

#### Nível 2: Permanência mínima de 1 hora
- 3x/semana → 20 pontos
- 5x/semana → 30 pontos
- 7x/semana → 50 pontos (bônus extra)
- Medalha: SEGUNDO PASSO (10 semanas seguidas)

#### Nível 3: Permanência mínima de 1 hora e 30 minutos
- 3x/semana → 30 pontos
- 5x/semana → 40 pontos
- 7x/semana → 50 pontos (bônus extra)
- Medalha: TERCEIRO PASSO (15 semanas seguidas)

### Penalidades
- Ausência por 2 semanas: perda de 10 pontos por semana
- Ausência por 8 semanas: pontos zerados

## Instalação

1. Clone o repositório:
   ```
   git clone https://github.com/seu-usuario/academia-gamificacao-api.git
   cd academia-gamificacao-api
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
   ```
   PORT=7000
   JWT_SECRET=academia_gamificacao_secret
   API_URL=http://localhost:7000
   SWAGGER_URL=/api-docs
   ```

4. Inicie o servidor:
   ```
   npm start
   ```
   ou para desenvolvimento:
   ```
   npm run dev
   ```

## Documentação da API

A documentação da API está disponível através do Swagger UI em:
```
http://localhost:7000/api-docs
```

## Endpoints Principais

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Autenticar usuário

### Usuários
- `GET /api/users/profile` - Obter perfil do usuário
- `PUT /api/users/level` - Atualizar nível do usuário
- `GET /api/users/levels` - Obter informações sobre os níveis

### Academia
- `POST /api/gym/checkin` - Registrar check-in
- `POST /api/gym/checkout/:checkInId` - Registrar check-out
- `POST /api/gym/trainer-validation/:checkInId` - Registrar validação do professor
- `GET /api/gym/validar-semana` - Validar a semana atual
- `GET /api/gym/validar-semana/:weekOffset` - Validar uma semana específica
- `GET /api/gym/history` - Obter histórico de check-ins

## Observações

- Esta API foi desenvolvida para fins de estudo de teste de software e não para uso em produção.
- Os dados são armazenados em memória, não há persistência em banco de dados.
- A API inclui dados mockados para 5 usuários com histórico de check-ins nos últimos 2 meses.