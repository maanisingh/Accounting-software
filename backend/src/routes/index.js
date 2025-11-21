/**
 * Routes Index
 * Aggregates all route modules
 */

import express from 'express';
import authRoutes from './v1/auth.route.js';
import userRoutes from './v1/user.route.js';
import vendorRoutes from './v1/vendorRoutes.js';
import customerRoutes from './v1/customerRoutes.js';
import inventoryRoutes from './v1/inventoryRoutes.js';
import purchaseRoutes from './v1/purchaseRoutes.js';
import salesRoutes from './v1/salesRoutes.js';
import accountsRoutes from './v1/accountsRoutes.js';
import reportsRoutes from './v1/reportsRoutes.js';
import uomRoutes from './v1/uomRoutes.js';
import taxClassRoutes from './v1/taxClassRoutes.js';
import serviceRoutes from './v1/serviceRoutes.js';
import userRoleRoutes from './v1/userRoleRoutes.js';
import voucherRoutes from './v1/voucherRoutes.js';
import invoiceRoutes from './v1/invoiceRoutes.js';

const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ZirakBook API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * API v1 routes
 */
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/vendors', vendorRoutes);
router.use('/v1/customers', customerRoutes);
router.use('/v1', inventoryRoutes);
router.use('/v1', purchaseRoutes);
router.use('/v1', salesRoutes);
router.use('/v1', accountsRoutes);
router.use('/v1/reports', reportsRoutes);
router.use('/v1/uoms', uomRoutes);
router.use('/v1/tax-classes', taxClassRoutes);
router.use('/v1/services', serviceRoutes);
router.use('/v1/user-roles', userRoleRoutes);
router.use('/v1/roles', userRoleRoutes); // Alias for user-roles
router.use('/v1/vouchers', voucherRoutes);
router.use('/v1/income-vouchers', voucherRoutes);
router.use('/v1/contra-vouchers', voucherRoutes);
router.use('/v1/pos-invoices', voucherRoutes);
router.use('/v1', invoiceRoutes);

/**
 * API info endpoint
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ZirakBook Accounting System API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      vendors: '/api/v1/vendors',
      customers: '/api/v1/customers',
      inventory: {
        products: '/api/v1/products',
        brands: '/api/v1/brands',
        categories: '/api/v1/categories',
        warehouses: '/api/v1/warehouses',
        stock: '/api/v1/stock',
        movements: '/api/v1/movements'
      },
      purchases: {
        quotations: '/api/v1/purchase-quotations',
        orders: '/api/v1/purchase-orders',
        receipts: '/api/v1/goods-receipts',
        bills: '/api/v1/bills',
        returns: '/api/v1/purchase-returns'
      },
      sales: {
        quotations: '/api/v1/sales-quotations',
        orders: '/api/v1/sales-orders',
        challans: '/api/v1/delivery-challans',
        returns: '/api/v1/sales-returns'
      },
      accounts: {
        accounts: '/api/v1/accounts',
        journalEntries: '/api/v1/journal-entries',
        payments: '/api/v1/payments',
        receipts: '/api/v1/receipts'
      },
      reports: {
        financial: '/api/v1/reports/balance-sheet',
        sales: '/api/v1/reports/sales-summary',
        purchases: '/api/v1/reports/purchases-summary',
        inventory: '/api/v1/reports/inventory-summary',
        tax: '/api/v1/reports/tax-summary'
      }
    }
  });
});

export default router;
