/**
 * Product Controller
 * HTTP request handlers for product management endpoints
 */

import * as productService from '../services/productService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new product
 * @route POST /api/v1/products
 * @access Private
 */
export const createProduct = asyncHandler(async (req, res) => {
  const productData = { ...req.body, companyId: req.user.companyId };
  const product = await productService.createProduct(productData, req.user.id);

  ApiResponse.created(product, 'Product created successfully').send(res);
});

/**
 * Get all products with filters
 * @route GET /api/v1/products
 * @access Private
 */
export const getProducts = asyncHandler(async (req, res) => {
  const filters = { ...req.query, companyId: req.user.companyId };
  const result = await productService.getProducts(filters);

  // Wrap products array in object for consistent structure
  ApiResponse.paginated(
    { products: result.products },
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Products retrieved successfully'
  ).send(res);
});

/**
 * Get product by ID
 * @route GET /api/v1/products/:id
 * @access Private
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id, req.user.companyId);

  ApiResponse.success(product, 'Product retrieved successfully').send(res);
});

/**
 * Update product
 * @route PUT /api/v1/products/:id
 * @access Private
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(product, 'Product updated successfully').send(res);
});

/**
 * Delete product
 * @route DELETE /api/v1/products/:id
 * @access Private
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Product deleted successfully').send(res);
});

/**
 * Search products
 * @route GET /api/v1/products/search
 * @access Private
 */
export const searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const products = await productService.searchProducts(q, req.user.companyId);

  ApiResponse.success(products, 'Products found successfully').send(res);
});

/**
 * Bulk create products
 * @route POST /api/v1/products/bulk
 * @access Private
 */
export const bulkCreateProducts = asyncHandler(async (req, res) => {
  const { products } = req.body;
  const result = await productService.bulkCreateProducts(products, req.user.companyId, req.user.id);

  ApiResponse.created(result, `${result.created.length} products created, ${result.errors.length} failed`).send(res);
});

/**
 * Get product stock levels
 * @route GET /api/v1/products/:id/stock
 * @access Private
 */
export const getProductStock = asyncHandler(async (req, res) => {
  const stockLevels = await productService.getProductStock(req.params.id, req.user.companyId);

  ApiResponse.success(stockLevels, 'Product stock levels retrieved successfully').send(res);
});

/**
 * Adjust product stock
 * @route POST /api/v1/products/:id/adjust
 * @access Private
 */
export const adjustProductStock = asyncHandler(async (req, res) => {
  const { warehouseId, quantity, reason, reference } = req.body;
  const result = await productService.adjustProductStock(
    req.params.id,
    warehouseId,
    quantity,
    reason,
    reference,
    req.user.companyId,
    req.user.id
  );

  ApiResponse.success(result, 'Product stock adjusted successfully').send(res);
});

/**
 * Get product stock movement history
 * @route GET /api/v1/products/:id/movement
 * @access Private
 */
export const getProductMovements = asyncHandler(async (req, res) => {
  const result = await productService.getProductMovements(
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

export default {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  bulkCreateProducts,
  getProductStock,
  adjustProductStock,
  getProductMovements
};
