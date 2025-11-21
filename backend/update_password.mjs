import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    // Update password to simpler one without special chars
    const hashedPassword = await bcrypt.hash('Admin123', 12);
    
    const user = await prisma.user.update({
      where: { email: 'liveadmin@zirakbook.com' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Password updated successfully!');
    console.log('📧 Email: liveadmin@zirakbook.com');
    console.log('🔑 Password: Admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();
