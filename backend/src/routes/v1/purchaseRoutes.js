/**
 * Purchase Routes
 * API routes for purchase module - all 42 endpoints
 */

import express from 'express';
import * as purchaseQuotationController from '../../controllers/purchaseQuotationController.js';
import * as purchaseOrderController from '../../controllers/purchaseOrderController.js';
import * as goodsReceiptController from '../../controllers/goodsReceiptController.js';
import * as billController from '../../controllers/billController.js';
import * as purchaseReturnController from '../../controllers/purchaseReturnController.js';

import * as purchaseQuotationValidation from '../../validations/purchaseQuotationValidation.js';
import * as purchaseOrderValidation from '../../validations/purchaseOrderValidation.js';
import * as goodsReceiptValidation from '../../validations/goodsReceiptValidation.js';
import * as billValidation from '../../validations/billValidation.js';
import * as purchaseReturnValidation from '../../validations/purchaseReturnValidation.js';

import { validateBody, validateQuery, validateParams } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all purchase routes
router.use(authenticate);

// ==================== PURCHASE QUOTATIONS (8 endpoints) ====================

/**
 * @route   POST /api/v1/purchase-quotations
 * @desc    Create purchase quotation
 * @access  Private
 */
router.post(
  '/purchase-quotations',
  validateBody(purchaseQuotationValidation.createPurchaseQuotationSchema),
  purchaseQuotationController.createPurchaseQuotation
);

/**
 * @route   GET /api/v1/purchase-quotations
 * @desc    List purchase quotations with filters
 * @access  Private
 */
router.get(
  '/purchase-quotations',
  validateQuery(purchaseQuotationValidation.getPurchaseQuotationsSchema),
  purchaseQuotationController.getPurchaseQuotations
);

/**
 * @route   GET /api/v1/purchase-quotations/:id
 * @desc    Get purchase quotation details
 * @access  Private
 */
router.get(
  '/purchase-quotations/:id',
  validateParams(purchaseQuotationValidation.idParamSchema),
  purchaseQuotationController.getPurchaseQuotationById
);

/**
 * @route   PUT /api/v1/purchase-quotations/:id
 * @desc    Update purchase quotation
 * @access  Private
 */
router.put(
  '/purchase-quotations/:id',
  validateParams(purchaseQuotationValidation.idParamSchema),
  validateBody(purchaseQuotationValidation.updatePurchaseQuotationSchema),
  purchaseQuotationController.updatePurchaseQuotation
);

/**
 * @route   DELETE /api/v1/purchase-quotations/:id
 * @desc    Delete purchase quotation (soft delete)
 * @access  Private
 */
router.delete(
  '/purchase-quotations/:id',
  validateParams(purchaseQuotationValidation.idParamSchema),
  purchaseQuotationController.deletePurchaseQuotation
);

/**
 * @route   POST /api/v1/purchase-quotations/:id/convert
 * @desc    Convert quotation to purchase order
 * @access  Private
 */
router.post(
  '/purchase-quotations/:id/convert',
  validateParams(purchaseQuotationValidation.idParamSchema),
  purchaseQuotationController.convertToPurchaseOrder
);

/**
 * @route   GET /api/v1/purchase-quotations/:id/pdf
 * @desc    Generate PDF for quotation
 * @access  Private
 */
router.get(
  '/purchase-quotations/:id/pdf',
  validateParams(purchaseQuotationValidation.idParamSchema),
  purchaseQuotationController.generatePDF
);

/**
 * @route   POST /api/v1/purchase-quotations/:id/email
 * @desc    Email quotation to vendor
 * @access  Private
 */
router.post(
  '/purchase-quotations/:id/email',
  validateParams(purchaseQuotationValidation.idParamSchema),
  purchaseQuotationController.emailQuotation
);

// ==================== PURCHASE ORDERS (10 endpoints) ====================

/**
 * @route   POST /api/v1/purchase-orders
 * @desc    Create purchase order
 * @access  Private
 */
router.post(
  '/purchase-orders',
  validateBody(purchaseOrderValidation.createPurchaseOrderSchema),
  purchaseOrderController.createPurchaseOrder
);

/**
 * @route   GET /api/v1/purchase-orders
 * @desc    List purchase orders with filters
 * @access  Private
 */
router.get(
  '/purchase-orders',
  validateQuery(purchaseOrderValidation.getPurchaseOrdersSchema),
  purchaseOrderController.getPurchaseOrders
);

/**
 * @route   GET /api/v1/purchase-orders/:id
 * @desc    Get purchase order details
 * @access  Private
 */
router.get(
  '/purchase-orders/:id',
  validateParams(purchaseOrderValidation.idParamSchema),
  purchaseOrderController.getPurchaseOrderById
);

/**
 * @route   PUT /api/v1/purchase-orders/:id
 * @desc    Update purchase order
 * @access  Private
 */
router.put(
  '/purchase-orders/:id',
  validateParams(purchaseOrderValidation.idParamSchema),
  validateBody(purchaseOrderValidation.updatePurchaseOrderSchema),
  purchaseOrderController.updatePurchaseOrder
);

/**
 * @route   DELETE /api/v1/purchase-orders/:id
 * @desc    Delete purchase order
 * @access  Private
 */
router.delete(
  '/purchase-orders/:id',
  validateParams(purchaseOrderValidation.idParamSchema),
  purchaseOrderController.deletePurchaseOrder
);

/**
 * @route   POST /api/v1/purchase-orders/:id/approve
 * @desc    Approve purchase order
 * @access  Private
 */
router.post(
  '/purchase-orders/:id/approve',
  validateParams(purchaseOrderValidation.idParamSchema),
  purchaseOrderController.approvePurchaseOrder
);

/**
 * @route   POST /api/v1/purchase-orders/:id/receive
 * @desc    Create goods receipt from purchase order
 * @access  Private
 */
router.post(
  '/purchase-orders/:id/receive',
  validateParams(purchaseOrderValidation.idParamSchema),
  validateBody(purchaseOrderValidation.createGoodsReceiptFromPOSchema),
  purchaseOrderController.createGoodsReceipt
);

/**
 * @route   POST /api/v1/purchase-orders/:id/close
 * @desc    Close purchase order
 * @access  Private
 */
router.post(
  '/purchase-orders/:id/close',
  validateParams(purchaseOrderValidation.idParamSchema),
  purchaseOrderController.closePurchaseOrder
);

/**
 * @route   GET /api/v1/purchase-orders/:id/pdf
 * @desc    Generate PDF for purchase order
 * @access  Private
 */
router.get(
  '/purchase-orders/:id/pdf',
  validateParams(purchaseOrderValidation.idParamSchema),
  purchaseOrderController.generatePDF
);

/**
 * @route   POST /api/v1/purchase-orders/:id/email
 * @desc    Email purchase order to vendor
 * @access  Private
 */
router.post(
  '/purchase-orders/:id/email',
  validateParams(purchaseOrderValidation.idParamSchema),
  purchaseOrderController.emailPurchaseOrder
);

// ==================== GOODS RECEIPTS (8 endpoints) ====================

/**
 * @route   GET /api/v1/goods-receipts/po/:id
 * @desc    Get goods receipts for a purchase order
 * @access  Private
 */
router.get(
  '/goods-receipts/po/:id',
  validateParams(goodsReceiptValidation.idParamSchema),
  goodsReceiptController.getReceiptsByPurchaseOrder
);

/**
 * @route   POST /api/v1/goods-receipts
 * @desc    Create goods receipt
 * @access  Private
 */
router.post(
  '/goods-receipts',
  validateBody(goodsReceiptValidation.createGoodsReceiptSchema),
  goodsReceiptController.createGoodsReceipt
);

/**
 * @route   GET /api/v1/goods-receipts
 * @desc    List goods receipts with filters
 * @access  Private
 */
router.get(
  '/goods-receipts',
  validateQuery(goodsReceiptValidation.getGoodsReceiptsSchema),
  goodsReceiptController.getGoodsReceipts
);

/**
 * @route   GET /api/v1/goods-receipts/:id
 * @desc    Get goods receipt details
 * @access  Private
 */
router.get(
  '/goods-receipts/:id',
  validateParams(goodsReceiptValidation.idParamSchema),
  goodsReceiptController.getGoodsReceiptById
);

/**
 * @route   PUT /api/v1/goods-receipts/:id
 * @desc    Update goods receipt
 * @access  Private
 */
router.put(
  '/goods-receipts/:id',
  validateParams(goodsReceiptValidation.idParamSchema),
  validateBody(goodsReceiptValidation.updateGoodsReceiptSchema),
  goodsReceiptController.updateGoodsReceipt
);

/**
 * @route   DELETE /api/v1/goods-receipts/:id
 * @desc    Delete goods receipt and reverse stock
 * @access  Private
 */
router.delete(
  '/goods-receipts/:id',
  validateParams(goodsReceiptValidation.idParamSchema),
  goodsReceiptController.deleteGoodsReceipt
);

/**
 * @route   POST /api/v1/goods-receipts/:id/approve
 * @desc    Approve goods receipt
 * @access  Private
 */
router.post(
  '/goods-receipts/:id/approve',
  validateParams(goodsReceiptValidation.idParamSchema),
  goodsReceiptController.approveGoodsReceipt
);

/**
 * @route   GET /api/v1/goods-receipts/:id/pdf
 * @desc    Generate PDF for goods receipt
 * @access  Private
 */
router.get(
  '/goods-receipts/:id/pdf',
  validateParams(goodsReceiptValidation.idParamSchema),
  goodsReceiptController.generatePDF
);

// ==================== BILLS (10 endpoints) ====================

/**
 * @route   GET /api/v1/bills/pending
 * @desc    Get pending (unpaid) bills
 * @access  Private
 */
router.get(
  '/bills/pending',
  validateQuery(billValidation.getPendingBillsSchema),
  billController.getPendingBills
);

/**
 * @route   GET /api/v1/bills/vendor/:id
 * @desc    Get bills by vendor
 * @access  Private
 */
router.get(
  '/bills/vendor/:id',
  validateParams(billValidation.idParamSchema),
  billController.getBillsByVendor
);

/**
 * @route   POST /api/v1/bills
 * @desc    Create bill
 * @access  Private
 */
router.post(
  '/bills',
  validateBody(billValidation.createBillSchema),
  billController.createBill
);

/**
 * @route   GET /api/v1/bills
 * @desc    List bills with filters
 * @access  Private
 */
router.get(
  '/bills',
  validateQuery(billValidation.getBillsSchema),
  billController.getBills
);

/**
 * @route   GET /api/v1/bills/:id
 * @desc    Get bill details
 * @access  Private
 */
router.get(
  '/bills/:id',
  validateParams(billValidation.idParamSchema),
  billController.getBillById
);

/**
 * @route   PUT /api/v1/bills/:id
 * @desc    Update bill
 * @access  Private
 */
router.put(
  '/bills/:id',
  validateParams(billValidation.idParamSchema),
  validateBody(billValidation.updateBillSchema),
  billController.updateBill
);

/**
 * @route   DELETE /api/v1/bills/:id
 * @desc    Delete bill
 * @access  Private
 */
router.delete(
  '/bills/:id',
  validateParams(billValidation.idParamSchema),
  billController.deleteBill
);

/**
 * @route   POST /api/v1/bills/:id/approve
 * @desc    Approve bill and create journal entry
 * @access  Private
 */
router.post(
  '/bills/:id/approve',
  validateParams(billValidation.idParamSchema),
  billController.approveBill
);

/**
 * @route   POST /api/v1/bills/:id/pay
 * @desc    Record payment for bill
 * @access  Private
 */
router.post(
  '/bills/:id/pay',
  validateParams(billValidation.idParamSchema),
  validateBody(billValidation.recordPaymentSchema),
  billController.recordPayment
);

/**
 * @route   GET /api/v1/bills/:id/pdf
 * @desc    Generate PDF for bill
 * @access  Private
 */
router.get(
  '/bills/:id/pdf',
  validateParams(billValidation.idParamSchema),
  billController.generatePDF
);

// ==================== PURCHASE RETURNS (6 endpoints) ====================

/**
 * @route   POST /api/v1/purchase-returns
 * @desc    Create purchase return
 * @access  Private
 */
router.post(
  '/purchase-returns',
  validateBody(purchaseReturnValidation.createPurchaseReturnSchema),
  purchaseReturnController.createPurchaseReturn
);

/**
 * @route   GET /api/v1/purchase-returns
 * @desc    List purchase returns with filters
 * @access  Private
 */
router.get(
  '/purchase-returns',
  validateQuery(purchaseReturnValidation.getPurchaseReturnsSchema),
  purchaseReturnController.getPurchaseReturns
);

/**
 * @route   GET /api/v1/purchase-returns/:id
 * @desc    Get purchase return details
 * @access  Private
 */
router.get(
  '/purchase-returns/:id',
  validateParams(purchaseReturnValidation.idParamSchema),
  purchaseReturnController.getPurchaseReturnById
);

/**
 * @route   PUT /api/v1/purchase-returns/:id
 * @desc    Update purchase return
 * @access  Private
 */
router.put(
  '/purchase-returns/:id',
  validateParams(purchaseReturnValidation.idParamSchema),
  validateBody(purchaseReturnValidation.updatePurchaseReturnSchema),
  purchaseReturnController.updatePurchaseReturn
);

/**
 * @route   DELETE /api/v1/purchase-returns/:id
 * @desc    Delete purchase return
 * @access  Private
 */
router.delete(
  '/purchase-returns/:id',
  validateParams(purchaseReturnValidation.idParamSchema),
  purchaseReturnController.deletePurchaseReturn
);

/**
 * @route   POST /api/v1/purchase-returns/:id/approve
 * @desc    Approve purchase return and create credit note
 * @access  Private
 */
router.post(
  '/purchase-returns/:id/approve',
  validateParams(purchaseReturnValidation.idParamSchema),
  purchaseReturnController.approvePurchaseReturn
);

export default router;
