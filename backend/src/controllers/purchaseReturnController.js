/**
 * Purchase Return Controller
 * HTTP request handlers for purchase return management endpoints
 */

import * as purchaseReturnService from '../services/purchaseReturnService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new purchase return
 * @route POST /api/v1/purchase-returns
 * @access Private
 */
export const createPurchaseReturn = asyncHandler(async (req, res) => {
  const returnData = { ...req.body, companyId: req.user.companyId };
  const purchaseReturn = await purchaseReturnService.createPurchaseReturn(returnData, req.user.id);

  ApiResponse.created(purchaseReturn, 'Purchase return created successfully').send(res);
});

/**
 * Get all purchase returns with filters
 * @route GET /api/v1/purchase-returns
 * @access Private
 */
export const getPurchaseReturns = asyncHandler(async (req, res) => {
  const filters = { ...req.query, companyId: req.user.companyId };
  const result = await purchaseReturnService.getPurchaseReturns(filters);

  ApiResponse.paginated(
    result.returns,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Purchase returns retrieved successfully'
  ).send(res);
});

/**
 * Get purchase return by ID
 * @route GET /api/v1/purchase-returns/:id
 * @access Private
 */
export const getPurchaseReturnById = asyncHandler(async (req, res) => {
  const purchaseReturn = await purchaseReturnService.getPurchaseReturnById(req.params.id, req.user.companyId);

  ApiResponse.success(purchaseReturn, 'Purchase return retrieved successfully').send(res);
});

/**
 * Update purchase return
 * @route PUT /api/v1/purchase-returns/:id
 * @access Private
 */
export const updatePurchaseReturn = asyncHandler(async (req, res) => {
  const purchaseReturn = await purchaseReturnService.updatePurchaseReturn(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(purchaseReturn, 'Purchase return updated successfully').send(res);
});

/**
 * Delete purchase return
 * @route DELETE /api/v1/purchase-returns/:id
 * @access Private
 */
export const deletePurchaseReturn = asyncHandler(async (req, res) => {
  await purchaseReturnService.deletePurchaseReturn(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Purchase return deleted successfully').send(res);
});

/**
 * Approve purchase return and create credit note
 * @route POST /api/v1/purchase-returns/:id/approve
 * @access Private
 */
export const approvePurchaseReturn = asyncHandler(async (req, res) => {
  const purchaseReturn = await purchaseReturnService.approvePurchaseReturn(
    req.params.id,
    req.user.companyId,
    req.user.id
  );

  ApiResponse.success(purchaseReturn, 'Purchase return approved and credit note created successfully').send(res);
});

export default {
  createPurchaseReturn,
  getPurchaseReturns,
  getPurchaseReturnById,
  updatePurchaseReturn,
  deletePurchaseReturn,
  approvePurchaseReturn
};
