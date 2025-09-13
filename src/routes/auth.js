const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validateForgotPassword,
  validateResetPassword
} = require('../middleware/validation');

const router = express.Router();

// Configuração do multer para upload de avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const avatarPath = path.join(uploadPath, 'avatars');
    
    // Criar diretório se não existir
    if (!fs.existsSync(avatarPath)) {
      fs.mkdirSync(avatarPath, { recursive: true });
    }
    
    cb(null, avatarPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas (JPG, PNG, GIF)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  }
});

// Middleware para processar imagem do avatar
const processAvatar = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(path.extname(inputPath), '.webp');
    
    // Redimensionar e otimizar imagem
    await sharp(inputPath)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Remover arquivo original
    fs.unlinkSync(inputPath);
    
    // Atualizar caminho do arquivo
    req.file.path = outputPath;
    req.file.filename = path.basename(outputPath);
    
    next();
  } catch (error) {
    console.error('Erro ao processar avatar:', error);
    // Remover arquivo se houver erro
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      error: 'Erro ao processar imagem',
      message: 'Não foi possível processar a imagem do avatar'
    });
  }
};

// Rotas públicas
router.post('/register', validateUserRegistration, AuthController.register);
router.post('/login', validateUserLogin, AuthController.login);
router.post('/forgot-password', validateForgotPassword, AuthController.forgotPassword);
router.post('/reset-password', validateResetPassword, AuthController.resetPassword);
router.get('/check-email', AuthController.checkEmailAvailability);
router.post('/validate-password', AuthController.validatePassword);

// Rotas protegidas
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, validateProfileUpdate, AuthController.updateProfile);
router.put('/password', authenticateToken, AuthController.updatePassword);

// Upload de avatar
router.post('/avatar', 
  authenticateToken,
  upload.single('avatar'),
  processAvatar,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Arquivo não fornecido',
          message: 'Selecione uma imagem para o avatar'
        });
      }

      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      
      // Remover avatar anterior se existir
      if (user.avatar) {
        const oldAvatarPath = path.join(process.env.UPLOAD_PATH || './uploads', 'avatars', path.basename(user.avatar));
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Atualizar caminho do avatar no banco
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await user.update({ avatar: avatarUrl });

      res.json({
        message: 'Avatar atualizado com sucesso',
        data: {
          avatar: avatarUrl
        }
      });
    } catch (error) {
      // Remover arquivo se houver erro
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      console.error('Erro ao atualizar avatar:', error);
      res.status(500).json({
        error: 'Erro ao atualizar avatar',
        message: 'Não foi possível atualizar o avatar'
      });
    }
  }
);

// Remover avatar
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (user.avatar) {
      // Remover arquivo do servidor
      const avatarPath = path.join(process.env.UPLOAD_PATH || './uploads', 'avatars', path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
      
      // Remover referência no banco
      await user.update({ avatar: null });
    }

    res.json({
      message: 'Avatar removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover avatar:', error);
    res.status(500).json({
      error: 'Erro ao remover avatar',
      message: 'Não foi possível remover o avatar'
    });
  }
});

module.exports = router;
