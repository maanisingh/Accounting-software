/**
 * Legacy Routes - Backward Compatibility
 * Routes for maintaining compatibility with existing frontend code
 */

import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as customerController from '../../controllers/customerController.js';
import * as salesReturnController from '../../controllers/salesReturnController.js';
import * as salesReportController from '../../controllers/salesReportController.js';
import * as purchaseReportController from '../../controllers/purchaseReportController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/vendorCustomer/company/:id
 * @desc    Get customers or vendors by company ID (legacy endpoint)
 * @access  Private
 * @note    This is an alias for /api/v1/customers - used by Sales Return page
 */
router.get('/vendorCustomer/company/:id', async (req, res, next) => {
  const { type } = req.query;

  // For now, we only handle customers
  // This endpoint is called with ?type=customer from the frontend
  if (type === 'customer') {
    // Forward to customer controller
    req.query.companyId = req.params.id;
    return customerController.getCustomers(req, res, next);
  }

  // Could add vendor support here if needed
  res.status(400).json({
    success: false,
    message: 'Invalid type parameter. Expected: customer'
  });
});

/**
 * @route   GET /api/v1/sales-return/get-returns
 * @desc    Get all sales returns (legacy endpoint)
 * @access  Private
 * @note    This is an alias for /api/v1/sales-returns - used by Sales Return page
 */
router.get('/sales-return/get-returns', async (req, res, next) => {
  // Map company_id query param to the standard filter format
  if (req.query.company_id) {
    req.query.companyId = req.query.company_id;
    delete req.query.company_id;
  }

  // Forward to sales return controller
  return salesReturnController.getSalesReturns(req, res, next);
});

/**
 * @route   GET /api/v1/sales-reports/summary
 * @desc    Get sales summary report (legacy endpoint)
 * @access  Private
 * @note    This is an alias for /api/v1/reports/sales-summary
 */
router.get('/sales-reports/summary', async (req, res, next) => {
  // Map companyId query param if needed
  return salesReportController.getSalesSummary(req, res, next);
});

/**
 * @route   GET /api/v1/sales-reports/detailed
 * @desc    Get detailed sales report (legacy endpoint)
 * @access  Private
 * @note    This is an alias for /api/v1/reports/sales-detailed
 */
router.get('/sales-reports/detailed', async (req, res, next) => {
  // Map companyId query param if needed
  return salesReportController.getDetailedSales(req, res, next);
});

/**
 * @route   GET /api/v1/purchase-reports/summary
 * @desc    Get purchase summary report (legacy endpoint)
 * @access  Private
 * @note    This is an alias for /api/v1/reports/purchases-summary
 */
router.get('/purchase-reports/summary', async (req, res, next) => {
  // Map companyId query param if needed
  return purchaseReportController.getPurchasesSummary(req, res, next);
});

/**
 * @route   GET /api/v1/purchase-reports/detailed
 * @desc    Get detailed purchase report (legacy endpoint)
 * @access  Private
 * @note    This is an alias for /api/v1/reports/purchases-detailed
 */
router.get('/purchase-reports/detailed', async (req, res, next) => {
  // Map companyId query param if needed
  return purchaseReportController.getDetailedPurchases(req, res, next);
});

export default router;
