/**
 * Stock Controller
 * HTTP request handlers for stock management endpoints
 */

import * as stockService from '../services/stockService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Get all stock
 * @route GET /api/v1/stock
 * @access Private
 */
export const getAllStock = asyncHandler(async (req, res) => {
  const result = await stockService.getAllStock(req.user.companyId, req.query);

  ApiResponse.paginated(
    result.stockItems,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Stock retrieved successfully'
  ).send(res);
});

/**
 * Get product stock across warehouses
 * @route GET /api/v1/stock/:productId
 * @access Private
 */
export const getProductStock = asyncHandler(async (req, res) => {
  const stockLevels = await stockService.getProductStock(req.params.productId, req.user.companyId);

  ApiResponse.success(stockLevels, 'Product stock retrieved successfully').send(res);
});

/**
 * Transfer stock between warehouses
 * @route POST /api/v1/stock/transfer
 * @access Private
 */
export const transferStock = asyncHandler(async (req, res) => {
  const transferData = { ...req.body, companyId: req.user.companyId };
  const result = await stockService.transferStock(transferData, req.user.id);

  ApiResponse.success(result, 'Stock transferred successfully').send(res);
});

/**
 * Adjust stock levels
 * @route POST /api/v1/stock/adjust
 * @access Private
 */
export const adjustStock = asyncHandler(async (req, res) => {
  const adjustmentData = { ...req.body, companyId: req.user.companyId };
  const result = await stockService.adjustStock(adjustmentData, req.user.id);

  ApiResponse.success(result, 'Stock adjusted successfully').send(res);
});

/**
 * Get low stock products
 * @route GET /api/v1/stock/low
 * @access Private
 */
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await stockService.getLowStockProducts(req.user.companyId);

  ApiResponse.success(products, 'Low stock products retrieved successfully').send(res);
});

/**
 * Get out of stock products
 * @route GET /api/v1/stock/out
 * @access Private
 */
export const getOutOfStockProducts = asyncHandler(async (req, res) => {
  const products = await stockService.getOutOfStockProducts(req.user.companyId);

  ApiResponse.success(products, 'Out of stock products retrieved successfully').send(res);
});

/**
 * Get all stock movements
 * @route GET /api/v1/stock/movements
 * @access Private
 */
export const getAllMovements = asyncHandler(async (req, res) => {
  const result = await stockService.getAllStock(req.user.companyId, req.query);

  ApiResponse.paginated(
    result.stockItems,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Stock movements retrieved successfully'
  ).send(res);
});

/**
 * Create reorder suggestion
 * @route POST /api/v1/stock/reorder
 * @access Private
 */
export const createReorderSuggestion = asyncHandler(async (req, res) => {
  // Get low stock products as reorder suggestions
  const products = await stockService.getLowStockProducts(req.user.companyId);

  const suggestions = products.map(product => ({
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    currentStock: product.totalStock,
    reorderLevel: product.reorderLevel,
    suggestedQuantity: product.reorderLevel * 2 - product.totalStock,
    category: product.category?.name
  }));

  ApiResponse.success(suggestions, 'Reorder suggestions generated successfully').send(res);
});

/**
 * Get stock valuation
 * @route GET /api/v1/stock/valuation
 * @access Private
 */
export const getStockValuation = asyncHandler(async (req, res) => {
  const valuation = await stockService.getStockValuation(req.user.companyId, req.query);

  ApiResponse.success(valuation, 'Stock valuation retrieved successfully').send(res);
});

/**
 * Get stock aging report
 * @route GET /api/v1/stock/aging
 * @access Private
 */
export const getStockAging = asyncHandler(async (req, res) => {
  const aging = await stockService.getStockAging(req.user.companyId, req.query);

  ApiResponse.success(aging, 'Stock aging report retrieved successfully').send(res);
});

export default {
  getAllStock,
  getProductStock,
  transferStock,
  adjustStock,
  getLowStockProducts,
  getOutOfStockProducts,
  getAllMovements,
  createReorderSuggestion,
  getStockValuation,
  getStockAging
};
