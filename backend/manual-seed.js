/**
 * Manual seed script for Railway - Run this if automatic seeding fails
 * Usage: node manual-seed.js
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function manualSeed() {
  console.log('\n🔧 MANUAL SEED SCRIPT FOR RAILWAY\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected\n');

    // Check current state
    console.log('2. Checking current database state...');
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();
    console.log(`   Users: ${userCount}`);
    console.log(`   Companies: ${companyCount}\n`);

    if (userCount > 0) {
      console.log('⚠️  Users already exist!');
      const users = await prisma.user.findMany({
        select: { email: true, role: true, status: true }
      });
      console.log('\nExisting users:');
      users.forEach(u => console.log(`   - ${u.email} (${u.role})`));

      console.log('\n✅ Database already seeded. Exiting.');
      process.exit(0);
    }

    // Create company
    console.log('3. Creating company...');
    const company = await prisma.company.create({
      data: {
        name: 'ZirakBook Company',
        email: 'admin@zirakbook.com',
        phone: '1234567890',
        address: '123 Main Street',
        city: 'Business City',
        state: 'State',
        country: 'USA',
        postalCode: '12345',
        taxNumber: 'TAX123456',
        fiscalYearStart: new Date('2025-01-01'),
        fiscalYearEnd: new Date('2025-12-31'),
        baseCurrency: 'USD',
        isActive: true
      }
    });
    console.log(`✅ Company created: ${company.name} (ID: ${company.id})\n`);

    // Create admin user
    console.log('4. Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Admin User',
        email: 'admin@zirakbook.com',
        password: hashedPassword,
        role: 'SUPERADMIN',
        status: 'ACTIVE',
        emailVerified: true
      }
    });
    console.log(`✅ Admin user created: ${user.email} (ID: ${user.id})\n`);

    // Create default accounts
    console.log('5. Creating chart of accounts...');
    const accounts = [
      { accountNumber: '1000', accountName: 'Cash', accountType: 'ASSET', description: 'Cash on hand', companyId: company.id },
      { accountNumber: '1010', accountName: 'Bank Account', accountType: 'ASSET', description: 'Bank account balance', companyId: company.id },
      { accountNumber: '1200', accountName: 'Accounts Receivable', accountType: 'ASSET', description: 'Money owed by customers', companyId: company.id },
      { accountNumber: '1500', accountName: 'Inventory', accountType: 'ASSET', description: 'Products in stock', companyId: company.id },
      { accountNumber: '2000', accountName: 'Accounts Payable', accountType: 'LIABILITY', description: 'Money owed to suppliers', companyId: company.id },
      { accountNumber: '3000', accountName: 'Owner Equity', accountType: 'EQUITY', description: 'Owner investment', companyId: company.id },
      { accountNumber: '4000', accountName: 'Sales Revenue', accountType: 'REVENUE', description: 'Revenue from sales', companyId: company.id },
      { accountNumber: '5000', accountName: 'Cost of Goods Sold', accountType: 'EXPENSE', description: 'Direct costs of products sold', companyId: company.id },
      { accountNumber: '6000', accountName: 'Operating Expenses', accountType: 'EXPENSE', description: 'Business operating costs', companyId: company.id },
    ];

    await prisma.account.createMany({ data: accounts });
    console.log(`✅ Created ${accounts.length} default accounts\n`);

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ MANUAL SEEDING COMPLETED SUCCESSFULLY!                 ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║                                                            ║');
    console.log('║  Login Credentials:                                        ║');
    console.log('║  Email: admin@zirakbook.com                                ║');
    console.log('║  Password: Admin123!                                       ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔧 Next steps:');
    console.log('   1. Trigger Railway backend redeploy (or wait for auto-deploy)');
    console.log('   2. Test login at: https://frontend-production-32b8.up.railway.app/login');
    console.log('   3. API endpoint: https://accounting-software-production.up.railway.app/api/v1/auth/login\n');

  } catch (error) {
    console.error('\n❌ MANUAL SEEDING FAILED:');
    console.error('Error:', error.message);
    console.error('\nFull error:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

manualSeed();
