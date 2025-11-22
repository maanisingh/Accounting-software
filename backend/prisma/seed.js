/**
 * ZirakBook Railway Database Seeder
 * Creates initial admin user and company for production deployment
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const seed = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ZirakBook Production Database Seeder                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Check if admin already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: 'admin@zirakbook.com' }
    });

    if (existingUser) {
      console.log('⚠️  Admin user already exists!');
      console.log('\n✅ Login Credentials:');
      console.log('   Email: admin@zirakbook.com');
      console.log('   Password: Admin123!');
      console.log('');
      await prisma.$disconnect();
      return;
    }

    // Create company
    console.log('📦 Creating company...');
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

    console.log('✅ Company created:', company.name);

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    // Create admin user
    console.log('\n👤 Creating admin user...');
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

    console.log('✅ Admin user created!');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);

    // Create default chart of accounts
    console.log('\n📊 Creating chart of accounts...');
    const accounts = [
      { code: '1000', name: 'Cash', type: 'ASSET', description: 'Cash on hand', companyId: company.id },
      { code: '1010', name: 'Bank Account', type: 'ASSET', description: 'Bank account balance', companyId: company.id },
      { code: '1200', name: 'Accounts Receivable', type: 'ASSET', description: 'Money owed by customers', companyId: company.id },
      { code: '1500', name: 'Inventory', type: 'ASSET', description: 'Products in stock', companyId: company.id },
      { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', description: 'Money owed to suppliers', companyId: company.id },
      { code: '3000', name: 'Owner Equity', type: 'EQUITY', description: 'Owner investment', companyId: company.id },
      { code: '4000', name: 'Sales Revenue', type: 'REVENUE', description: 'Revenue from sales', companyId: company.id },
      { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', description: 'Direct costs of products sold', companyId: company.id },
      { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', description: 'Business operating costs', companyId: company.id },
    ];

    await prisma.account.createMany({
      data: accounts
    });

    console.log(`✅ Created ${accounts.length} default accounts`);

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
