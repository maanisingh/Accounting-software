import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

/**
 * One-time setup endpoint to seed the database
 * Should only be called once on initial deployment
 */
router.post('/seed-database', async (req, res) => {
  try {
    console.log('🌱 Running database seed script...');

    // Use current working directory or backend directory
    const cwd = process.cwd();
    console.log(`Working directory: ${cwd}`);

    const { stdout, stderr } = await execAsync('npx prisma db seed', {
      cwd,
      env: { ...process.env }
    });

    console.log('✅ Seed output:', stdout);
    if (stderr) console.warn('Seed warnings:', stderr);

    res.json({
      success: true,
      message: 'Database seeded successfully',
      output: stdout,
      cwd
    });
  } catch (error) {
    console.error('❌ Seed failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database seeding failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get('/seed-status', async (req, res) => {
  try {
    // Check if database is seeded by counting users
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();

    await prisma.$disconnect();

    const isSeeded = userCount >= 9;

    res.json({
      success: true,
      isSeeded,
      counts: {
        users: userCount,
        companies: companyCount
      },
      expected: {
        users: 10,
        companies: 4
      },
      message: isSeeded ? 'Database is seeded' : 'Database needs seeding'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check seed status',
      error: error.message
    });
  }
});

export default router;
