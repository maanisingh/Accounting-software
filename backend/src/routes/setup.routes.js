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
    console.log('Running database seed script...');

    const { stdout, stderr } = await execAsync('node prisma/seed.js', {
      cwd: '/app'
    });

    console.log('Seed output:', stdout);
    if (stderr) console.error('Seed errors:', stderr);

    res.json({
      success: true,
      message: 'Database seeded successfully',
      output: stdout
    });
  } catch (error) {
    console.error('Seed failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database seeding failed',
      error: error.message
    });
  }
});

export default router;
