/**
 * Reports Routes
 * All report endpoints - Financial, Sales, Purchase, Inventory, Tax
 */

import express from 'express';
import * as financialReportController from '../../controllers/financialReportController.js';
import * as salesReportController from '../../controllers/salesReportController.js';
import * as purchaseReportController from '../../controllers/purchaseReportController.js';
import * as inventoryReportController from '../../controllers/inventoryReportController.js';
import * as taxReportController from '../../controllers/taxReportController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// ==================== FINANCIAL REPORTS (15 endpoints) ====================

/**
 * @route GET /api/v1/reports/balance-sheet
 * @desc Get Balance Sheet report
 * @access Private
 */
router.get('/balance-sheet', financialReportController.getBalanceSheet);

/**
 * @route GET /api/v1/reports/profit-loss
 * @desc Get Profit & Loss Statement
 * @access Private
 */
router.get('/profit-loss', financialReportController.getProfitAndLoss);

/**
 * @route GET /api/v1/reports/cash-flow
 * @desc Get Cash Flow Statement
 * @access Private
 */
router.get('/cash-flow', financialReportController.getCashFlowStatement);

/**
 * @route GET /api/v1/reports/trial-balance
 * @desc Get Trial Balance
 * @access Private
 */
router.get('/trial-balance', financialReportController.getTrialBalance);

/**
 * @route GET /api/v1/reports/ledger/:accountId
 * @desc Get Account Ledger
 * @access Private
 */
router.get('/ledger/:accountId', financialReportController.getAccountLedger);

/**
 * @route GET /api/v1/reports/general-ledger
 * @desc Get General Ledger (all accounts)
 * @access Private
 */
router.get('/general-ledger', financialReportController.getGeneralLedger);

/**
 * @route GET /api/v1/reports/day-book
 * @desc Get Day Book (daily transactions)
 * @access Private
 */
router.get('/day-book', financialReportController.getDayBook);

/**
 * @route GET /api/v1/reports/bank-book
 * @desc Get Bank Book
 * @access Private
 */
router.get('/bank-book', financialReportController.getBankBook);

/**
 * @route GET /api/v1/reports/cash-book
 * @desc Get Cash Book
 * @access Private
 */
router.get('/cash-book', financialReportController.getCashBook);

/**
 * @route GET /api/v1/reports/receivables
 * @desc Get Accounts Receivable
 * @access Private
 */
router.get('/receivables', financialReportController.getAccountsReceivable);

/**
 * @route GET /api/v1/reports/payables
 * @desc Get Accounts Payable
 * @access Private
 */
router.get('/payables', financialReportController.getAccountsPayable);

/**
 * @route GET /api/v1/reports/aging-receivables
 * @desc Get Aging Receivables (aging buckets)
 * @access Private
 */
router.get('/aging-receivables', financialReportController.getAgingReceivables);

/**
 * @route GET /api/v1/reports/aging-payables
 * @desc Get Aging Payables (aging buckets)
 * @access Private
 */
router.get('/aging-payables', financialReportController.getAgingPayables);

/**
 * @route GET /api/v1/reports/journal-entries
 * @desc Get Journal Entries Report
 * @access Private
 */
router.get('/journal-entries', financialReportController.getJournalEntriesReport);

/**
 * @route GET /api/v1/reports/audit-trail
 * @desc Get Complete Audit Trail
 * @access Private
 */
router.get('/audit-trail', financialReportController.getAuditTrail);

// ==================== SALES REPORTS (8 endpoints) ====================

/**
 * @route GET /api/v1/reports/sales-summary
 * @desc Get Sales Summary
 * @access Private
 */
router.get('/sales-summary', salesReportController.getSalesSummary);

/**
 * @route GET /api/v1/reports/sales-detailed
 * @desc Get Detailed Sales Transactions
 * @access Private
 */
router.get('/sales-detailed', salesReportController.getDetailedSales);

/**
 * @route GET /api/v1/reports/sales-by-customer
 * @desc Get Sales by Customer
 * @access Private
 */
router.get('/sales-by-customer', salesReportController.getSalesByCustomer);

/**
 * @route GET /api/v1/reports/sales-by-product
 * @desc Get Sales by Product
 * @access Private
 */
router.get('/sales-by-product', salesReportController.getSalesByProduct);

/**
 * @route GET /api/v1/reports/sales-by-date
 * @desc Get Sales by Date Range
 * @access Private
 */
router.get('/sales-by-date', salesReportController.getSalesByDate);

/**
 * @route GET /api/v1/reports/sales-trends
 * @desc Get Sales Trend Analysis
 * @access Private
 */
router.get('/sales-trends', salesReportController.getSalesTrends);

/**
 * @route GET /api/v1/reports/sales-returns
 * @desc Get Sales Returns Report
 * @access Private
 */
router.get('/sales-returns', salesReportController.getSalesReturns);

/**
 * @route GET /api/v1/reports/sales-tax
 * @desc Get Sales Tax Report (GST/VAT)
 * @access Private
 */
router.get('/sales-tax', salesReportController.getSalesTax);

/**
 * @route GET /api/v1/reports/pos-summary
 * @desc Get POS Summary Report
 * @access Private
 */
router.get('/pos-summary', salesReportController.getPOSSummary);

// ==================== PURCHASE REPORTS (8 endpoints) ====================

/**
 * @route GET /api/v1/reports/purchases-summary
 * @desc Get Purchase Summary
 * @access Private
 */
router.get('/purchases-summary', purchaseReportController.getPurchasesSummary);

/**
 * @route GET /api/v1/reports/purchases-detailed
 * @desc Get Detailed Purchases
 * @access Private
 */
router.get('/purchases-detailed', purchaseReportController.getDetailedPurchases);

/**
 * @route GET /api/v1/reports/purchases-by-vendor
 * @desc Get Purchases by Vendor
 * @access Private
 */
router.get('/purchases-by-vendor', purchaseReportController.getPurchasesByVendor);

/**
 * @route GET /api/v1/reports/purchases-by-product
 * @desc Get Purchases by Product
 * @access Private
 */
router.get('/purchases-by-product', purchaseReportController.getPurchasesByProduct);

/**
 * @route GET /api/v1/reports/purchases-pending
 * @desc Get Pending Purchase Orders
 * @access Private
 */
router.get('/purchases-pending', purchaseReportController.getPendingPurchaseOrders);

/**
 * @route GET /api/v1/reports/purchases-returns
 * @desc Get Purchase Returns
 * @access Private
 */
router.get('/purchases-returns', purchaseReportController.getPurchaseReturns);

/**
 * @route GET /api/v1/reports/purchases-tax
 * @desc Get Purchase Tax Report
 * @access Private
 */
router.get('/purchases-tax', purchaseReportController.getPurchaseTax);

/**
 * @route GET /api/v1/reports/vendor-payments
 * @desc Get Vendor Payment History
 * @access Private
 */
router.get('/vendor-payments', purchaseReportController.getVendorPayments);

// ==================== INVENTORY REPORTS (8 endpoints) ====================

/**
 * @route GET /api/v1/reports/inventory-summary
 * @desc Get Current Stock Summary
 * @access Private
 */
router.get('/inventory-summary', inventoryReportController.getInventorySummary);

/**
 * @route GET /api/v1/reports/inventory-valuation
 * @desc Get Stock Valuation (qty * cost)
 * @access Private
 */
router.get('/inventory-valuation', inventoryReportController.getInventoryValuation);

/**
 * @route GET /api/v1/reports/stock-valuation
 * @desc Get Stock Valuation (alias for inventory-valuation)
 * @access Private
 */
router.get('/stock-valuation', inventoryReportController.getInventoryValuation);

/**
 * @route GET /api/v1/reports/inventory-movement
 * @desc Get Stock Movement History
 * @access Private
 */
router.get('/inventory-movement', inventoryReportController.getInventoryMovement);

/**
 * @route GET /api/v1/reports/inventory-aging
 * @desc Get Stock Aging Analysis
 * @access Private
 */
router.get('/inventory-aging', inventoryReportController.getInventoryAging);

/**
 * @route GET /api/v1/reports/inventory-low-stock
 * @desc Get Low Stock Items
 * @access Private
 */
router.get('/inventory-low-stock', inventoryReportController.getLowStock);

/**
 * @route GET /api/v1/reports/inventory-reorder
 * @desc Get Reorder Level Report
 * @access Private
 */
router.get('/inventory-reorder', inventoryReportController.getReorderReport);

/**
 * @route GET /api/v1/reports/inventory-warehouse
 * @desc Get Stock by Warehouse
 * @access Private
 */
router.get('/inventory-warehouse', inventoryReportController.getStockByWarehouse);

/**
 * @route GET /api/v1/reports/inventory-dead
 * @desc Get Dead/Slow-moving Stock
 * @access Private
 */
router.get('/inventory-dead', inventoryReportController.getDeadStock);

// ==================== TAX REPORTS (6 endpoints) ====================

/**
 * @route GET /api/v1/reports/tax-summary
 * @desc Get Tax Summary
 * @access Private
 */
router.get('/tax-summary', taxReportController.getTaxSummary);

/**
 * @route GET /api/v1/reports/tax-gst
 * @desc Get GST Report
 * @access Private
 */
router.get('/tax-gst', taxReportController.getGSTReport);

/**
 * @route GET /api/v1/reports/tax-vat
 * @desc Get VAT Report
 * @access Private
 */
router.get('/tax-vat', taxReportController.getVATReport);

/**
 * @route GET /api/v1/reports/tax-input
 * @desc Get Input Tax Credit
 * @access Private
 */
router.get('/tax-input', taxReportController.getInputTaxCredit);

/**
 * @route GET /api/v1/reports/tax-output
 * @desc Get Output Tax Liability
 * @access Private
 */
router.get('/tax-output', taxReportController.getOutputTaxLiability);

/**
 * @route GET /api/v1/reports/tax-filing
 * @desc Get Tax Filing Ready Data
 * @access Private
 */
router.get('/tax-filing', taxReportController.getTaxFilingData);

export default router;
