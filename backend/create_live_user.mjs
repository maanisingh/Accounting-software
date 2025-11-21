import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createLiveUser() {
  try {
    console.log('🔍 Checking for existing user...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'liveadmin@zirakbook.com' }
    });
    
    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log('📧 Email: liveadmin@zirakbook.com');
      console.log('🔑 Password: LiveAdmin123!');
      return;
    }
    
    console.log('✨ Creating new company and user...');
    
    // Create company first
    const company = await prisma.company.create({
      data: {
        name: 'Live Test Company',
        email: 'company@zirakbook.com',
        phone: '1234567890',
        address: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400001',
        baseCurrency: 'INR',
        fiscalYearStart: new Date('2025-04-01'),
        fiscalYearEnd: new Date('2026-03-31')
      }
    });
    
    console.log('✅ Company created:', company.id);
    
    // Hash password
    const hashedPassword = await bcrypt.hash('LiveAdmin123!', 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name: 'Live Test Admin',
        email: 'liveadmin@zirakbook.com',
        password: hashedPassword,
        role: 'SUPERADMIN',
        companyId: company.id,
        status: 'ACTIVE'
      }
    });
    
    console.log('✅ User created:', user.id);
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  LIVE CREDENTIALS CREATED SUCCESSFULLY   ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log('🌐 URL: https://zirakbook.alexandratechlab.com');
    console.log('📧 Email: liveadmin@zirakbook.com');
    console.log('🔑 Password: LiveAdmin123!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createLiveUser();
