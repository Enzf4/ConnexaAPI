// 🎯 Configuração para conectar o Frontend React com o Backend Connexa

// URLs do Backend
export const API_BASE_URL = 'http://localhost:3001/api';
export const SOCKET_URL = 'http://localhost:3001';

// Configuração do Axios para API REST
import axios from 'axios';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Configuração do Socket.io para chat
import io from 'socket.io-client';

export const createSocketConnection = (token) => {
  return io(SOCKET_URL, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling']
  });
};

// Exemplos de uso no Frontend:

// 1. Login
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data.data;
    
    // Salvar no localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token };
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 2. Registro
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    const { user, token } = response.data.data;
    
    // Salvar no localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token };
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 3. Obter perfil
export const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 4. Listar grupos
export const getGroups = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/groups?${params}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 5. Criar grupo
export const createGroup = async (groupData) => {
  try {
    const response = await api.post('/groups', groupData);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 6. Entrar em grupo
export const joinGroup = async (groupId) => {
  try {
    const response = await api.post(`/groups/${groupId}/join`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 7. Obter notificações
export const getNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 8. Upload de avatar
export const uploadAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Hook personalizado para Socket.io
export const useSocket = (token) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (token) {
      const newSocket = createSocketConnection(token);
      
      newSocket.on('connect', () => {
        console.log('🔌 Conectado ao servidor');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Desconectado do servidor');
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token]);

  return { socket, connected };
};

// Exemplo de uso do Socket.io no componente React:
/*
import { useSocket } from './frontend-config';

const ChatComponent = () => {
  const token = localStorage.getItem('token');
  const { socket, connected } = useSocket(token);

  useEffect(() => {
    if (socket) {
      // Entrar em grupo
      socket.emit('join_group', { groupId: 1 });

      // Escutar mensagens
      socket.on('new_message', (data) => {
        console.log('Nova mensagem:', data.message);
      });

      // Escutar notificações
      socket.on('notification', (notification) => {
        console.log('Nova notificação:', notification);
      });
    }
  }, [socket]);

  const sendMessage = (groupId, message) => {
    if (socket) {
      socket.emit('send_message', { groupId, message });
    }
  };

  return (
    <div>
      <p>Status: {connected ? 'Conectado' : 'Desconectado'}</p>
      {/* Seu componente de chat aqui */}
    </div>
  );
};
*/

// Endpoints disponíveis:
export const ENDPOINTS = {
  // Autenticação
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  UPDATE_PROFILE: '/auth/profile',
  UPLOAD_AVATAR: '/auth/avatar',
  DELETE_AVATAR: '/auth/avatar',
  UPDATE_PASSWORD: '/auth/password',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  
  // Grupos
  GROUPS: '/groups',
  CREATE_GROUP: '/groups',
  GROUP_DETAILS: (id) => `/groups/${id}`,
  JOIN_GROUP: (id) => `/groups/${id}/join`,
  LEAVE_GROUP: (id) => `/groups/${id}/leave`,
  UPDATE_GROUP: (id) => `/groups/${id}`,
  DELETE_GROUP: (id) => `/groups/${id}`,
  MY_GROUPS: '/groups/my-groups',
  SEARCH_GROUPS: '/groups/search',
  GROUP_MEMBERS: (id) => `/groups/${id}/members`,
  
  // Notificações
  NOTIFICATIONS: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
  MARK_AS_READ: (id) => `/notifications/${id}/read`,
  MARK_ALL_READ: '/notifications/read-all',
  DELETE_NOTIFICATION: (id) => `/notifications/${id}`,
  
  // Sistema
  HEALTH: '/health'
};

// Eventos do Socket.io disponíveis:
export const SOCKET_EVENTS = {
  // Cliente → Servidor
  JOIN_GROUP: 'join_group',
  LEAVE_GROUP: 'leave_group',
  SEND_MESSAGE: 'send_message',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  GET_MESSAGES: 'get_messages',
  
  // Servidor → Cliente
  JOINED_GROUP: 'joined_group',
  LEFT_GROUP: 'left_group',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  NEW_MESSAGE: 'new_message',
  TYPING_INDICATOR: 'typing',
  STOP_TYPING_INDICATOR: 'stop_typing',
  MESSAGES_HISTORY: 'messages_history',
  NOTIFICATION: 'notification',
  GROUP_NOTIFICATION: 'group_notification',
  ERROR: 'error'
};

export default {
  API_BASE_URL,
  SOCKET_URL,
  api,
  createSocketConnection,
  login,
  register,
  getProfile,
  getGroups,
  createGroup,
  joinGroup,
  getNotifications,
  uploadAvatar,
  useSocket,
  ENDPOINTS,
  SOCKET_EVENTS
};
