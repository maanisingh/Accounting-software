const express = require('express');
const router = express.Router();
const { getAdminDashboard, getCompanyDashboard } = require('../../controllers/dashboardController');
const { authenticate } = require('../../middleware/auth.middleware');

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

module.exports = router;
