const crypto = require('crypto');

// Gerar JWT secret seguro
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('🔑 JWT Secret gerado:');
console.log('='.repeat(80));
console.log(jwtSecret);
console.log('='.repeat(80));
console.log('\n📝 Copie este valor para o arquivo .env:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('\n⚠️  IMPORTANTE:');
console.log('- Mantenha este secret seguro e nunca compartilhe');
console.log('- Use um secret diferente para produção');
console.log('- Nunca commite o .env no Git');
