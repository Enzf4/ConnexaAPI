const { getDatabase } = require('../config/database');

class Message {
  constructor(data) {
    this.id = data.id;
    this.groupId = data.group_id;
    this.userId = data.user_id;
    this.message = data.message;
    this.timestamp = data.timestamp;
    this.user = data.user;
  }

  // Criar nova mensagem
  static async create(messageData) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO messages (group_id, user_id, message)
        VALUES (?, ?, ?)
      `;
      
      const params = [
        messageData.groupId,
        messageData.userId,
        messageData.message
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

  // Buscar mensagens do grupo com paginação
  static async findByGroupId(groupId, page = 1, limit = 50) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const offset = (page - 1) * limit;
      const sql = `
        SELECT m.*, u.name as user_name, u.avatar as user_avatar
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.group_id = ?
        ORDER BY m.timestamp DESC
        LIMIT ? OFFSET ?
      `;
      
      db.all(sql, [groupId, limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const messages = rows.map(row => ({
            id: row.id,
            groupId: row.group_id,
            userId: row.user_id,
            message: row.message,
            timestamp: row.timestamp,
            user: {
              id: row.user_id,
              name: row.user_name,
              avatar: row.user_avatar
            }
          }));
          resolve(messages.reverse()); // Ordenar do mais antigo para o mais recente
        }
      });
    });
  }

  // Buscar mensagem por ID
  static async findById(id) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, u.name as user_name, u.avatar as user_avatar
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = ?
      `;
      
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            id: row.id,
            groupId: row.group_id,
            userId: row.user_id,
            message: row.message,
            timestamp: row.timestamp,
            user: {
              id: row.user_id,
              name: row.user_name,
              avatar: row.user_avatar
            }
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Contar mensagens do grupo
  static async countByGroupId(groupId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as count FROM messages WHERE group_id = ?';
      
      db.get(sql, [groupId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  // Buscar última mensagem do grupo
  static async getLastMessageByGroupId(groupId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, u.name as user_name, u.avatar as user_avatar
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.group_id = ?
        ORDER BY m.timestamp DESC
        LIMIT 1
      `;
      
      db.get(sql, [groupId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            id: row.id,
            groupId: row.group_id,
            userId: row.user_id,
            message: row.message,
            timestamp: row.timestamp,
            user: {
              id: row.user_id,
              name: row.user_name,
              avatar: row.user_avatar
            }
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Deletar mensagem
  async delete() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM messages WHERE id = ?';
      
      db.run(sql, [this.id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  // Converter para objeto público
  toPublicObject() {
    return {
      id: this.id,
      groupId: this.groupId,
      userId: this.userId,
      message: this.message,
      timestamp: this.timestamp,
      user: this.user
    };
  }
}

module.exports = Message;
