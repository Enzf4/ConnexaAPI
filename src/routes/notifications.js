const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');

const NotificationController = require('../controllers/notificationController');

const router = express.Router();

// Todas as rotas de notificações requerem autenticação
router.use(authenticateToken);

// Rotas principais
router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.put('/read-all', NotificationController.markAllAsRead);
router.put('/:id/read', validateId, NotificationController.markAsRead);
router.delete('/:id', validateId, NotificationController.deleteNotification);

// Rotas administrativas (opcional - para testes ou admin)
router.post('/create', NotificationController.createNotification);
router.delete('/clean-old', NotificationController.cleanOldNotifications);

module.exports = router;
