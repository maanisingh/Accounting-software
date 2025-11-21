const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createLiveUser() {
  try {
    console.log('Creating live test user...');
    
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
    console.log('📧 Email:', user.email);
    console.log('🔑 Password: LiveAdmin123!');
    console.log('');
    console.log('✅ You can now login with these credentials on the live site!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createLiveUser();
