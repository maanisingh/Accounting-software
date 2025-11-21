import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixPassword() {
  try {
    const hashedPassword = await bcrypt.hash('Test@123456', 12);
    
    const user = await prisma.user.update({
      where: { email: 'admin@test.com' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Company Admin password updated!');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: Test@123456');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPassword();
