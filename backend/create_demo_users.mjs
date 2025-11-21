import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createDemoUsers() {
  try {
    console.log('🔍 Creating demo users for login page...\n');
    
    // Check if users already exist
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@test.com' }
    });
    
    const existingCompanyAdmin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    });
    
    // Create Super Admin Company if needed
    if (!existingSuperAdmin) {
      const superAdminCompany = await prisma.company.create({
        data: {
          name: 'Super Admin Company',
          email: 'superadmin@company.com',
          phone: '9999999999',
          address: '123 Super Admin Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postalCode: '400001',
          baseCurrency: 'INR',
          fiscalYearStart: new Date('2025-04-01'),
          fiscalYearEnd: new Date('2026-03-31')
        }
      });
      
      const hashedPassword = await bcrypt.hash('Test@123456', 12);
      
      const superAdmin = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'superadmin@test.com',
          password: hashedPassword,
          role: 'SUPERADMIN',
          companyId: superAdminCompany.id,
          status: 'ACTIVE'
        }
      });
      
      console.log('✅ Super Admin created:');
      console.log('   Email: superadmin@test.com');
      console.log('   Password: Test@123456');
      console.log('   ID:', superAdmin.id);
      console.log('   Company:', superAdminCompany.name, '\n');
    } else {
      console.log('⚠️  Super Admin already exists\n');
    }
    
    // Create Company Admin if needed
    if (!existingCompanyAdmin) {
      const companyAdminCompany = await prisma.company.create({
        data: {
          name: 'Demo Company',
          email: 'demo@company.com',
          phone: '8888888888',
          address: '456 Demo Street',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          postalCode: '110001',
          baseCurrency: 'INR',
          fiscalYearStart: new Date('2025-04-01'),
          fiscalYearEnd: new Date('2026-03-31')
        }
      });
      
      const hashedPassword = await bcrypt.hash('Test@123456', 12);
      
      const companyAdmin = await prisma.user.create({
        data: {
          name: 'Company Admin',
          email: 'admin@test.com',
          password: hashedPassword,
          role: 'COMPANY_ADMIN',
          companyId: companyAdminCompany.id,
          status: 'ACTIVE'
        }
      });
      
      console.log('✅ Company Admin created:');
      console.log('   Email: admin@test.com');
      console.log('   Password: Test@123456');
      console.log('   ID:', companyAdmin.id);
      console.log('   Company:', companyAdminCompany.name, '\n');
    } else {
      console.log('⚠️  Company Admin already exists\n');
    }
    
    console.log('✅ Demo users setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers();
