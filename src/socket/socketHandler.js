const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// Armazenar usuários conectados e suas salas
const connectedUsers = new Map(); // userId -> socketId
const userRooms = new Map(); // userId -> Set of groupIds
const typingUsers = new Map(); // groupId -> Set of userIds

// Middleware de autenticação para Socket.io
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Token de autenticação necessário'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('Usuário não encontrado'));
    }

    socket.userId = user.id;
    socket.user = user.toPublicObject();
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
};

// Inicializar Socket.io
const initializeSocket = (io) => {
  // Aplicar middleware de autenticação
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`✅ Usuário conectado: ${socket.user.name} (ID: ${socket.userId})`);
    
    // Armazenar conexão do usuário
    connectedUsers.set(socket.userId, socket.id);
    userRooms.set(socket.userId, new Set());

    // Evento: Entrar em sala de chat do grupo
    socket.on('join_group', async (data) => {
      try {
        const { groupId } = data;
        
        if (!groupId) {
          socket.emit('error', { message: 'ID do grupo é obrigatório' });
          return;
        }

        // Verificar se usuário é membro do grupo
        const isMember = await Group.isMember(groupId, socket.userId);
        if (!isMember) {
          socket.emit('error', { message: 'Você não é membro deste grupo' });
          return;
        }

        // Entrar na sala
        const roomName = `group_${groupId}`;
        socket.join(roomName);
        
        // Armazenar sala do usuário
        userRooms.get(socket.userId).add(groupId);

        // Notificar outros membros que usuário entrou
        socket.to(roomName).emit('user_joined', {
          user: socket.user,
          groupId: groupId,
          timestamp: new Date().toISOString()
        });

        // Enviar confirmação para o usuário
        socket.emit('joined_group', {
          groupId: groupId,
          message: 'Você entrou no chat do grupo'
        });

        console.log(`👥 ${socket.user.name} entrou no grupo ${groupId}`);
      } catch (error) {
        console.error('Erro ao entrar no grupo:', error);
        socket.emit('error', { message: 'Erro ao entrar no grupo' });
      }
    });

    // Evento: Sair da sala de chat do grupo
    socket.on('leave_group', async (data) => {
      try {
        const { groupId } = data;
        
        if (!groupId) {
          socket.emit('error', { message: 'ID do grupo é obrigatório' });
          return;
        }

        // Sair da sala
        const roomName = `group_${groupId}`;
        socket.leave(roomName);
        
        // Remover sala do usuário
        userRooms.get(socket.userId)?.delete(groupId);

        // Parar indicador de digitação se estiver ativo
        const typingSet = typingUsers.get(groupId);
        if (typingSet) {
          typingSet.delete(socket.userId);
          if (typingSet.size === 0) {
            typingUsers.delete(groupId);
          } else {
            socket.to(roomName).emit('stop_typing', {
              userId: socket.userId,
              groupId: groupId
            });
          }
        }

        // Notificar outros membros que usuário saiu
        socket.to(roomName).emit('user_left', {
          user: socket.user,
          groupId: groupId,
          timestamp: new Date().toISOString()
        });

        // Enviar confirmação para o usuário
        socket.emit('left_group', {
          groupId: groupId,
          message: 'Você saiu do chat do grupo'
        });

        console.log(`👋 ${socket.user.name} saiu do grupo ${groupId}`);
      } catch (error) {
        console.error('Erro ao sair do grupo:', error);
        socket.emit('error', { message: 'Erro ao sair do grupo' });
      }
    });

    // Evento: Enviar mensagem
    socket.on('send_message', async (data) => {
      try {
        const { groupId, message } = data;
        
        if (!groupId || !message || message.trim().length === 0) {
          socket.emit('error', { message: 'Grupo e mensagem são obrigatórios' });
          return;
        }

        // Verificar se usuário é membro do grupo
        const isMember = await Group.isMember(groupId, socket.userId);
        if (!isMember) {
          socket.emit('error', { message: 'Você não é membro deste grupo' });
          return;
        }

        // Salvar mensagem no banco
        const messageId = await Message.create({
          groupId: groupId,
          userId: socket.userId,
          message: message.trim()
        });

        // Buscar mensagem completa
        const savedMessage = await Message.findById(messageId);

        // Enviar mensagem para todos os membros da sala
        const roomName = `group_${groupId}`;
        io.to(roomName).emit('new_message', {
          message: savedMessage,
          groupId: groupId
        });

        // Criar notificação para membros offline
        const members = await Group.getGroupMembers(groupId);
        const onlineMembers = new Set();
        
        // Identificar membros online
        for (const [userId, socketId] of connectedUsers) {
          if (members.some(member => member.id === userId)) {
            onlineMembers.add(userId);
          }
        }

        // Criar notificação para membros offline
        const offlineMembers = members
          .filter(member => !onlineMembers.has(member.id) && member.id !== socket.userId)
          .map(member => member.id);

        if (offlineMembers.length > 0) {
          await Notification.createForMultipleUsers(offlineMembers, {
            type: 'new_message',
            message: `Nova mensagem no grupo "${savedMessage.groupId}"`,
            data: {
              groupId: groupId,
              messageId: messageId,
              senderId: socket.userId,
              senderName: socket.user.name,
              message: message.trim()
            }
          });
        }

        console.log(`💬 ${socket.user.name} enviou mensagem no grupo ${groupId}`);
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        socket.emit('error', { message: 'Erro ao enviar mensagem' });
      }
    });

    // Evento: Indicador de digitação
    socket.on('typing', async (data) => {
      try {
        const { groupId } = data;
        
        if (!groupId) {
          return;
        }

        // Verificar se usuário é membro do grupo
        const isMember = await Group.isMember(groupId, socket.userId);
        if (!isMember) {
          return;
        }

        // Adicionar usuário aos que estão digitando
        if (!typingUsers.has(groupId)) {
          typingUsers.set(groupId, new Set());
        }
        typingUsers.get(groupId).add(socket.userId);

        // Notificar outros membros
        const roomName = `group_${groupId}`;
        socket.to(roomName).emit('typing', {
          userId: socket.userId,
          userName: socket.user.name,
          groupId: groupId
        });

        // Remover indicador após 3 segundos
        setTimeout(() => {
          const typingSet = typingUsers.get(groupId);
          if (typingSet) {
            typingSet.delete(socket.userId);
            if (typingSet.size === 0) {
              typingUsers.delete(groupId);
            } else {
              socket.to(roomName).emit('stop_typing', {
                userId: socket.userId,
                groupId: groupId
              });
            }
          }
        }, 3000);
      } catch (error) {
        console.error('Erro no indicador de digitação:', error);
      }
    });

    // Evento: Parar indicador de digitação
    socket.on('stop_typing', (data) => {
      try {
        const { groupId } = data;
        
        if (!groupId) {
          return;
        }

        const typingSet = typingUsers.get(groupId);
        if (typingSet) {
          typingSet.delete(socket.userId);
          if (typingSet.size === 0) {
            typingUsers.delete(groupId);
          } else {
            const roomName = `group_${groupId}`;
            socket.to(roomName).emit('stop_typing', {
              userId: socket.userId,
              groupId: groupId
            });
          }
        }
      } catch (error) {
        console.error('Erro ao parar indicador de digitação:', error);
      }
    });

    // Evento: Obter histórico de mensagens
    socket.on('get_messages', async (data) => {
      try {
        const { groupId, page = 1, limit = 50 } = data;
        
        if (!groupId) {
          socket.emit('error', { message: 'ID do grupo é obrigatório' });
          return;
        }

        // Verificar se usuário é membro do grupo
        const isMember = await Group.isMember(groupId, socket.userId);
        if (!isMember) {
          socket.emit('error', { message: 'Você não é membro deste grupo' });
          return;
        }

        // Buscar mensagens
        const messages = await Message.findByGroupId(groupId, page, limit);

        socket.emit('messages_history', {
          groupId: groupId,
          messages: messages,
          page: page,
          limit: limit
        });
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        socket.emit('error', { message: 'Erro ao buscar mensagens' });
      }
    });

    // Evento: Desconexão
    socket.on('disconnect', () => {
      console.log(`❌ Usuário desconectado: ${socket.user.name} (ID: ${socket.userId})`);
      
      // Remover usuário das conexões
      connectedUsers.delete(socket.userId);
      
      // Notificar grupos que usuário saiu
      const userGroups = userRooms.get(socket.userId);
      if (userGroups) {
        userGroups.forEach(groupId => {
          const roomName = `group_${groupId}`;
          socket.to(roomName).emit('user_left', {
            user: socket.user,
            groupId: groupId,
            timestamp: new Date().toISOString()
          });
        });
        userRooms.delete(socket.userId);
      }

      // Limpar indicadores de digitação
      typingUsers.forEach((typingSet, groupId) => {
        typingSet.delete(socket.userId);
        if (typingSet.size === 0) {
          typingUsers.delete(groupId);
        }
      });
    });
  });

  console.log('🔌 Socket.io inicializado com sucesso');
};

// Função para enviar notificação para usuário específico
const sendNotificationToUser = (userId, notification) => {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    const io = require('socket.io');
    io.to(socketId).emit('notification', notification);
  }
};

// Função para enviar notificação para grupo
const sendNotificationToGroup = (groupId, notification) => {
  const roomName = `group_${groupId}`;
  const io = require('socket.io');
  io.to(roomName).emit('group_notification', notification);
};

module.exports = {
  initializeSocket,
  sendNotificationToUser,
  sendNotificationToGroup,
  connectedUsers,
  userRooms
};
