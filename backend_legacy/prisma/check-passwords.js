const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkPasswords() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        role: true
      }
    });

    console.log('=== USUÁRIOS E SENHAS ===');
    for (const user of users) {
      console.log(`\nID: ${user.id}`);
      console.log(`Nome: ${user.firstName} ${user.lastName}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      
      // Vamos testar algumas senhas comuns
      const commonPasswords = ['123456', 'password', 'teste', 'admin', '12345678'];
      
      for (const testPassword of commonPasswords) {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        if (isMatch) {
          console.log(`✅ Senha encontrada: ${testPassword}`);
          break;
        }
      }
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswords();