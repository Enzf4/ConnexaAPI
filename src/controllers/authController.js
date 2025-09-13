const AuthService = require('../services/authService');
const emailService = require('../services/emailService');
const { asyncHandler } = require('../middleware/errorHandler');

class AuthController {
  // Registrar novo usuário
  static register = asyncHandler(async (req, res) => {
    try {
      const result = await AuthService.register(req.body);
      
      // Enviar email de boas-vindas (opcional)
      try {
        await emailService.sendWelcomeEmail(req.body.email, req.body.name);
      } catch (emailError) {
        console.error('Erro ao enviar email de boas-vindas:', emailError);
        // Não falhar o registro se o email falhar
      }

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        data: result
      });
    } catch (error) {
      if (error.message === 'Email já está em uso') {
        return res.status(409).json({
          error: 'Email já está em uso',
          message: 'Este email já está cadastrado na plataforma'
        });
      }
      throw error;
    }
  });

  // Login do usuário
  static login = asyncHandler(async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      res.json({
        message: 'Login realizado com sucesso',
        data: result
      });
    } catch (error) {
      if (error.message === 'Credenciais inválidas') {
        return res.status(401).json({
          error: 'Credenciais inválidas',
          message: 'Email ou senha incorretos'
        });
      }
      throw error;
    }
  });

  // Obter perfil do usuário autenticado
  static getProfile = asyncHandler(async (req, res) => {
    res.json({
      message: 'Perfil obtido com sucesso',
      data: req.user.toPublicObject()
    });
  });

  // Atualizar perfil do usuário
  static updateProfile = asyncHandler(async (req, res) => {
    try {
      const updatedUser = await AuthService.updateProfile(req.user.id, req.body);

      res.json({
        message: 'Perfil atualizado com sucesso',
        data: updatedUser
      });
    } catch (error) {
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Usuário não foi encontrado'
        });
      }
      throw error;
    }
  });

  // Atualizar senha
  static updatePassword = asyncHandler(async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Validar força da nova senha
      const passwordValidation = AuthService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: 'Senha fraca',
          message: 'A nova senha não atende aos critérios de segurança',
          details: passwordValidation.errors
        });
      }

      const result = await AuthService.updatePassword(req.user.id, currentPassword, newPassword);

      res.json({
        message: result.message
      });
    } catch (error) {
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Usuário não foi encontrado'
        });
      }
      if (error.message === 'Senha atual incorreta') {
        return res.status(400).json({
          error: 'Senha atual incorreta',
          message: 'A senha atual informada está incorreta'
        });
      }
      throw error;
    }
  });

  // Solicitar recuperação de senha
  static forgotPassword = asyncHandler(async (req, res) => {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);

      res.json({
        message: result.message
      });
    } catch (error) {
      throw error;
    }
  });

  // Redefinir senha
  static resetPassword = asyncHandler(async (req, res) => {
    try {
      const { token, password } = req.body;
      
      // Validar força da nova senha
      const passwordValidation = AuthService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: 'Senha fraca',
          message: 'A nova senha não atende aos critérios de segurança',
          details: passwordValidation.errors
        });
      }

      const result = await AuthService.resetPassword(token, password);

      res.json({
        message: result.message
      });
    } catch (error) {
      if (error.message === 'Token inválido ou expirado') {
        return res.status(400).json({
          error: 'Token inválido',
          message: 'Token de recuperação inválido ou expirado'
        });
      }
      throw error;
    }
  });

  // Verificar se email está disponível
  static checkEmailAvailability = asyncHandler(async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({
          error: 'Email é obrigatório',
          message: 'Informe um email para verificar disponibilidade'
        });
      }

      // Validar domínio do email
      if (!AuthService.validateEmailDomain(email)) {
        return res.status(400).json({
          error: 'Domínio não permitido',
          message: 'Este domínio de email não é permitido'
        });
      }

      const user = await User.findByEmail(email);
      const isAvailable = !user;

      res.json({
        message: 'Verificação concluída',
        data: {
          email,
          available: isAvailable
        }
      });
    } catch (error) {
      throw error;
    }
  });

  // Validar força da senha
  static validatePassword = asyncHandler(async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({
          error: 'Senha é obrigatória',
          message: 'Informe uma senha para validação'
        });
      }

      const validation = AuthService.validatePasswordStrength(password);

      res.json({
        message: 'Validação concluída',
        data: {
          isValid: validation.isValid,
          errors: validation.errors
        }
      });
    } catch (error) {
      throw error;
    }
  });
}

module.exports = AuthController;
