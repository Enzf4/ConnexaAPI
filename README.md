# 🎓 Connexa Backend

Backend completo da plataforma **Connexa** - uma aplicação para grupos de estudo universitários com chat em tempo real, notificações e sistema de autenticação robusto.

## 🚀 Características Principais

- **🔐 Autenticação JWT** com recuperação de senha
- **👥 Sistema de Grupos** com criação, busca e gerenciamento
- **💬 Chat em Tempo Real** com Socket.io
- **🔔 Notificações Instantâneas** via WebSocket
- **📁 Upload de Arquivos** com processamento de imagens
- **📧 Sistema de Email** com templates HTML
- **🗄️ Banco SQLite** com modelos bem estruturados
- **🛡️ Segurança** com validações e rate limiting

## 🛠️ Stack Tecnológica

- **Node.js** (16+)
- **Express.js** - Framework web
- **Socket.io** - WebSockets para chat e notificações
- **SQLite** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Multer** - Upload de arquivos
- **Sharp** - Processamento de imagens
- **Nodemailer** - Envio de emails
- **Express-validator** - Validações
- **Helmet** - Headers de segurança
- **CORS** - Configuração CORS

## 📋 Pré-requisitos

- Node.js 16 ou superior
- npm ou yarn
- Git

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd ConnexaAPI
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
```

4. **Edite o arquivo `.env` com suas configurações**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DB_PATH=./database/connexa.db

# JWT Configuration
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_mude_em_producao
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app
EMAIL_FROM=Connexa <noreply@connexa.com>

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

5. **Inicialize o banco de dados com dados de exemplo**
```bash
npm run init-db
```

6. **Inicie o servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📡 Endpoints da API

### 🔐 Autenticação

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/auth/register` | Registrar novo usuário | ❌ |
| POST | `/api/auth/login` | Fazer login | ❌ |
| GET | `/api/auth/profile` | Obter perfil do usuário | ✅ |
| PUT | `/api/auth/profile` | Atualizar perfil | ✅ |
| POST | `/api/auth/avatar` | Upload de foto de perfil | ✅ |
| DELETE | `/api/auth/avatar` | Remover foto de perfil | ✅ |
| PUT | `/api/auth/password` | Atualizar senha | ✅ |
| POST | `/api/auth/forgot-password` | Solicitar recuperação de senha | ❌ |
| POST | `/api/auth/reset-password` | Redefinir senha | ❌ |
| GET | `/api/auth/check-email` | Verificar disponibilidade de email | ❌ |
| POST | `/api/auth/validate-password` | Validar força da senha | ❌ |

### 👥 Grupos

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/groups` | Listar grupos com filtros | 🔄 |
| POST | `/api/groups` | Criar novo grupo | ✅ |
| GET | `/api/groups/:id` | Obter detalhes do grupo | 🔄 |
| POST | `/api/groups/:id/join` | Entrar no grupo | ✅ |
| POST | `/api/groups/:id/leave` | Sair do grupo | ✅ |
| PUT | `/api/groups/:id` | Atualizar grupo (apenas dono) | ✅ |
| DELETE | `/api/groups/:id` | Deletar grupo (apenas dono) | ✅ |
| GET | `/api/groups/my-groups` | Grupos do usuário | ✅ |
| GET | `/api/groups/search` | Buscar grupos por texto | 🔄 |
| GET | `/api/groups/:id/members` | Listar membros do grupo | ✅ |

### 🔔 Notificações

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/notifications` | Obter notificações do usuário | ✅ |
| GET | `/api/notifications/unread-count` | Contar notificações não lidas | ✅ |
| PUT | `/api/notifications/:id/read` | Marcar notificação como lida | ✅ |
| PUT | `/api/notifications/read-all` | Marcar todas como lidas | ✅ |
| DELETE | `/api/notifications/:id` | Deletar notificação | ✅ |

### 🏥 Sistema

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/health` | Health check do servidor | ❌ |

**Legenda:**
- ✅ Requer autenticação
- ❌ Público
- 🔄 Autenticação opcional

## 🔌 WebSocket Events

### Eventos do Cliente → Servidor

| Evento | Descrição | Dados |
|--------|-----------|-------|
| `join_group` | Entrar em sala de chat | `{ groupId }` |
| `leave_group` | Sair da sala de chat | `{ groupId }` |
| `send_message` | Enviar mensagem | `{ groupId, message }` |
| `typing` | Indicador de digitação | `{ groupId }` |
| `stop_typing` | Parar indicador | `{ groupId }` |
| `get_messages` | Obter histórico | `{ groupId, page?, limit? }` |

### Eventos do Servidor → Cliente

| Evento | Descrição | Dados |
|--------|-----------|-------|
| `joined_group` | Confirmação de entrada | `{ groupId, message }` |
| `left_group` | Confirmação de saída | `{ groupId, message }` |
| `user_joined` | Usuário entrou no grupo | `{ user, groupId, timestamp }` |
| `user_left` | Usuário saiu do grupo | `{ user, groupId, timestamp }` |
| `new_message` | Nova mensagem | `{ message, groupId }` |
| `typing` | Usuário digitando | `{ userId, userName, groupId }` |
| `stop_typing` | Usuário parou de digitar | `{ userId, groupId }` |
| `messages_history` | Histórico de mensagens | `{ groupId, messages, page, limit }` |
| `notification` | Notificação pessoal | `{ notification }` |
| `group_notification` | Notificação do grupo | `{ notification }` |
| `error` | Erro | `{ message }` |

## 🧪 Dados de Teste

Após executar `npm run init-db`, você terá acesso aos seguintes usuários de teste:

| Email | Senha | Curso | Período |
|-------|-------|-------|---------|
| joao.silva@gmail.com | Senha123! | Ciência da Computação | 5 |
| maria.santos@estudante.ufpb.br | Senha123! | Engenharia de Software | 3 |
| pedro.oliveira@ufpb.br | Senha123! | Sistemas de Informação | 7 |
| ana.costa@gmail.com | Senha123! | Ciência da Computação | 2 |
| carlos.ferreira@outlook.com | Senha123! | Engenharia de Software | 6 |

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento com nodemon
npm run dev

# Produção
npm start

# Inicializar banco com dados de exemplo
npm run init-db

# Testes (quando implementados)
npm test
```

## 📁 Estrutura de Arquivos

```
ConnexaAPI/
├── src/
│   ├── config/
│   │   └── database.js          # Configuração do SQLite
│   ├── controllers/
│   │   ├── authController.js    # Controlador de autenticação
│   │   ├── groupController.js   # Controlador de grupos
│   │   └── notificationController.js # Controlador de notificações
│   ├── middleware/
│   │   ├── auth.js              # Middleware de autenticação JWT
│   │   ├── errorHandler.js      # Tratamento de erros
│   │   └── validation.js        # Validações com express-validator
│   ├── models/
│   │   ├── User.js              # Modelo de usuário
│   │   ├── Group.js             # Modelo de grupo
│   │   ├── Message.js           # Modelo de mensagem
│   │   └── Notification.js       # Modelo de notificação
│   ├── routes/
│   │   ├── auth.js              # Rotas de autenticação
│   │   ├── groups.js            # Rotas de grupos
│   │   └── notifications.js     # Rotas de notificações
│   ├── services/
│   │   ├── authService.js       # Serviços de autenticação
│   │   └── emailService.js      # Serviços de email
│   ├── socket/
│   │   └── socketHandler.js     # Lógica do Socket.io
│   └── utils/
│       └── helpers.js            # Funções utilitárias
├── scripts/
│   └── init-db.js               # Script de inicialização do banco
├── uploads/                       # Diretório de uploads
├── database/                      # Diretório do banco SQLite
├── server.js                     # Arquivo principal
├── package.json                  # Dependências e scripts
├── env.example                   # Exemplo de variáveis de ambiente
└── README.md                     # Este arquivo
```

## 🔧 Configuração do Frontend

Para conectar com o frontend React, configure as seguintes variáveis:

```javascript
// Configuração do frontend
const API_BASE_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// Exemplo de uso do Socket.io no frontend
import io from 'socket.io-client';

const socket = io(SOCKET_URL, {
  auth: {
    token: 'seu_jwt_token_aqui'
  }
});

// Eventos do chat
socket.emit('join_group', { groupId: 1 });
socket.on('new_message', (data) => {
  console.log('Nova mensagem:', data.message);
});
```

## 🐛 Solução de Problemas

### Erro de conexão com banco de dados
```bash
# Verifique se o diretório database existe
mkdir -p database

# Execute o script de inicialização
npm run init-db
```

### Erro de email
- Verifique as credenciais do Gmail
- Certifique-se de que a senha de app está correta
- Verifique se a verificação em 2 etapas está ativa

### Erro de upload de arquivos
- Verifique se o diretório `uploads` existe
- Verifique as permissões de escrita
- Confirme o tamanho máximo do arquivo

### Erro de CORS
- Verifique se `FRONTEND_URL` está configurado corretamente
- Certifique-se de que o frontend está rodando na URL especificada

## 📝 Logs

O servidor gera logs detalhados para:
- ✅ Conexões de banco de dados
- 🔌 Conexões WebSocket
- 📧 Envio de emails
- ❌ Erros e exceções
- 🔐 Tentativas de autenticação

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através de:
- 📧 Email: suporte@connexa.com
- 🐛 Issues: [GitHub Issues](https://github.com/connexa/issues)
- 📖 Documentação: [Wiki do projeto](https://github.com/connexa/wiki)

---

**Desenvolvido com ❤️ para conectar estudantes universitários**