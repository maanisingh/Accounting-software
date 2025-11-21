/**
 * ZirakBook Test Data Seeder
 * Creates test company and admin user for API testing
 */

import prisma from './src/config/database.js';
import bcrypt from 'bcryptjs';

const seedData = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ZirakBook Test Data Seeder                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Check if test data already exists
    const existingCompany = await prisma.company.findFirst({
      where: { email: 'admin@test.com' }
    });

    if (existingCompany) {
      console.log('⚠️  Test data already exists!');
      console.log('\nExisting Company:');
      console.log(`  Name: ${existingCompany.name}`);
      console.log(`  ID: ${existingCompany.id}`);
      console.log(`  Email: ${existingCompany.email}`);

      const existingUser = await prisma.user.findFirst({
        where: { companyId: existingCompany.id, email: 'admin@test.com' }
      });

      if (existingUser) {
        console.log('\nExisting User:');
        console.log(`  Name: ${existingUser.name}`);
        console.log(`  Email: ${existingUser.email}`);
        console.log(`  Role: ${existingUser.role}`);
        console.log(`  ID: ${existingUser.id}`);
      }

      console.log('\n✅ You can use these credentials to login:');
      console.log('   Email: admin@test.com');
      console.log('   Password: Admin@123');
      console.log('');

      process.exit(0);
    }

    // Create test company
    console.log('📦 Creating test company...');
    const company = await prisma.company.create({
      data: {
        name: 'Test Company Ltd',
        email: 'admin@test.com',
        phone: '9876543210',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        postalCode: '123456',
        taxNumber: '27AABCT1234F1Z5',
        fiscalYearStart: new Date('2025-01-01'),
        fiscalYearEnd: new Date('2025-12-31'),
        baseCurrency: 'INR',
        isActive: true
      }
    });

    console.log('✅ Company created successfully!');
    console.log(`   Name: ${company.name}`);
    console.log(`   ID: ${company.id}`);
    console.log(`   Email: ${company.email}`);

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Create admin user
    console.log('\n👤 Creating admin user...');
    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Test Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'SUPERADMIN',
        status: 'ACTIVE',
        emailVerified: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);

    // Create default chart of accounts
    console.log('\n📊 Creating default chart of accounts...');
    const accounts = [
      // Assets
      { code: '1000', name: 'Cash', type: 'ASSET', description: 'Cash on hand' },
      { code: '1010', name: 'Bank Account', type: 'ASSET', description: 'Bank account balance' },
      { code: '1200', name: 'Accounts Receivable', type: 'ASSET', description: 'Customer receivables' },
      { code: '1300', name: 'Inventory', type: 'ASSET', description: 'Stock inventory' },

      // Liabilities
      { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', description: 'Vendor payables' },
      { code: '2100', name: 'Tax Payable', type: 'LIABILITY', description: 'Tax liabilities' },

      // Equity
      { code: '3000', name: 'Owner Equity', type: 'EQUITY', description: 'Owner equity' },
      { code: '3100', name: 'Retained Earnings', type: 'EQUITY', description: 'Retained earnings' },

      // Revenue
      { code: '4000', name: 'Sales Revenue', type: 'REVENUE', description: 'Revenue from sales' },
      { code: '4100', name: 'Service Revenue', type: 'REVENUE', description: 'Revenue from services' },

      // Expenses
      { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', description: 'Direct cost of goods' },
      { code: '5100', name: 'Operating Expenses', type: 'EXPENSE', description: 'Operating expenses' },
      { code: '5200', name: 'Salary Expense', type: 'EXPENSE', description: 'Employee salaries' },
      { code: '5300', name: 'Rent Expense', type: 'EXPENSE', description: 'Office rent' },
      { code: '5400', name: 'Utility Expense', type: 'EXPENSE', description: 'Utility bills' }
    ];

    for (const accountData of accounts) {
      await prisma.account.create({
        data: {
          ...accountData,
          companyId: company.id,
          createdBy: user.id,
          isActive: true
        }
      });
    }

    console.log(`✅ Created ${accounts.length} default accounts`);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ Test Data Created Successfully!                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🎯 Quick Start:');
    console.log('   1. Open Hoppscotch (https://hoppscotch.io)');
    console.log('   2. Import: ZirakBook_Hoppscotch_Collection.json');
    console.log('   3. Login with:');
    console.log('      Email: admin@test.com');
    console.log('      Password: Admin@123');
    console.log('   4. Copy the token and set it in environment variables');
    console.log('   5. Start testing the APIs!\n');

    console.log('📋 Important IDs (save these in Hoppscotch environment):');
    console.log(`   companyId: ${company.id}`);
    console.log(`   userId: ${user.id}\n`);

  } catch (error) {
    console.error('\n❌ Error seeding data:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the seeder
seedData();
