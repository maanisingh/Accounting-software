/**
 * Inventory Routes
 * API routes for inventory module - all 42 endpoints
 */

import express from 'express';
import * as productController from '../../controllers/productController.js';
import * as brandController from '../../controllers/brandController.js';
import * as categoryController from '../../controllers/categoryController.js';
import * as warehouseController from '../../controllers/warehouseController.js';
import * as stockController from '../../controllers/stockController.js';
import * as stockMovementController from '../../controllers/stockMovementController.js';

import * as productValidation from '../../validations/productValidation.js';
import * as brandValidation from '../../validations/brandValidation.js';
import * as categoryValidation from '../../validations/categoryValidation.js';
import * as warehouseValidation from '../../validations/warehouseValidation.js';
import * as stockValidation from '../../validations/stockValidation.js';
import * as stockMovementValidation from '../../validations/stockMovementValidation.js';

import { validateBody, validateQuery, validateParams } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all inventory routes
router.use(authenticate);

// ==================== PRODUCTS (10 endpoints) ====================

/**
 * @route   GET /api/v1/products/search
 * @desc    Search products (by name, sku, barcode)
 * @access  Private
 */
router.get(
  '/products/search',
  validateQuery(productValidation.searchProductsSchema),
  productController.searchProducts
);

/**
 * @route   POST /api/v1/products/bulk
 * @desc    Bulk create products
 * @access  Private
 */
router.post(
  '/products/bulk',
  validateBody(productValidation.bulkCreateProductsSchema),
  productController.bulkCreateProducts
);

/**
 * @route   GET /api/v1/products/:id/stock
 * @desc    Get stock levels across warehouses
 * @access  Private
 */
router.get(
  '/products/:id/stock',
  validateParams(productValidation.idParamSchema),
  productController.getProductStock
);

/**
 * @route   POST /api/v1/products/:id/adjust
 * @desc    Adjust stock (with reason, reference)
 * @access  Private
 */
router.post(
  '/products/:id/adjust',
  validateParams(productValidation.idParamSchema),
  validateBody(productValidation.adjustProductStockSchema),
  productController.adjustProductStock
);

/**
 * @route   GET /api/v1/products/:id/movement
 * @desc    Stock movement history
 * @access  Private
 */
router.get(
  '/products/:id/movement',
  validateParams(productValidation.idParamSchema),
  validateQuery(productValidation.getProductMovementsSchema),
  productController.getProductMovements
);

/**
 * @route   POST /api/v1/products
 * @desc    Create product
 * @access  Private
 */
router.post(
  '/products',
  validateBody(productValidation.createProductSchema),
  productController.createProduct
);

/**
 * @route   GET /api/v1/products
 * @desc    List products (pagination, search, filter by category/brand)
 * @access  Private
 */
router.get(
  '/products',
  validateQuery(productValidation.getProductsSchema),
  productController.getProducts
);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product details (include stock levels)
 * @access  Private
 */
router.get(
  '/products/:id',
  validateParams(productValidation.idParamSchema),
  productController.getProductById
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private
 */
router.put(
  '/products/:id',
  validateParams(productValidation.idParamSchema),
  validateBody(productValidation.updateProductSchema),
  productController.updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product (soft delete if has transactions)
 * @access  Private
 */
router.delete(
  '/products/:id',
  validateParams(productValidation.idParamSchema),
  productController.deleteProduct
);

// ==================== BRANDS (4 endpoints) ====================

/**
 * @route   POST /api/v1/brands
 * @desc    Create brand
 * @access  Private
 */
router.post(
  '/brands',
  validateBody(brandValidation.createBrandSchema),
  brandController.createBrand
);

/**
 * @route   GET /api/v1/brands
 * @desc    List all brands
 * @access  Private
 */
router.get(
  '/brands',
  validateQuery(brandValidation.getBrandsSchema),
  brandController.getBrands
);

/**
 * @route   PUT /api/v1/brands/:id
 * @desc    Update brand
 * @access  Private
 */
router.put(
  '/brands/:id',
  validateParams(brandValidation.idParamSchema),
  validateBody(brandValidation.updateBrandSchema),
  brandController.updateBrand
);

/**
 * @route   DELETE /api/v1/brands/:id
 * @desc    Delete brand (check if used in products)
 * @access  Private
 */
router.delete(
  '/brands/:id',
  validateParams(brandValidation.idParamSchema),
  brandController.deleteBrand
);

// ==================== CATEGORIES (4 endpoints) ====================

/**
 * @route   POST /api/v1/categories
 * @desc    Create category (name, parent, description)
 * @access  Private
 */
router.post(
  '/categories',
  validateBody(categoryValidation.createCategorySchema),
  categoryController.createCategory
);

/**
 * @route   GET /api/v1/categories
 * @desc    List categories (tree structure if parent-child)
 * @access  Private
 */
router.get(
  '/categories',
  validateQuery(categoryValidation.getCategoriesSchema),
  categoryController.getCategories
);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private
 */
router.put(
  '/categories/:id',
  validateParams(categoryValidation.idParamSchema),
  validateBody(categoryValidation.updateCategorySchema),
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category (check if used)
 * @access  Private
 */
router.delete(
  '/categories/:id',
  validateParams(categoryValidation.idParamSchema),
  categoryController.deleteCategory
);

// ==================== WAREHOUSES (6 endpoints) ====================

/**
 * @route   GET /api/v1/warehouses/:id/stock
 * @desc    Get all stock in warehouse
 * @access  Private
 */
router.get(
  '/warehouses/:id/stock',
  validateParams(warehouseValidation.idParamSchema),
  validateQuery(warehouseValidation.getWarehouseStockSchema),
  warehouseController.getWarehouseStock
);

/**
 * @route   POST /api/v1/warehouses
 * @desc    Create warehouse (name, location, contact)
 * @access  Private
 */
router.post(
  '/warehouses',
  validateBody(warehouseValidation.createWarehouseSchema),
  warehouseController.createWarehouse
);

/**
 * @route   GET /api/v1/warehouses
 * @desc    List warehouses
 * @access  Private
 */
router.get(
  '/warehouses',
  validateQuery(warehouseValidation.getWarehousesSchema),
  warehouseController.getWarehouses
);

/**
 * @route   GET /api/v1/warehouses/:id
 * @desc    Get warehouse details
 * @access  Private
 */
router.get(
  '/warehouses/:id',
  validateParams(warehouseValidation.idParamSchema),
  warehouseController.getWarehouseById
);

/**
 * @route   PUT /api/v1/warehouses/:id
 * @desc    Update warehouse
 * @access  Private
 */
router.put(
  '/warehouses/:id',
  validateParams(warehouseValidation.idParamSchema),
  validateBody(warehouseValidation.updateWarehouseSchema),
  warehouseController.updateWarehouse
);

/**
 * @route   DELETE /api/v1/warehouses/:id
 * @desc    Delete warehouse (check if has stock)
 * @access  Private
 */
router.delete(
  '/warehouses/:id',
  validateParams(warehouseValidation.idParamSchema),
  warehouseController.deleteWarehouse
);

// ==================== STOCK MANAGEMENT (10 endpoints) ====================

/**
 * @route   GET /api/v1/stock/low
 * @desc    Low stock products (below reorder level)
 * @access  Private
 */
router.get(
  '/stock/low',
  stockController.getLowStockProducts
);

/**
 * @route   GET /api/v1/stock/out
 * @desc    Out of stock products
 * @access  Private
 */
router.get(
  '/stock/out',
  stockController.getOutOfStockProducts
);

/**
 * @route   GET /api/v1/stock/movements
 * @desc    All stock movements (filterable)
 * @access  Private
 */
router.get(
  '/stock/movements',
  validateQuery(stockMovementValidation.getAllMovementsSchema),
  stockMovementController.getAllMovements
);

/**
 * @route   POST /api/v1/stock/reorder
 * @desc    Create reorder suggestion
 * @access  Private
 */
router.post(
  '/stock/reorder',
  stockController.createReorderSuggestion
);

/**
 * @route   GET /api/v1/stock/valuation
 * @desc    Stock valuation (qty * cost)
 * @access  Private
 */
router.get(
  '/stock/valuation',
  validateQuery(stockValidation.getStockValuationSchema),
  stockController.getStockValuation
);

/**
 * @route   GET /api/v1/stock/aging
 * @desc    Stock aging report
 * @access  Private
 */
router.get(
  '/stock/aging',
  validateQuery(stockValidation.getStockAgingSchema),
  stockController.getStockAging
);

/**
 * @route   POST /api/v1/stock/transfer
 * @desc    Transfer between warehouses (create movements)
 * @access  Private
 */
router.post(
  '/stock/transfer',
  validateBody(stockValidation.transferStockSchema),
  stockController.transferStock
);

/**
 * @route   POST /api/v1/stock/adjust
 * @desc    Adjust stock levels (with reason)
 * @access  Private
 */
router.post(
  '/stock/adjust',
  validateBody(stockValidation.adjustStockSchema),
  stockController.adjustStock
);

/**
 * @route   GET /api/v1/stock
 * @desc    List all stock (by product, warehouse)
 * @access  Private
 */
router.get(
  '/stock',
  validateQuery(stockValidation.getAllStockSchema),
  stockController.getAllStock
);

/**
 * @route   GET /api/v1/stock/:productId
 * @desc    Get product stock across warehouses
 * @access  Private
 */
router.get(
  '/stock/:productId',
  validateParams(stockValidation.productIdParamSchema),
  stockController.getProductStock
);

// ==================== STOCK MOVEMENTS (8 endpoints) ====================

/**
 * @route   GET /api/v1/movements/product/:id
 * @desc    Movements by product
 * @access  Private
 */
router.get(
  '/movements/product/:id',
  validateParams(stockMovementValidation.idParamSchema),
  validateQuery(stockMovementValidation.getAllMovementsSchema),
  stockMovementController.getMovementsByProduct
);

/**
 * @route   GET /api/v1/movements/warehouse/:id
 * @desc    Movements by warehouse
 * @access  Private
 */
router.get(
  '/movements/warehouse/:id',
  validateParams(stockMovementValidation.idParamSchema),
  validateQuery(stockMovementValidation.getAllMovementsSchema),
  stockMovementController.getMovementsByWarehouse
);

/**
 * @route   GET /api/v1/movements/type/:type
 * @desc    Movements by type (IN/OUT/TRANSFER/ADJUST)
 * @access  Private
 */
router.get(
  '/movements/type/:type',
  validateParams(stockMovementValidation.typeParamSchema),
  validateQuery(stockMovementValidation.getAllMovementsSchema),
  stockMovementController.getMovementsByType
);

/**
 * @route   GET /api/v1/movements/date-range
 * @desc    Movements by date range
 * @access  Private
 */
router.get(
  '/movements/date-range',
  validateQuery(stockMovementValidation.getMovementsByDateRangeSchema),
  stockMovementController.getMovementsByDateRange
);

/**
 * @route   POST /api/v1/movements/bulk
 * @desc    Bulk movement creation
 * @access  Private
 */
router.post(
  '/movements/bulk',
  validateBody(stockMovementValidation.bulkCreateMovementsSchema),
  stockMovementController.bulkCreateMovements
);

/**
 * @route   GET /api/v1/movements
 * @desc    List all movements (pagination)
 * @access  Private
 */
router.get(
  '/movements',
  validateQuery(stockMovementValidation.getAllMovementsSchema),
  stockMovementController.getAllMovements
);

/**
 * @route   GET /api/v1/movements/:id
 * @desc    Get movement details
 * @access  Private
 */
router.get(
  '/movements/:id',
  validateParams(stockMovementValidation.idParamSchema),
  stockMovementController.getMovementById
);

/**
 * @route   POST /api/v1/movements
 * @desc    Create movement (manual)
 * @access  Private
 */
router.post(
  '/movements',
  validateBody(stockMovementValidation.createMovementSchema),
  stockMovementController.createMovement
);

export default router;
