/**
 * Sales Return Controller
 * HTTP request handlers for sales return management endpoints
 */

import * as salesReturnService from '../services/salesReturnService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new sales return
 * @route POST /api/v1/sales-returns
 * @access Private
 */
export const createSalesReturn = asyncHandler(async (req, res) => {
  const returnData = { ...req.body, companyId: req.user.companyId };
  const salesReturn = await salesReturnService.createSalesReturn(returnData, req.user.id);

  ApiResponse.created(salesReturn, 'Sales return created successfully').send(res);
});

/**
 * Get all sales returns with filters
 * @route GET /api/v1/sales-returns
 * @access Private
 */
export const getSalesReturns = asyncHandler(async (req, res) => {
  const filters = { ...req.query, companyId: req.user.companyId };
  const result = await salesReturnService.getSalesReturns(filters);

  ApiResponse.paginated(
    result.returns,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Sales returns retrieved successfully'
  ).send(res);
});

/**
 * Get sales return by ID
 * @route GET /api/v1/sales-returns/:id
 * @access Private
 */
export const getSalesReturnById = asyncHandler(async (req, res) => {
  const salesReturn = await salesReturnService.getSalesReturnById(req.params.id, req.user.companyId);

  ApiResponse.success(salesReturn, 'Sales return retrieved successfully').send(res);
});

export default {
  createSalesReturn,
  getSalesReturns,
  getSalesReturnById
};
