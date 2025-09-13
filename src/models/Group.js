const { getDatabase } = require('../config/database');

class Group {
  constructor(data) {
    this.id = data.id;
    this.subject = data.subject;
    this.objective = data.objective;
    this.location = data.location;
    this.description = data.description;
    this.maxMembers = data.max_members;
    this.meetingTime = data.meeting_time;
    this.meetingDays = data.meeting_days ? JSON.parse(data.meeting_days) : [];
    this.ownerId = data.owner_id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.owner = data.owner;
    this.members = data.members || [];
    this.memberCount = data.member_count || 0;
  }

  // Criar novo grupo
  static async create(groupData) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO groups (subject, objective, location, description, max_members, meeting_time, meeting_days, owner_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        groupData.subject,
        groupData.objective,
        groupData.location,
        groupData.description || null,
        groupData.maxMembers,
        groupData.meetingTime,
        JSON.stringify(groupData.meetingDays),
        groupData.ownerId
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

  // Buscar grupo por ID com detalhes completos
  static async findById(id, userId = null) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT g.*, 
               u.name as owner_name, u.email as owner_email, u.course as owner_course, 
               u.semester as owner_semester, u.avatar as owner_avatar,
               COUNT(gm.user_id) as member_count
        FROM groups g
        LEFT JOIN users u ON g.owner_id = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        WHERE g.id = ?
        GROUP BY g.id
      `;
      
      db.get(sql, [id], async (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          const group = new Group(row);
          
          // Buscar membros do grupo
          const members = await this.getGroupMembers(id);
          group.members = members;
          
          // Verificar se o usuário é membro
          if (userId) {
            group.isMember = members.some(member => member.id === userId);
            group.isOwner = group.ownerId === userId;
          }
          
          resolve(group);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Listar grupos com filtros e paginação
  static async findAll(filters = {}, page = 1, limit = 10) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT g.*, 
               u.name as owner_name, u.email as owner_email, u.course as owner_course, 
               u.semester as owner_semester, u.avatar as owner_avatar,
               COUNT(gm.user_id) as member_count
        FROM groups g
        LEFT JOIN users u ON g.owner_id = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
      `;
      
      const conditions = [];
      const params = [];
      
      // Aplicar filtros
      if (filters.subject) {
        conditions.push('g.subject LIKE ?');
        params.push(`%${filters.subject}%`);
      }
      
      if (filters.location) {
        conditions.push('g.location LIKE ?');
        params.push(`%${filters.location}%`);
      }
      
      if (filters.objective) {
        conditions.push('g.objective LIKE ?');
        params.push(`%${filters.objective}%`);
      }
      
      if (filters.course) {
        conditions.push('u.course = ?');
        params.push(filters.course);
      }
      
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      
      sql += ' GROUP BY g.id ORDER BY g.created_at DESC';
      
      // Aplicar paginação
      const offset = (page - 1) * limit;
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
      
      db.all(sql, params, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const groups = await Promise.all(
            rows.map(async (row) => {
              const group = new Group(row);
              group.members = await this.getGroupMembers(group.id);
              return group;
            })
          );
          resolve(groups);
        }
      });
    });
  }

  // Buscar grupos do usuário
  static async findByUserId(userId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT DISTINCT g.*, 
               u.name as owner_name, u.email as owner_email, u.course as owner_course, 
               u.semester as owner_semester, u.avatar as owner_avatar,
               COUNT(gm.user_id) as member_count
        FROM groups g
        LEFT JOIN users u ON g.owner_id = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        WHERE g.owner_id = ? OR g.id IN (
          SELECT group_id FROM group_members WHERE user_id = ?
        )
        GROUP BY g.id
        ORDER BY g.created_at DESC
      `;
      
      db.all(sql, [userId, userId], async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const groups = await Promise.all(
            rows.map(async (row) => {
              const group = new Group(row);
              group.members = await this.getGroupMembers(group.id);
              group.isOwner = group.ownerId === userId;
              group.isMember = true;
              return group;
            })
          );
          resolve(groups);
        }
      });
    });
  }

  // Buscar grupos por texto
  static async search(searchTerm, filters = {}, page = 1, limit = 10) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT g.*, 
               u.name as owner_name, u.email as owner_email, u.course as owner_course, 
               u.semester as owner_semester, u.avatar as owner_avatar,
               COUNT(gm.user_id) as member_count
        FROM groups g
        LEFT JOIN users u ON g.owner_id = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        WHERE (
          g.subject LIKE ? OR 
          g.objective LIKE ? OR 
          g.location LIKE ? OR 
          g.description LIKE ? OR
          u.name LIKE ?
        )
      `;
      
      const params = [
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`
      ];
      
      // Aplicar filtros adicionais
      if (filters.subject) {
        sql += ' AND g.subject LIKE ?';
        params.push(`%${filters.subject}%`);
      }
      
      if (filters.location) {
        sql += ' AND g.location LIKE ?';
        params.push(`%${filters.location}%`);
      }
      
      if (filters.course) {
        sql += ' AND u.course = ?';
        params.push(filters.course);
      }
      
      sql += ' GROUP BY g.id ORDER BY g.created_at DESC';
      
      // Aplicar paginação
      const offset = (page - 1) * limit;
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
      
      db.all(sql, params, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const groups = await Promise.all(
            rows.map(async (row) => {
              const group = new Group(row);
              group.members = await this.getGroupMembers(group.id);
              return group;
            })
          );
          resolve(groups);
        }
      });
    });
  }

  // Obter membros do grupo
  static async getGroupMembers(groupId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.*, gm.joined_at
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
        ORDER BY gm.joined_at ASC
      `;
      
      db.all(sql, [groupId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            id: row.id,
            name: row.name,
            email: row.email,
            course: row.course,
            semester: row.semester,
            phone: row.phone,
            bio: row.bio,
            avatar: row.avatar,
            joinedAt: row.joined_at
          })));
        }
      });
    });
  }

  // Adicionar membro ao grupo
  static async addMember(groupId, userId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)';
      
      db.run(sql, [groupId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Remover membro do grupo
  static async removeMember(groupId, userId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM group_members WHERE group_id = ? AND user_id = ?';
      
      db.run(sql, [groupId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // Verificar se usuário é membro do grupo
  static async isMember(groupId, userId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?';
      
      db.get(sql, [groupId, userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });
  }

  // Atualizar grupo
  async update(updateData) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id') {
          if (key === 'meetingDays') {
            fields.push('meeting_days = ?');
            values.push(JSON.stringify(updateData[key]));
          } else {
            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            fields.push(`${dbKey} = ?`);
            values.push(updateData[key]);
          }
        }
      });
      
      if (fields.length === 0) {
        resolve(this);
        return;
      }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(this.id);
      
      const sql = `UPDATE groups SET ${fields.join(', ')} WHERE id = ?`;
      
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

  // Deletar grupo
  async delete() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM groups WHERE id = ?';
      
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
      subject: this.subject,
      objective: this.objective,
      location: this.location,
      description: this.description,
      maxMembers: this.maxMembers,
      meetingTime: this.meetingTime,
      meetingDays: this.meetingDays,
      ownerId: this.ownerId,
      owner: this.owner ? {
        id: this.ownerId,
        name: this.owner_name,
        email: this.owner_email,
        course: this.owner_course,
        semester: this.owner_semester,
        avatar: this.owner_avatar
      } : null,
      members: this.members,
      memberCount: this.memberCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Group;
