const { body, param, query, validationResult } = require('express-validator');

// Middleware para tratar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array()
    });
  }
  next();
};

// Validações para registro de usuário
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido')
    .custom((value) => {
      const allowedDomains = [
        'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com',
        'estudante.ufpb.br', 'ufpb.br', 'uepb.edu.br', 'ufcg.edu.br',
        'ufrn.br', 'ufpe.br', 'ufmg.br', 'usp.br', 'unicamp.br'
      ];
      
      const domain = value.split('@')[1];
      if (!allowedDomains.includes(domain)) {
        throw new Error('Email deve ser de um domínio válido');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial'),
  
  body('course')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Curso deve ter entre 2 e 100 caracteres'),
  
  body('semester')
    .isInt({ min: 1, max: 20 })
    .withMessage('Período deve ser um número entre 1 e 20'),
  
  body('phone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone inválido'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio deve ter no máximo 500 caracteres'),
  
  handleValidationErrors
];

// Validações para login
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  
  handleValidationErrors
];

// Validações para atualização de perfil
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  
  body('course')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Curso deve ter entre 2 e 100 caracteres'),
  
  body('semester')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Período deve ser um número entre 1 e 20'),
  
  body('phone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone inválido'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio deve ter no máximo 500 caracteres'),
  
  handleValidationErrors
];

// Validações para criação de grupo
const validateGroupCreation = [
  body('subject')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Matéria deve ter entre 2 e 100 caracteres'),
  
  body('objective')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Objetivo deve ter entre 10 e 500 caracteres'),
  
  body('location')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Local deve ter entre 2 e 200 caracteres'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  
  body('maxMembers')
    .isInt({ min: 2, max: 50 })
    .withMessage('Número máximo de membros deve ser entre 2 e 50'),
  
  body('meetingTime')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Horário de encontro é obrigatório'),
  
  body('meetingDays')
    .isArray({ min: 1, max: 7 })
    .withMessage('Deve selecionar pelo menos 1 dia da semana')
    .custom((days) => {
      const validDays = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
      const invalidDays = days.filter(day => !validDays.includes(day.toLowerCase()));
      if (invalidDays.length > 0) {
        throw new Error('Dias inválidos: ' + invalidDays.join(', '));
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validações para parâmetros de ID
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  
  handleValidationErrors
];

// Validações para busca de grupos
const validateGroupSearch = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),
  
  query('subject')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Matéria deve ter entre 1 e 100 caracteres'),
  
  query('location')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Local deve ter entre 1 e 200 caracteres'),
  
  query('objective')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Objetivo deve ter entre 1 e 500 caracteres'),
  
  query('course')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Curso deve ter entre 1 e 100 caracteres'),
  
  handleValidationErrors
];

// Validações para recuperação de senha
const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  handleValidationErrors
];

// Validações para redefinição de senha
const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Token é obrigatório'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validateGroupCreation,
  validateId,
  validateGroupSearch,
  validateForgotPassword,
  validateResetPassword
};
