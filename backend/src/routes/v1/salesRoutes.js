/**
 * Sales Routes
 * All sales-related endpoints (quotations, orders, challans, returns)
 */

import express from 'express';
import * as salesQuotationController from '../../controllers/salesQuotationController.js';
import * as salesOrderController from '../../controllers/salesOrderController.js';
import * as deliveryChallanController from '../../controllers/deliveryChallanController.js';
import * as salesReturnController from '../../controllers/salesReturnController.js';
import { authenticate } from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';
import * as salesQuotationValidation from '../../validations/salesQuotationValidation.js';
import * as salesOrderValidation from '../../validations/salesOrderValidation.js';
import * as deliveryChallanValidation from '../../validations/deliveryChallanValidation.js';
import * as salesReturnValidation from '../../validations/salesReturnValidation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ==================== SALES QUOTATIONS ====================

/**
 * @route   POST /api/v1/sales-quotations
 * @desc    Create new sales quotation
 * @access  Private
 */
router.post(
  '/sales-quotations',
  validate(salesQuotationValidation.createSalesQuotationSchema),
  salesQuotationController.createSalesQuotation
);

/**
 * @route   GET /api/v1/sales-quotations
 * @desc    Get all sales quotations with filters
 * @access  Private
 */
router.get(
  '/sales-quotations',
  validate(salesQuotationValidation.getSalesQuotationsSchema, 'query'),
  salesQuotationController.getSalesQuotations
);

/**
 * @route   GET /api/v1/sales-quotations/:id
 * @desc    Get sales quotation by ID
 * @access  Private
 */
router.get(
  '/sales-quotations/:id',
  validate(salesQuotationValidation.idParamSchema, 'params'),
  salesQuotationController.getSalesQuotationById
);

/**
 * @route   PUT /api/v1/sales-quotations/:id
 * @desc    Update sales quotation
 * @access  Private
 */
router.put(
  '/sales-quotations/:id',
  validate(salesQuotationValidation.idParamSchema, 'params'),
  validate(salesQuotationValidation.updateSalesQuotationSchema),
  salesQuotationController.updateSalesQuotation
);

/**
 * @route   DELETE /api/v1/sales-quotations/:id
 * @desc    Delete sales quotation
 * @access  Private
 */
router.delete(
  '/sales-quotations/:id',
  validate(salesQuotationValidation.idParamSchema, 'params'),
  salesQuotationController.deleteSalesQuotation
);

/**
 * @route   POST /api/v1/sales-quotations/:id/convert
 * @desc    Convert sales quotation to sales order
 * @access  Private
 */
router.post(
  '/sales-quotations/:id/convert',
  validate(salesQuotationValidation.idParamSchema, 'params'),
  validate(salesQuotationValidation.convertToSalesOrderSchema),
  salesQuotationController.convertToSalesOrder
);

// ==================== SALES ORDERS ====================

/**
 * @route   POST /api/v1/sales-orders
 * @desc    Create new sales order
 * @access  Private
 */
router.post(
  '/sales-orders',
  validate(salesOrderValidation.createSalesOrderSchema),
  salesOrderController.createSalesOrder
);

/**
 * @route   GET /api/v1/sales-orders
 * @desc    Get all sales orders with filters
 * @access  Private
 */
router.get(
  '/sales-orders',
  validate(salesOrderValidation.getSalesOrdersSchema, 'query'),
  salesOrderController.getSalesOrders
);

/**
 * @route   GET /api/v1/sales-orders/:id
 * @desc    Get sales order by ID
 * @access  Private
 */
router.get(
  '/sales-orders/:id',
  validate(salesOrderValidation.idParamSchema, 'params'),
  salesOrderController.getSalesOrderById
);

/**
 * @route   PUT /api/v1/sales-orders/:id
 * @desc    Update sales order
 * @access  Private
 */
router.put(
  '/sales-orders/:id',
  validate(salesOrderValidation.idParamSchema, 'params'),
  validate(salesOrderValidation.updateSalesOrderSchema),
  salesOrderController.updateSalesOrder
);

/**
 * @route   DELETE /api/v1/sales-orders/:id
 * @desc    Delete sales order
 * @access  Private
 */
router.delete(
  '/sales-orders/:id',
  validate(salesOrderValidation.idParamSchema, 'params'),
  salesOrderController.deleteSalesOrder
);

/**
 * @route   POST /api/v1/sales-orders/:id/invoice
 * @desc    Convert sales order to invoice
 * @access  Private
 */
router.post(
  '/sales-orders/:id/invoice',
  validate(salesOrderValidation.idParamSchema, 'params'),
  validate(salesOrderValidation.convertToInvoiceSchema),
  salesOrderController.convertToInvoice
);

// ==================== DELIVERY CHALLANS ====================

/**
 * @route   POST /api/v1/delivery-challans
 * @desc    Create new delivery challan
 * @access  Private
 */
router.post(
  '/delivery-challans',
  validate(deliveryChallanValidation.createDeliveryChallanSchema),
  deliveryChallanController.createDeliveryChallan
);

/**
 * @route   GET /api/v1/delivery-challans
 * @desc    Get all delivery challans with filters
 * @access  Private
 */
router.get(
  '/delivery-challans',
  validate(deliveryChallanValidation.getDeliveryChallansSchema, 'query'),
  deliveryChallanController.getDeliveryChallans
);

/**
 * @route   GET /api/v1/delivery-challans/:id
 * @desc    Get delivery challan by ID
 * @access  Private
 */
router.get(
  '/delivery-challans/:id',
  validate(deliveryChallanValidation.idParamSchema, 'params'),
  deliveryChallanController.getDeliveryChallanById
);

/**
 * @route   DELETE /api/v1/delivery-challans/:id
 * @desc    Delete delivery challan and reverse stock
 * @access  Private
 */
router.delete(
  '/delivery-challans/:id',
  validate(deliveryChallanValidation.idParamSchema, 'params'),
  deliveryChallanController.deleteDeliveryChallan
);

// ==================== SALES RETURNS ====================

/**
 * @route   POST /api/v1/sales-returns
 * @desc    Create new sales return
 * @access  Private
 */
router.post(
  '/sales-returns',
  validate(salesReturnValidation.createSalesReturnSchema),
  salesReturnController.createSalesReturn
);

/**
 * @route   GET /api/v1/sales-returns
 * @desc    Get all sales returns with filters
 * @access  Private
 */
router.get(
  '/sales-returns',
  validate(salesReturnValidation.getSalesReturnsSchema, 'query'),
  salesReturnController.getSalesReturns
);

/**
 * @route   GET /api/v1/sales-returns/:id
 * @desc    Get sales return by ID
 * @access  Private
 */
router.get(
  '/sales-returns/:id',
  validate(salesReturnValidation.idParamSchema, 'params'),
  salesReturnController.getSalesReturnById
);

export default router;
