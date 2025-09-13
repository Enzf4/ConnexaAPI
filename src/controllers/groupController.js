const Group = require('../models/Group');
const User = require('../models/User');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const { asyncHandler } = require('../middleware/errorHandler');

class GroupController {
  // Criar novo grupo
  static createGroup = asyncHandler(async (req, res) => {
    try {
      const groupData = {
        ...req.body,
        ownerId: req.user.id
      };

      const groupId = await Group.create(groupData);
      
      // Adicionar criador como membro do grupo
      await Group.addMember(groupId, req.user.id);

      // Buscar grupo criado com detalhes
      const group = await Group.findById(groupId, req.user.id);

      res.status(201).json({
        message: 'Grupo criado com sucesso',
        data: group.toPublicObject()
      });
    } catch (error) {
      throw error;
    }
  });

  // Listar grupos com filtros e paginação
  static getGroups = asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const filters = {};
      if (req.query.subject) filters.subject = req.query.subject;
      if (req.query.location) filters.location = req.query.location;
      if (req.query.objective) filters.objective = req.query.objective;
      if (req.query.course) filters.course = req.query.course;

      const groups = await Group.findAll(filters, page, limit);

      res.json({
        message: 'Grupos obtidos com sucesso',
        data: groups.map(group => group.toPublicObject()),
        pagination: {
          page,
          limit,
          total: groups.length
        }
      });
    } catch (error) {
      throw error;
    }
  });

  // Obter detalhes de um grupo
  static getGroupById = asyncHandler(async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await Group.findById(groupId, req.user?.id);

      if (!group) {
        return res.status(404).json({
          error: 'Grupo não encontrado',
          message: 'O grupo solicitado não existe'
        });
      }

      res.json({
        message: 'Grupo obtido com sucesso',
        data: group.toPublicObject()
      });
    } catch (error) {
      throw error;
    }
  });

  // Entrar em um grupo
  static joinGroup = asyncHandler(async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      
      // Verificar se grupo existe
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          error: 'Grupo não encontrado',
          message: 'O grupo solicitado não existe'
        });
      }

      // Verificar se usuário já é membro
      const isMember = await Group.isMember(groupId, req.user.id);
      if (isMember) {
        return res.status(400).json({
          error: 'Usuário já é membro',
          message: 'Você já é membro deste grupo'
        });
      }

      // Verificar se grupo está cheio
      if (group.memberCount >= group.maxMembers) {
        return res.status(400).json({
          error: 'Grupo cheio',
          message: 'Este grupo já atingiu o número máximo de membros'
        });
      }

      // Adicionar usuário ao grupo
      await Group.addMember(groupId, req.user.id);

      // Buscar grupo atualizado
      const updatedGroup = await Group.findById(groupId, req.user.id);

      // Criar notificação para outros membros
      const members = await Group.getGroupMembers(groupId);
      const otherMembers = members.filter(member => member.id !== req.user.id);
      
      if (otherMembers.length > 0) {
        const memberIds = otherMembers.map(member => member.id);
        await Notification.createForMultipleUsers(memberIds, {
          type: 'new_member',
          message: `${req.user.name} entrou no grupo "${group.subject}"`,
          data: {
            groupId: groupId,
            groupName: group.subject,
            newMemberId: req.user.id,
            newMemberName: req.user.name
          }
        });

        // Enviar emails para outros membros (opcional)
        try {
          for (const member of otherMembers) {
            await emailService.sendNewMemberNotification(
              member.email,
              member.name,
              group.subject,
              req.user.name
            );
          }
        } catch (emailError) {
          console.error('Erro ao enviar emails de notificação:', emailError);
          // Não falhar a operação se o email falhar
        }
      }

      res.json({
        message: 'Você entrou no grupo com sucesso',
        data: updatedGroup.toPublicObject()
      });
    } catch (error) {
      throw error;
    }
  });

  // Sair de um grupo
  static leaveGroup = asyncHandler(async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      
      // Verificar se grupo existe
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          error: 'Grupo não encontrado',
          message: 'O grupo solicitado não existe'
        });
      }

      // Verificar se usuário é membro
      const isMember = await Group.isMember(groupId, req.user.id);
      if (!isMember) {
        return res.status(400).json({
          error: 'Usuário não é membro',
          message: 'Você não é membro deste grupo'
        });
      }

      // Verificar se usuário é o dono do grupo
      if (group.ownerId === req.user.id) {
        return res.status(400).json({
          error: 'Dono do grupo',
          message: 'O dono do grupo não pode sair. Transfira a propriedade ou delete o grupo.'
        });
      }

      // Remover usuário do grupo
      await Group.removeMember(groupId, req.user.id);

      // Criar notificação para outros membros
      const members = await Group.getGroupMembers(groupId);
      const otherMembers = members.filter(member => member.id !== req.user.id);
      
      if (otherMembers.length > 0) {
        const memberIds = otherMembers.map(member => member.id);
        await Notification.createForMultipleUsers(memberIds, {
          type: 'member_left',
          message: `${req.user.name} saiu do grupo "${group.subject}"`,
          data: {
            groupId: groupId,
            groupName: group.subject,
            leftMemberId: req.user.id,
            leftMemberName: req.user.name
          }
        });
      }

      res.json({
        message: 'Você saiu do grupo com sucesso'
      });
    } catch (error) {
      throw error;
    }
  });

  // Obter grupos do usuário
  static getMyGroups = asyncHandler(async (req, res) => {
    try {
      const groups = await Group.findByUserId(req.user.id);

      res.json({
        message: 'Seus grupos obtidos com sucesso',
        data: groups.map(group => group.toPublicObject())
      });
    } catch (error) {
      throw error;
    }
  });

  // Buscar grupos por texto
  static searchGroups = asyncHandler(async (req, res) => {
    try {
      const searchTerm = req.query.q;
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          error: 'Termo de busca inválido',
          message: 'Informe pelo menos 2 caracteres para buscar'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const filters = {};
      if (req.query.subject) filters.subject = req.query.subject;
      if (req.query.location) filters.location = req.query.location;
      if (req.query.course) filters.course = req.query.course;

      const groups = await Group.search(searchTerm.trim(), filters, page, limit);

      res.json({
        message: 'Busca realizada com sucesso',
        data: groups.map(group => group.toPublicObject()),
        pagination: {
          page,
          limit,
          total: groups.length,
          searchTerm: searchTerm.trim()
        }
      });
    } catch (error) {
      throw error;
    }
  });

  // Atualizar grupo (apenas dono)
  static updateGroup = asyncHandler(async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      
      // Verificar se grupo existe
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          error: 'Grupo não encontrado',
          message: 'O grupo solicitado não existe'
        });
      }

      // Verificar se usuário é o dono
      if (group.ownerId !== req.user.id) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Apenas o dono do grupo pode editá-lo'
        });
      }

      // Atualizar grupo
      await group.update(req.body);

      // Buscar grupo atualizado
      const updatedGroup = await Group.findById(groupId, req.user.id);

      res.json({
        message: 'Grupo atualizado com sucesso',
        data: updatedGroup.toPublicObject()
      });
    } catch (error) {
      throw error;
    }
  });

  // Deletar grupo (apenas dono)
  static deleteGroup = asyncHandler(async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      
      // Verificar se grupo existe
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          error: 'Grupo não encontrado',
          message: 'O grupo solicitado não existe'
        });
      }

      // Verificar se usuário é o dono
      if (group.ownerId !== req.user.id) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Apenas o dono do grupo pode deletá-lo'
        });
      }

      // Deletar grupo
      await group.delete();

      res.json({
        message: 'Grupo deletado com sucesso'
      });
    } catch (error) {
      throw error;
    }
  });

  // Obter membros do grupo
  static getGroupMembers = asyncHandler(async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      
      // Verificar se grupo existe
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          error: 'Grupo não encontrado',
          message: 'O grupo solicitado não existe'
        });
      }

      // Verificar se usuário é membro ou dono
      const isMember = await Group.isMember(groupId, req.user.id);
      const isOwner = group.ownerId === req.user.id;
      
      if (!isMember && !isOwner) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Apenas membros do grupo podem ver a lista de membros'
        });
      }

      const members = await Group.getGroupMembers(groupId);

      res.json({
        message: 'Membros obtidos com sucesso',
        data: members
      });
    } catch (error) {
      throw error;
    }
  });
}

module.exports = GroupController;
