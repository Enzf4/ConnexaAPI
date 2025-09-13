const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const emailService = require('./emailService');

class AuthService {
  // Registrar novo usuário
  static async register(userData) {
    try {
      // Verificar se email já existe
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email já está em uso');
      }

      // Hash da senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Criar usuário
      const userId = await User.create({
        ...userData,
        password: hashedPassword
      });

      // Buscar usuário criado
      const user = await User.findById(userId);
      
      // Gerar token JWT
      const token = generateToken(user.id);

      return {
        user: user.toPublicObject(),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Login do usuário
  static async login(email, password) {
    try {
      // Buscar usuário por email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Credenciais inválidas');
      }

      // Gerar token JWT
      const token = generateToken(user.id);

      return {
        user: user.toPublicObject(),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Atualizar perfil do usuário
  static async updateProfile(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Remover campos que não devem ser atualizados diretamente
      const { password, email, ...allowedUpdates } = updateData;
      
      await user.update(allowedUpdates);
      
      // Buscar usuário atualizado
      const updatedUser = await User.findById(userId);
      return updatedUser.toPublicObject();
    } catch (error) {
      throw error;
    }
  }

  // Atualizar senha
  static async updatePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Senha atual incorreta');
      }

      // Hash da nova senha
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Atualizar senha
      await user.updatePassword(hashedNewPassword);

      return { message: 'Senha atualizada com sucesso' };
    } catch (error) {
      throw error;
    }
  }

  // Solicitar recuperação de senha
  static async forgotPassword(email) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        // Por segurança, não revelar se o email existe ou não
        return { message: 'Se o email existir, você receberá instruções para redefinir sua senha' };
      }

      // Gerar token de reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = Date.now() + 3600000; // 1 hora

      // Salvar token no banco
      await user.setResetPasswordToken(resetToken, resetExpires);

      // Enviar email
      await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

      return { message: 'Se o email existir, você receberá instruções para redefinir sua senha' };
    } catch (error) {
      throw error;
    }
  }

  // Redefinir senha
  static async resetPassword(token, newPassword) {
    try {
      // Buscar usuário por token
      const user = await User.findByResetToken(token);
      if (!user) {
        throw new Error('Token inválido ou expirado');
      }

      // Hash da nova senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Atualizar senha e limpar token
      await user.updatePassword(hashedPassword);
      await user.clearResetPasswordToken();

      return { message: 'Senha redefinida com sucesso' };
    } catch (error) {
      throw error;
    }
  }

  // Verificar se senha é forte
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Senha deve ter pelo menos ${minLength} caracteres`);
    }
    if (!hasUpperCase) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }
    if (!hasLowerCase) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }
    if (!hasNumbers) {
      errors.push('Senha deve conter pelo menos um número');
    }
    if (!hasSpecialChar) {
      errors.push('Senha deve conter pelo menos um caractere especial (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Verificar se email é válido para domínios permitidos
  static validateEmailDomain(email) {
    const allowedDomains = [
      'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com',
      'estudante.ufpb.br', 'ufpb.br', 'uepb.edu.br', 'ufcg.edu.br',
      'ufrn.br', 'ufpe.br', 'ufmg.br', 'usp.br', 'unicamp.br',
      'unb.br', 'ufrj.br', 'ufsc.br', 'ufpr.br', 'ufba.br'
    ];

    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  }
}

module.exports = AuthService;
