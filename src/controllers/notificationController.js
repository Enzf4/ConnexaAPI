const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');

class NotificationController {
  // Obter notificações do usuário
  static getNotifications = asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const unreadOnly = req.query.unread === 'true';

      let notifications;
      if (unreadOnly) {
        // Buscar apenas notificações não lidas
        notifications = await Notification.findByUserId(req.user.id, page, limit);
        notifications = notifications.filter(notification => !notification.read);
      } else {
        notifications = await Notification.findByUserId(req.user.id, page, limit);
      }

      // Contar notificações não lidas
      const unreadCount = await Notification.countUnreadByUserId(req.user.id);

      res.json({
        message: 'Notificações obtidas com sucesso',
        data: notifications.map(notification => notification.toPublicObject()),
        pagination: {
          page,
          limit,
          total: notifications.length
        },
        unreadCount
      });
    } catch (error) {
      throw error;
    }
  });

  // Marcar notificação como lida
  static markAsRead = asyncHandler(async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return res.status(404).json({
          error: 'Notificação não encontrada',
          message: 'A notificação solicitada não existe'
        });
      }

      // Verificar se a notificação pertence ao usuário
      if (notification.userId !== req.user.id) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não pode marcar esta notificação como lida'
        });
      }

      // Marcar como lida
      await notification.markAsRead();

      res.json({
        message: 'Notificação marcada como lida',
        data: notification.toPublicObject()
      });
    } catch (error) {
      throw error;
    }
  });

  // Marcar todas as notificações como lidas
  static markAllAsRead = asyncHandler(async (req, res) => {
    try {
      const updatedCount = await Notification.markAllAsReadByUserId(req.user.id);

      res.json({
        message: 'Todas as notificações foram marcadas como lidas',
        data: {
          updatedCount
        }
      });
    } catch (error) {
      throw error;
    }
  });

  // Deletar notificação
  static deleteNotification = asyncHandler(async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return res.status(404).json({
          error: 'Notificação não encontrada',
          message: 'A notificação solicitada não existe'
        });
      }

      // Verificar se a notificação pertence ao usuário
      if (notification.userId !== req.user.id) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não pode deletar esta notificação'
        });
      }

      // Deletar notificação
      await notification.delete();

      res.json({
        message: 'Notificação deletada com sucesso'
      });
    } catch (error) {
      throw error;
    }
  });

  // Obter contagem de notificações não lidas
  static getUnreadCount = asyncHandler(async (req, res) => {
    try {
      const unreadCount = await Notification.countUnreadByUserId(req.user.id);

      res.json({
        message: 'Contagem obtida com sucesso',
        data: {
          unreadCount
        }
      });
    } catch (error) {
      throw error;
    }
  });

  // Criar notificação manual (para testes ou admin)
  static createNotification = asyncHandler(async (req, res) => {
    try {
      const { userId, type, message, data } = req.body;

      // Verificar se todos os campos obrigatórios foram fornecidos
      if (!userId || !type || !message) {
        return res.status(400).json({
          error: 'Campos obrigatórios',
          message: 'userId, type e message são obrigatórios'
        });
      }

      // Verificar se o usuário existe
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'O usuário especificado não existe'
        });
      }

      // Criar notificação
      const notificationId = await Notification.create({
        userId,
        type,
        message,
        data
      });

      // Buscar notificação criada
      const notification = await Notification.findById(notificationId);

      res.status(201).json({
        message: 'Notificação criada com sucesso',
        data: notification.toPublicObject()
      });
    } catch (error) {
      throw error;
    }
  });

  // Limpar notificações antigas (manutenção)
  static cleanOldNotifications = asyncHandler(async (req, res) => {
    try {
      const deletedCount = await Notification.deleteOldNotifications();

      res.json({
        message: 'Notificações antigas removidas com sucesso',
        data: {
          deletedCount
        }
      });
    } catch (error) {
      throw error;
    }
  });
}

module.exports = NotificationController;
