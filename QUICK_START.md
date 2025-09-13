# 🚀 Guia de Início Rápido - Connexa Backend

## ⚡ Instalação e Execução em 5 minutos

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Ambiente
```bash
cp env.example .env
```

**Edite o `.env` com suas configurações básicas:**
```env
PORT=3001
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
FRONTEND_URL=http://localhost:3000
```

### 3. Inicializar Banco de Dados
```bash
npm run init-db
```

### 4. Iniciar Servidor
```bash
npm run dev
```

**✅ Servidor rodando em:** `http://localhost:3001`

## 🧪 Testar a API

### 1. Registrar Usuário
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@teste.com",
    "password": "Senha123!",
    "course": "Ciência da Computação",
    "semester": 3
  }'
```

### 2. Fazer Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@teste.com",
    "password": "Senha123!"
  }'
```

### 3. Criar Grupo (use o token do login)
```bash
curl -X POST http://localhost:3001/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "subject": "Algoritmos",
    "objective": "Estudar algoritmos de ordenação",
    "location": "Biblioteca",
    "maxMembers": 5,
    "meetingTime": "19:00",
    "meetingDays": ["segunda", "quarta"]
  }'
```

## 🔌 Testar WebSocket

### Conectar com Socket.io
```javascript
// No frontend ou teste
const io = require('socket.io-client');

const socket = io('http://localhost:3001', {
  auth: {
    token: 'SEU_JWT_TOKEN_AQUI'
  }
});

// Entrar em grupo
socket.emit('join_group', { groupId: 1 });

// Enviar mensagem
socket.emit('send_message', { 
  groupId: 1, 
  message: 'Olá pessoal!' 
});

// Escutar mensagens
socket.on('new_message', (data) => {
  console.log('Nova mensagem:', data.message);
});
```

## 📊 Verificar Dados

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Listar Grupos
```bash
curl http://localhost:3001/api/groups
```

### Testar Conexão do Banco
```bash
node scripts/test-connection.js
```

## 🎯 Usuários de Teste Disponíveis

Após executar `npm run init-db`, você terá:

| Email | Senha | Curso |
|-------|-------|-------|
| joao.silva@gmail.com | Senha123! | Ciência da Computação |
| maria.santos@estudante.ufpb.br | Senha123! | Engenharia de Software |
| pedro.oliveira@ufpb.br | Senha123! | Sistemas de Informação |

## 🔧 Configurações Importantes

### Email (Opcional)
Para funcionalidade de recuperação de senha:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app
```

### Upload de Arquivos
```env
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

## 🐛 Problemas Comuns

### Erro: "Banco de dados não foi inicializado"
```bash
mkdir -p database
npm run init-db
```

### Erro: "Token inválido"
- Verifique se o JWT_SECRET está configurado
- Certifique-se de usar o token correto

### Erro: "CORS"
- Verifique se FRONTEND_URL está correto
- Certifique-se de que o frontend está rodando

## 📱 Conectar com Frontend React

```javascript
// No seu frontend React
const API_BASE_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// Axios para API REST
import axios from 'axios';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Socket.io para chat
import io from 'socket.io-client';
const socket = io(SOCKET_URL, {
  auth: { token }
});
```

## 🎉 Pronto!

Seu backend Connexa está funcionando! 

- **API REST:** `http://localhost:3001/api`
- **WebSocket:** `http://localhost:3001`
- **Health Check:** `http://localhost:3001/api/health`

Para mais detalhes, consulte o [README.md](README.md) completo.
