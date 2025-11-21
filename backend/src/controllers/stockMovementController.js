/**
 * Stock Movement Controller
 * HTTP request handlers for stock movement tracking endpoints
 */

import * as stockMovementService from '../services/stockMovementService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Get all stock movements
 * @route GET /api/v1/movements
 * @access Private
 */
export const getAllMovements = asyncHandler(async (req, res) => {
  const result = await stockMovementService.getAllMovements(req.user.companyId, req.query);

  ApiResponse.paginated(
    result.movements,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Stock movements retrieved successfully'
  ).send(res);
});

/**
 * Get movement by ID
 * @route GET /api/v1/movements/:id
 * @access Private
 */
export const getMovementById = asyncHandler(async (req, res) => {
  const movement = await stockMovementService.getMovementById(req.params.id, req.user.companyId);

  ApiResponse.success(movement, 'Movement retrieved successfully').send(res);
});

/**
 * Create manual movement
 * @route POST /api/v1/movements
 * @access Private
 */
export const createMovement = asyncHandler(async (req, res) => {
  const movementData = { ...req.body, companyId: req.user.companyId };
  const movement = await stockMovementService.createMovement(movementData, req.user.id);

  ApiResponse.created(movement, 'Stock movement created successfully').send(res);
});

/**
 * Get movements by product
 * @route GET /api/v1/movements/product/:id
 * @access Private
 */
export const getMovementsByProduct = asyncHandler(async (req, res) => {
  const result = await stockMovementService.getMovementsByProduct(
    req.params.id,
    req.user.companyId,
    req.query
  );

  ApiResponse.paginated(
    result.movements,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Product movements retrieved successfully'
  ).send(res);
});

/**
 * Get movements by warehouse
 * @route GET /api/v1/movements/warehouse/:id
 * @access Private
 */
export const getMovementsByWarehouse = asyncHandler(async (req, res) => {
  const result = await stockMovementService.getMovementsByWarehouse(
    req.params.id,
    req.user.companyId,
    req.query
  );

  ApiResponse.paginated(
    result.movements,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Warehouse movements retrieved successfully'
  ).send(res);
});

/**
 * Get movements by type
 * @route GET /api/v1/movements/type/:type
 * @access Private
 */
export const getMovementsByType = asyncHandler(async (req, res) => {
  const result = await stockMovementService.getMovementsByType(
    req.params.type,
    req.user.companyId,
    req.query
  );

  ApiResponse.paginated(
    result.movements,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Movements by type retrieved successfully'
  ).send(res);
});

/**
 * Get movements by date range
 * @route GET /api/v1/movements/date-range
 * @access Private
 */
export const getMovementsByDateRange = asyncHandler(async (req, res) => {
  const result = await stockMovementService.getMovementsByDateRange(req.user.companyId, req.query);

  ApiResponse.paginated(
    result.movements,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Movements by date range retrieved successfully'
  ).send(res);
});

/**
 * Bulk create movements
 * @route POST /api/v1/movements/bulk
 * @access Private
 */
export const bulkCreateMovements = asyncHandler(async (req, res) => {
  const { movements } = req.body;
  const result = await stockMovementService.bulkCreateMovements(
    movements,
    req.user.companyId,
    req.user.id
  );

  ApiResponse.created(
    result,
    `${result.created.length} movements created, ${result.errors.length} failed`
  ).send(res);
});

/**
 * Get movement statistics
 * @route GET /api/v1/movements/stats
 * @access Private
 */
export const getMovementStats = asyncHandler(async (req, res) => {
  const stats = await stockMovementService.getMovementStats(req.user.companyId, req.query);

  ApiResponse.success(stats, 'Movement statistics retrieved successfully').send(res);
});

export default {
  getAllMovements,
  getMovementById,
  createMovement,
  getMovementsByProduct,
  getMovementsByWarehouse,
  getMovementsByType,
  getMovementsByDateRange,
  bulkCreateMovements,
  getMovementStats
};
