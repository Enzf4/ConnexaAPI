# 🧪 Exemplos de Uso da API Connexa

## 🔐 Autenticação

### 1. Registrar Usuário
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@teste.com",
    "password": "Senha123!",
    "course": "Ciência da Computação",
    "semester": 3,
    "phone": "(83) 99999-9999",
    "bio": "Estudante apaixonado por programação"
  }'
```

### 2. Fazer Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.silva@gmail.com",
    "password": "Senha123!"
  }'
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "name": "João Silva",
      "email": "joao.silva@gmail.com",
      "course": "Ciência da Computação",
      "semester": 5
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Obter Perfil (usar o token)
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 👥 Grupos

### 1. Listar Grupos
```bash
curl -X GET "http://localhost:3001/api/groups?page=1&limit=10"
```

### 2. Criar Grupo
```bash
curl -X POST http://localhost:3001/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "subject": "Algoritmos Avançados",
    "objective": "Estudar algoritmos de ordenação e busca",
    "location": "Biblioteca Central - Sala 201",
    "description": "Grupo focado em algoritmos de ordenação e estruturas de dados",
    "maxMembers": 8,
    "meetingTime": "19:00",
    "meetingDays": ["segunda", "quarta", "sexta"]
  }'
```

### 3. Entrar em Grupo
```bash
curl -X POST http://localhost:3001/api/groups/1/join \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 4. Buscar Grupos
```bash
curl -X GET "http://localhost:3001/api/groups/search?q=algoritmos&page=1&limit=10"
```

### 5. Obter Grupos do Usuário
```bash
curl -X GET http://localhost:3001/api/groups/my-groups \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🔔 Notificações

### 1. Obter Notificações
```bash
curl -X GET http://localhost:3001/api/notifications \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 2. Marcar como Lida
```bash
curl -X PUT http://localhost:3001/api/notifications/1/read \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 📁 Upload de Avatar

### 1. Upload de Imagem
```bash
curl -X POST http://localhost:3001/api/auth/avatar \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "avatar=@caminho/para/sua/imagem.jpg"
```

## 🏥 Sistema

### 1. Health Check
```bash
curl -X GET http://localhost:3001/api/health
```

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

## 🔌 WebSocket (Socket.io)

### Conectar com JavaScript
```javascript
import io from 'socket.io-client';

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

// Escutar notificações
socket.on('notification', (notification) => {
  console.log('Nova notificação:', notification);
});
```

### Conectar com React
```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const ChatComponent = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      const newSocket = io('http://localhost:3001', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Conectado ao servidor');
      });

      newSocket.on('new_message', (data) => {
        setMessages(prev => [...prev, data.message]);
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [token]);

  const sendMessage = (groupId, message) => {
    if (socket) {
      socket.emit('send_message', { groupId, message });
    }
  };

  return (
    <div>
      {/* Seu componente de chat */}
    </div>
  );
};
```

## 🧪 Usuários de Teste Disponíveis

| Email | Senha | Curso | Período |
|-------|-------|-------|---------|
| joao.silva@gmail.com | Senha123! | Ciência da Computação | 5 |
| maria.santos@estudante.ufpb.br | Senha123! | Engenharia de Software | 3 |
| pedro.oliveira@ufpb.br | Senha123! | Sistemas de Informação | 7 |
| ana.costa@gmail.com | Senha123! | Ciência da Computação | 2 |
| carlos.ferreira@outlook.com | Senha123! | Engenharia de Software | 6 |

## 📊 Grupos de Teste Disponíveis

1. **Algoritmos e Estruturas de Dados** - 8 membros máx
2. **Desenvolvimento Web** - 6 membros máx
3. **Banco de Dados** - 5 membros máx
4. **Programação Orientada a Objetos** - 7 membros máx
5. **Desenvolvimento Mobile** - 4 membros máx

## 🚀 Teste Rápido

1. **Faça login com um usuário de teste:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao.silva@gmail.com", "password": "Senha123!"}'
```

2. **Use o token retornado para acessar outras rotas**

3. **Teste o WebSocket conectando no frontend**

## 🔧 Configuração do Frontend

Use o arquivo `frontend-config.js` que foi criado para facilitar a integração com o React!
