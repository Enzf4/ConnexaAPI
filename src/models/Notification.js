const { getDatabase } = require('../config/database');

class Notification {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.type = data.type;
    this.message = data.message;
    this.data = data.data ? JSON.parse(data.data) : null;
    this.read = Boolean(data.read);
    this.timestamp = data.timestamp;
  }

  // Criar nova notificação
  static async create(notificationData) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO notifications (user_id, type, message, data)
        VALUES (?, ?, ?, ?)
      `;
      
      const params = [
        notificationData.userId,
        notificationData.type,
        notificationData.message,
        notificationData.data ? JSON.stringify(notificationData.data) : null
      ];

      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Buscar notificações do usuário
  static async findByUserId(userId, page = 1, limit = 20) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const offset = (page - 1) * limit;
      const sql = `
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ? OFFSET ?
      `;
      
      db.all(sql, [userId, limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const notifications = rows.map(row => new Notification(row));
          resolve(notifications);
        }
      });
    });
  }

  // Buscar notificação por ID
  static async findById(id) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM notifications WHERE id = ?';
      
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new Notification(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  // Contar notificações não lidas do usuário
  static async countUnreadByUserId(userId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0';
      
      db.get(sql, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  // Marcar notificação como lida
  async markAsRead() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE notifications SET read = 1 WHERE id = ?';
      
      db.run(sql, [this.id], (err) => {
        if (err) {
          reject(err);
        } else {
          this.read = true;
          resolve(this);
        }
      });
    });
  }

  // Marcar todas as notificações do usuário como lidas
  static async markAllAsReadByUserId(userId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0';
      
      db.run(sql, [userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // Deletar notificação
  async delete() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM notifications WHERE id = ?';
      
      db.run(sql, [this.id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  // Deletar notificações antigas (mais de 30 dias)
  static async deleteOldNotifications() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sql = 'DELETE FROM notifications WHERE timestamp < ?';
      
      db.run(sql, [thirtyDaysAgo.toISOString()], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // Criar notificação para múltiplos usuários
  static async createForMultipleUsers(userIds, notificationData) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO notifications (user_id, type, message, data)
        VALUES (?, ?, ?, ?)
      `;
      
      let completed = 0;
      const total = userIds.length;
      const notificationIds = [];
      
      userIds.forEach(userId => {
        const params = [
          userId,
          notificationData.type,
          notificationData.message,
          notificationData.data ? JSON.stringify(notificationData.data) : null
        ];
        
        db.run(sql, params, function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          notificationIds.push(this.lastID);
          completed++;
          
          if (completed === total) {
            resolve(notificationIds);
          }
        });
      });
    });
  }

  // Converter para objeto público
  toPublicObject() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      message: this.message,
      data: this.data,
      read: this.read,
      timestamp: this.timestamp
    };
  }
}

module.exports = Notification;
