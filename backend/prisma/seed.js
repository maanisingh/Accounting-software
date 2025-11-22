/**
 * ZirakBook Railway Database Seeder
 * Creates initial admin user and company for production deployment
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const seed = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ZirakBook Production Database Seeder                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    let company;
    let user;

    // Check if admin already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: 'admin@zirakbook.com' }
    });

    if (existingUser) {
      console.log('⚠️  Admin user already exists!');
      user = existingUser;
      company = await prisma.company.findUnique({
        where: { id: existingUser.companyId }
      });
    } else {

      // Create company
      console.log('📦 Creating company...');
      company = await prisma.company.create({
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

      console.log('✅ Company created:', company.name);

      // Hash password
      const hashedPassword = await bcrypt.hash('Admin123!', 10);

      // Create admin user
      console.log('\n👤 Creating admin user...');
      user = await prisma.user.create({
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

      console.log('✅ Admin user created!');
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
    }

    // Create default chart of accounts (check if already exist)
    console.log('\n📊 Creating chart of accounts...');
    const existingAccounts = await prisma.account.count({
      where: { companyId: company.id }
    });

    if (existingAccounts > 0) {
      console.log(`⚠️  Chart of accounts already exists (${existingAccounts} accounts)`);
    } else {
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

      await prisma.account.createMany({
        data: accounts
      });

      console.log(`✅ Created ${accounts.length} default accounts`);
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ Database Seeding Completed Successfully!               ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║                                                            ║');
    console.log('║  Login Credentials:                                        ║');
    console.log('║  Email: admin@zirakbook.com                                ║');
    console.log('║  Password: Admin123!                                       ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
