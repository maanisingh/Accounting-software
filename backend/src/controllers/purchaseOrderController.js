/**
 * Purchase Order Controller
 * HTTP request handlers for purchase order management endpoints
 */

import * as purchaseOrderService from '../services/purchaseOrderService.js';
import * as goodsReceiptService from '../services/goodsReceiptService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new purchase order
 * @route POST /api/v1/purchase-orders
 * @access Private
 */
export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const orderData = { ...req.body, companyId: req.user.companyId };
  const order = await purchaseOrderService.createPurchaseOrder(orderData, req.user.id);

  ApiResponse.created(order, 'Purchase order created successfully').send(res);
});

/**
 * Get all purchase orders with filters
 * @route GET /api/v1/purchase-orders
 * @access Private
 */
export const getPurchaseOrders = asyncHandler(async (req, res) => {
  const filters = { ...req.query, companyId: req.user.companyId };
  const result = await purchaseOrderService.getPurchaseOrders(filters);

  ApiResponse.paginated(
    result.orders,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Purchase orders retrieved successfully'
  ).send(res);
});

/**
 * Get purchase order by ID
 * @route GET /api/v1/purchase-orders/:id
 * @access Private
 */
export const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const order = await purchaseOrderService.getPurchaseOrderById(req.params.id, req.user.companyId);

  ApiResponse.success(order, 'Purchase order retrieved successfully').send(res);
});

/**
 * Update purchase order
 * @route PUT /api/v1/purchase-orders/:id
 * @access Private
 */
export const updatePurchaseOrder = asyncHandler(async (req, res) => {
  const order = await purchaseOrderService.updatePurchaseOrder(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(order, 'Purchase order updated successfully').send(res);
});

/**
 * Delete purchase order
 * @route DELETE /api/v1/purchase-orders/:id
 * @access Private
 */
export const deletePurchaseOrder = asyncHandler(async (req, res) => {
  await purchaseOrderService.deletePurchaseOrder(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Purchase order deleted successfully').send(res);
});

/**
 * Approve purchase order
 * @route POST /api/v1/purchase-orders/:id/approve
 * @access Private
 */
export const approvePurchaseOrder = asyncHandler(async (req, res) => {
  const order = await purchaseOrderService.approvePurchaseOrder(
    req.params.id,
    req.user.companyId,
    req.user.id
  );

  ApiResponse.success(order, 'Purchase order approved successfully').send(res);
});

/**
 * Create goods receipt from purchase order
 * @route POST /api/v1/purchase-orders/:id/receive
 * @access Private
 */
export const createGoodsReceipt = asyncHandler(async (req, res) => {
  // First get the PO to populate receipt data
  const order = await purchaseOrderService.getPurchaseOrderById(req.params.id, req.user.companyId);

  const receiptData = {
    ...req.body,
    companyId: req.user.companyId,
    vendorId: order.vendorId,
    purchaseOrderId: order.id
  };

  const receipt = await goodsReceiptService.createGoodsReceipt(receiptData, req.user.id);

  ApiResponse.created(receipt, 'Goods receipt created from purchase order successfully').send(res);
});

/**
 * Close purchase order
 * @route POST /api/v1/purchase-orders/:id/close
 * @access Private
 */
export const closePurchaseOrder = asyncHandler(async (req, res) => {
  const order = await purchaseOrderService.closePurchaseOrder(
    req.params.id,
    req.user.companyId,
    req.user.id
  );

  ApiResponse.success(order, 'Purchase order closed successfully').send(res);
});

/**
 * Generate PDF for purchase order
 * @route GET /api/v1/purchase-orders/:id/pdf
 * @access Private
 */
export const generatePDF = asyncHandler(async (req, res) => {
  const order = await purchaseOrderService.getPurchaseOrderById(req.params.id, req.user.companyId);

  // TODO: Implement PDF generation
  ApiResponse.success(
    { order, pdf: null },
    'PDF generation not yet implemented - returning order data'
  ).send(res);
});

/**
 * Email purchase order to vendor
 * @route POST /api/v1/purchase-orders/:id/email
 * @access Private
 */
export const emailPurchaseOrder = asyncHandler(async (req, res) => {
  const order = await purchaseOrderService.getPurchaseOrderById(req.params.id, req.user.companyId);

  // TODO: Implement email functionality
  ApiResponse.success(
    { order, emailSent: false },
    'Email functionality not yet implemented'
  ).send(res);
});

export default {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  approvePurchaseOrder,
  createGoodsReceipt,
  closePurchaseOrder,
  generatePDF,
  emailPurchaseOrder
};
