const { getDatabase } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.course = data.course;
    this.semester = data.semester;
    this.phone = data.phone;
    this.bio = data.bio;
    this.avatar = data.avatar;
    this.resetPasswordToken = data.reset_password_token;
    this.resetPasswordExpires = data.reset_password_expires;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Criar novo usuário
  static async create(userData) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO users (name, email, password, course, semester, phone, bio, avatar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        userData.name,
        userData.email,
        userData.password,
        userData.course,
        userData.semester,
        userData.phone || null,
        userData.bio || null,
        userData.avatar || null
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

  // Buscar usuário por ID
  static async findById(id) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE id = ?';
      
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new User(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ?';
      
      db.get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new User(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  // Atualizar usuário
  async update(updateData) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });
      
      if (fields.length === 0) {
        resolve(this);
        return;
      }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(this.id);
      
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      
      db.run(sql, values, (err) => {
        if (err) {
          reject(err);
        } else {
          // Atualizar instância atual
          Object.assign(this, updateData);
          resolve(this);
        }
      });
    });
  }

  // Atualizar senha
  async updatePassword(newPassword) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      
      db.run(sql, [newPassword, this.id], (err) => {
        if (err) {
          reject(err);
        } else {
          this.password = newPassword;
          resolve(this);
        }
      });
    });
  }

  // Definir token de reset de senha
  async setResetPasswordToken(token, expires) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?';
      
      db.run(sql, [token, expires, this.id], (err) => {
        if (err) {
          reject(err);
        } else {
          this.resetPasswordToken = token;
          this.resetPasswordExpires = expires;
          resolve(this);
        }
      });
    });
  }

  // Limpar token de reset de senha
  async clearResetPasswordToken() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?';
      
      db.run(sql, [this.id], (err) => {
        if (err) {
          reject(err);
        } else {
          this.resetPasswordToken = null;
          this.resetPasswordExpires = null;
          resolve(this);
        }
      });
    });
  }

  // Buscar usuário por token de reset
  static async findByResetToken(token) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > ?';
      
      db.get(sql, [token, Date.now()], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new User(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  // Converter para objeto público (sem senha)
  toPublicObject() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      course: this.course,
      semester: this.semester,
      phone: this.phone,
      bio: this.bio,
      avatar: this.avatar,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Buscar usuários por IDs
  static async findByIds(ids) {
    if (!ids || ids.length === 0) return [];
    
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      const sql = `SELECT * FROM users WHERE id IN (${placeholders})`;
      
      db.all(sql, ids, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => new User(row)));
        }
      });
    });
  }
}

module.exports = User;
