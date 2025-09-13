const { initializeDatabase, getDatabase, closeDatabase } = require('../src/config/database');
const User = require('../src/models/User');
const Group = require('../src/models/Group');
const Message = require('../src/models/Message');
const Notification = require('../src/models/Notification');

async function testDatabaseConnection() {
  try {
    console.log('🧪 Testando conexão com banco de dados...');
    
    // Inicializar banco
    await initializeDatabase();
    console.log('✅ Banco inicializado com sucesso');
    
    // Testar operações básicas
    const db = getDatabase();
    
    // Testar contagem de usuários
    const userCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    console.log(`👥 Usuários no banco: ${userCount}`);
    
    // Testar contagem de grupos
    const groupCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM groups', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    console.log(`📚 Grupos no banco: ${groupCount}`);
    
    // Testar contagem de mensagens
    const messageCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM messages', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    console.log(`💬 Mensagens no banco: ${messageCount}`);
    
    // Testar contagem de notificações
    const notificationCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM notifications', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    console.log(`🔔 Notificações no banco: ${notificationCount}`);
    
    // Testar busca de usuário
    if (userCount > 0) {
      const firstUser = await User.findById(1);
      if (firstUser) {
        console.log(`👤 Primeiro usuário: ${firstUser.name} (${firstUser.email})`);
      }
    }
    
    // Testar busca de grupo
    if (groupCount > 0) {
      const firstGroup = await Group.findById(1);
      if (firstGroup) {
        console.log(`📖 Primeiro grupo: ${firstGroup.subject}`);
      }
    }
    
    console.log('\n🎉 Todos os testes passaram com sucesso!');
    console.log('✅ Banco de dados está funcionando corretamente');
    
    await closeDatabase();
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testDatabaseConnection();
}

module.exports = { testDatabaseConnection };
