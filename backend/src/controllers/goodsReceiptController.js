/**
 * Goods Receipt Controller
 * HTTP request handlers for goods receipt management endpoints
 */

import * as goodsReceiptService from '../services/goodsReceiptService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new goods receipt
 * @route POST /api/v1/goods-receipts
 * @access Private
 */
export const createGoodsReceipt = asyncHandler(async (req, res) => {
  const receiptData = { ...req.body, companyId: req.user.companyId };
  const receipt = await goodsReceiptService.createGoodsReceipt(receiptData, req.user.id);

  ApiResponse.created(receipt, 'Goods receipt created successfully').send(res);
});

/**
 * Get all goods receipts with filters
 * @route GET /api/v1/goods-receipts
 * @access Private
 */
export const getGoodsReceipts = asyncHandler(async (req, res) => {
  const filters = { ...req.query, companyId: req.user.companyId };
  const result = await goodsReceiptService.getGoodsReceipts(filters);

  ApiResponse.paginated(
    result.receipts,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Goods receipts retrieved successfully'
  ).send(res);
});

/**
 * Get goods receipt by ID
 * @route GET /api/v1/goods-receipts/:id
 * @access Private
 */
export const getGoodsReceiptById = asyncHandler(async (req, res) => {
  const receipt = await goodsReceiptService.getGoodsReceiptById(req.params.id, req.user.companyId);

  ApiResponse.success(receipt, 'Goods receipt retrieved successfully').send(res);
});

/**
 * Update goods receipt
 * @route PUT /api/v1/goods-receipts/:id
 * @access Private
 */
export const updateGoodsReceipt = asyncHandler(async (req, res) => {
  const receipt = await goodsReceiptService.updateGoodsReceipt(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(receipt, 'Goods receipt updated successfully').send(res);
});

/**
 * Delete goods receipt and reverse stock
 * @route DELETE /api/v1/goods-receipts/:id
 * @access Private
 */
export const deleteGoodsReceipt = asyncHandler(async (req, res) => {
  await goodsReceiptService.deleteGoodsReceipt(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Goods receipt deleted and stock reversed successfully').send(res);
});

/**
 * Approve goods receipt
 * @route POST /api/v1/goods-receipts/:id/approve
 * @access Private
 */
export const approveGoodsReceipt = asyncHandler(async (req, res) => {
  const receipt = await goodsReceiptService.approveGoodsReceipt(
    req.params.id,
    req.user.companyId,
    req.user.id
  );

  ApiResponse.success(receipt, 'Goods receipt approved successfully').send(res);
});

/**
 * Generate PDF for goods receipt
 * @route GET /api/v1/goods-receipts/:id/pdf
 * @access Private
 */
export const generatePDF = asyncHandler(async (req, res) => {
  const receipt = await goodsReceiptService.getGoodsReceiptById(req.params.id, req.user.companyId);

  // TODO: Implement PDF generation
  ApiResponse.success(
    { receipt, pdf: null },
    'PDF generation not yet implemented - returning receipt data'
  ).send(res);
});

/**
 * Get goods receipts for a purchase order
 * @route GET /api/v1/goods-receipts/po/:id
 * @access Private
 */
export const getReceiptsByPurchaseOrder = asyncHandler(async (req, res) => {
  const receipts = await goodsReceiptService.getReceiptsByPurchaseOrder(req.params.id, req.user.companyId);

  ApiResponse.success(receipts, 'Goods receipts for purchase order retrieved successfully').send(res);
});

export default {
  createGoodsReceipt,
  getGoodsReceipts,
  getGoodsReceiptById,
  updateGoodsReceipt,
  deleteGoodsReceipt,
  approveGoodsReceipt,
  generatePDF,
  getReceiptsByPurchaseOrder
};
