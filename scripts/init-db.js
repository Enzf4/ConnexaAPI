const { initializeDatabase, closeDatabase } = require('../src/config/database');
const User = require('../src/models/User');
const Group = require('../src/models/Group');
const bcrypt = require('bcryptjs');

async function initializeDatabaseWithSampleData() {
  try {
    console.log('🚀 Inicializando banco de dados...');
    
    // Inicializar banco de dados
    await initializeDatabase();
    console.log('✅ Banco de dados inicializado');

    // Verificar se já existem dados
    const existingUsers = await User.findById(1);
    if (existingUsers) {
      console.log('ℹ️  Banco de dados já possui dados. Pulando criação de dados de exemplo.');
      await closeDatabase();
      return;
    }

    console.log('📝 Criando dados de exemplo...');

    // Criar usuários de exemplo
    const users = [
      {
        name: 'João Silva',
        email: 'joao.silva@gmail.com',
        password: await bcrypt.hash('Senha123!', 12),
        course: 'Ciência da Computação',
        semester: 5,
        phone: '(83) 99999-9999',
        bio: 'Estudante de Ciência da Computação apaixonado por programação e algoritmos.',
        avatar: null
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@estudante.ufpb.br',
        password: await bcrypt.hash('Senha123!', 12),
        course: 'Engenharia de Software',
        semester: 3,
        phone: '(83) 88888-8888',
        bio: 'Estudante de Engenharia de Software interessada em desenvolvimento web.',
        avatar: null
      },
      {
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@ufpb.br',
        password: await bcrypt.hash('Senha123!', 12),
        course: 'Sistemas de Informação',
        semester: 7,
        phone: '(83) 77777-7777',
        bio: 'Estudante de Sistemas de Informação com foco em banco de dados.',
        avatar: null
      },
      {
        name: 'Ana Costa',
        email: 'ana.costa@gmail.com',
        password: await bcrypt.hash('Senha123!', 12),
        course: 'Ciência da Computação',
        semester: 2,
        phone: '(83) 66666-6666',
        bio: 'Estudante iniciante em Ciência da Computação.',
        avatar: null
      },
      {
        name: 'Carlos Ferreira',
        email: 'carlos.ferreira@outlook.com',
        password: await bcrypt.hash('Senha123!', 12),
        course: 'Engenharia de Software',
        semester: 6,
        phone: '(83) 55555-5555',
        bio: 'Estudante de Engenharia de Software com experiência em mobile.',
        avatar: null
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const userId = await User.create(userData);
      const user = await User.findById(userId);
      createdUsers.push(user);
      console.log(`✅ Usuário criado: ${user.name} (ID: ${user.id})`);
    }

    // Criar grupos de exemplo
    const groups = [
      {
        subject: 'Algoritmos e Estruturas de Dados',
        objective: 'Estudar algoritmos de ordenação e estruturas de dados fundamentais',
        location: 'Biblioteca Central - Sala 201',
        description: 'Grupo focado em algoritmos de ordenação (bubble sort, quick sort, merge sort) e estruturas de dados como listas, pilhas e filas.',
        maxMembers: 8,
        meetingTime: '19:00',
        meetingDays: ['segunda', 'quarta', 'sexta'],
        ownerId: createdUsers[0].id
      },
      {
        subject: 'Desenvolvimento Web',
        objective: 'Aprender tecnologias web modernas (React, Node.js, MongoDB)',
        location: 'Laboratório de Informática - Sala 105',
        description: 'Grupo para estudar desenvolvimento web full-stack com foco em React para frontend e Node.js para backend.',
        maxMembers: 6,
        meetingTime: '14:00',
        meetingDays: ['terça', 'quinta'],
        ownerId: createdUsers[1].id
      },
      {
        subject: 'Banco de Dados',
        objective: 'Dominar SQL e modelagem de dados',
        location: 'Sala de Estudos - Bloco A',
        description: 'Estudo de SQL avançado, normalização de bancos de dados e modelagem conceitual.',
        maxMembers: 5,
        meetingTime: '16:00',
        meetingDays: ['segunda', 'quarta'],
        ownerId: createdUsers[2].id
      },
      {
        subject: 'Programação Orientada a Objetos',
        objective: 'Aprender conceitos de OOP com Java',
        location: 'Laboratório de Programação',
        description: 'Estudo de conceitos fundamentais de OOP: herança, polimorfismo, encapsulamento e abstração.',
        maxMembers: 7,
        meetingTime: '18:00',
        meetingDays: ['terça', 'quinta', 'sábado'],
        ownerId: createdUsers[3].id
      },
      {
        subject: 'Desenvolvimento Mobile',
        objective: 'Desenvolver apps para Android e iOS',
        location: 'Sala de Estudos - Bloco B',
        description: 'Estudo de desenvolvimento mobile nativo e híbrido com React Native e Flutter.',
        maxMembers: 4,
        meetingTime: '20:00',
        meetingDays: ['segunda', 'quarta', 'sexta'],
        ownerId: createdUsers[4].id
      }
    ];

    const createdGroups = [];
    for (const groupData of groups) {
      const groupId = await Group.create(groupData);
      
      // Adicionar criador como membro
      await Group.addMember(groupId, groupData.ownerId);
      
      // Adicionar alguns membros aleatórios
      const randomMembers = createdUsers
        .filter(user => user.id !== groupData.ownerId)
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1); // 1-3 membros aleatórios

      for (const member of randomMembers) {
        await Group.addMember(groupId, member.id);
      }

      const group = await Group.findById(groupId);
      createdGroups.push(group);
      console.log(`✅ Grupo criado: ${group.subject} (ID: ${group.id})`);
    }

    console.log('\n🎉 Dados de exemplo criados com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`👥 Usuários: ${createdUsers.length}`);
    console.log(`📚 Grupos: ${createdGroups.length}`);
    
    console.log('\n🔑 Credenciais de teste:');
    console.log('Email: joao.silva@gmail.com | Senha: Senha123!');
    console.log('Email: maria.santos@estudante.ufpb.br | Senha: Senha123!');
    console.log('Email: pedro.oliveira@ufpb.br | Senha: Senha123!');
    console.log('Email: ana.costa@gmail.com | Senha: Senha123!');
    console.log('Email: carlos.ferreira@outlook.com | Senha: Senha123!');

    await closeDatabase();
    console.log('\n✅ Script concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeDatabaseWithSampleData();
}

module.exports = { initializeDatabaseWithSampleData };
