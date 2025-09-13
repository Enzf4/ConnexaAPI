// Middleware de tratamento de erros
const errorHandler = (err, req, res, next) => {
  console.error('Erro capturado:', err);

  // Erro de validação do banco de dados
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      error: 'Recurso já existe',
      message: 'Este recurso já está em uso'
    });
  }

  // Erro de chave estrangeira
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({
      error: 'Referência inválida',
      message: 'Recurso referenciado não existe'
    });
  }

  // Erro de arquivo não encontrado
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: 'Arquivo não encontrado',
      message: 'O arquivo solicitado não existe'
    });
  }

  // Erro de limite de tamanho de arquivo
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Arquivo muito grande',
      message: 'O arquivo excede o tamanho máximo permitido'
    });
  }

  // Erro de tipo de arquivo não permitido
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Tipo de arquivo não permitido',
      message: 'Apenas imagens são permitidas'
    });
  }

  // Erro de email
  if (err.code === 'ECONNREFUSED' && err.syscall === 'connect') {
    return res.status(503).json({
      error: 'Serviço indisponível',
      message: 'Serviço de email temporariamente indisponível'
    });
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'Token de autenticação inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      message: 'Token de autenticação expirado'
    });
  }

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      message: err.message
    });
  }

  // Erro de cast (conversão de tipo)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Formato inválido',
      message: 'Formato de dados inválido'
    });
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido',
      message: 'Formato JSON inválido'
    });
  }

  // Erro de multer
  if (err.code === 'MULTER_ERROR') {
    return res.status(400).json({
      error: 'Erro no upload',
      message: 'Erro ao processar arquivo enviado'
    });
  }

  // Erro padrão do servidor
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : err.message;

  res.status(statusCode).json({
    error: 'Erro interno do servidor',
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// Middleware para capturar rotas não encontradas
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `Rota ${req.method} ${req.originalUrl} não existe`
  });
};

// Middleware para capturar erros assíncronos
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
