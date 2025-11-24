import express from 'express';
import { getAdminDashboard, getCompanyDashboard } from '../../controllers/dashboardController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

/**
 * Dashboard Routes
 *
 * GET /api/v1/dashboard/admin - Admin dashboard stats (SUPERADMIN only)
 * GET /api/v1/dashboard/company - Company dashboard stats (company users)
 */

// Admin dashboard (SUPERADMIN only)
router.get('/admin', authenticate, getAdminDashboard);

// Company dashboard (for company users)
router.get('/company', authenticate, getCompanyDashboard);

export default router;
