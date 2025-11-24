/**
 * Quick script to check Railway database status
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('\n🔍 Checking Railway Database Status...\n');

    // Check users
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        name: true
      }
    });

    console.log(`👥 Users: ${userCount}`);
    if (users.length > 0) {
      console.log('\nExisting users:');
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.role}) - ${u.status}`);
      });
    } else {
      console.log('⚠️  NO USERS FOUND - Database needs seeding!');
    }

    // Check companies
    const companyCount = await prisma.company.count();
    console.log(`\n🏢 Companies: ${companyCount}`);

    // Check accounts
    const accountCount = await prisma.account.count();
    console.log(`📊 Accounts: ${accountCount}`);

    if (userCount === 0) {
      console.log('\n❌ DATABASE IS EMPTY - Run seed script to create admin user!');
      console.log('   Email: admin@zirakbook.com');
      console.log('   Password: Admin123!');
    } else {
      console.log('\n✅ Database has data!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
