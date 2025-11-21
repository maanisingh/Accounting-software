/**
 * Product Validation Schemas
 * Joi validation for product management endpoints
 */

import Joi from 'joi';
import { PRODUCT_TYPES } from '../config/constants.js';

/**
 * Create product validation schema
 */
export const createProductSchema = Joi.object({
  sku: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'SKU is required',
      'string.min': 'SKU must be at least 1 character',
      'string.max': 'SKU must not exceed 50 characters',
      'any.required': 'SKU is required'
    }),

  name: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Product name must be at least 3 characters',
      'string.max': 'Product name must not exceed 200 characters',
      'any.required': 'Product name is required'
    }),

  description: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .allow('', null),

  type: Joi.string()
    .valid(...Object.values(PRODUCT_TYPES))
    .optional()
    .default(PRODUCT_TYPES.GOODS),

  categoryId: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  brandId: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  barcode: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  unit: Joi.string()
    .trim()
    .required()
    .messages({
      'any.required': 'Unit is required'
    }),

  purchasePrice: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .default(0),

  sellingPrice: Joi.number()
    .min(0)
    .precision(2)
    .required()
    .messages({
      'any.required': 'Selling price is required',
      'number.min': 'Selling price must be positive'
    }),

  mrp: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .default(0),

  taxRate: Joi.number()
    .min(0)
    .max(100)
    .precision(2)
    .optional()
    .default(0),

  hsnCode: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow('', null),

  sacCode: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow('', null),

  reorderLevel: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0),

  minStockLevel: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0),

  maxStockLevel: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0)
});

/**
 * Update product validation schema
 */
export const updateProductSchema = Joi.object({
  sku: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional(),

  name: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .optional(),

  description: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .allow('', null),

  type: Joi.string()
    .valid(...Object.values(PRODUCT_TYPES))
    .optional(),

  categoryId: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  brandId: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  barcode: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  unit: Joi.string()
    .trim()
    .optional(),

  purchasePrice: Joi.number()
    .min(0)
    .precision(2)
    .optional(),

  sellingPrice: Joi.number()
    .min(0)
    .precision(2)
    .optional(),

  mrp: Joi.number()
    .min(0)
    .precision(2)
    .optional(),

  taxRate: Joi.number()
    .min(0)
    .max(100)
    .precision(2)
    .optional(),

  hsnCode: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow('', null),

  sacCode: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow('', null),

  reorderLevel: Joi.number()
    .integer()
    .min(0)
    .optional(),

  minStockLevel: Joi.number()
    .integer()
    .min(0)
    .optional(),

  maxStockLevel: Joi.number()
    .integer()
    .min(0)
    .optional(),

  isActive: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Get products list validation schema
 */
export const getProductsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),

  search: Joi.string()
    .trim()
    .optional()
    .allow(''),

  categoryId: Joi.string()
    .uuid()
    .optional(),

  brandId: Joi.string()
    .uuid()
    .optional(),

  type: Joi.string()
    .valid(...Object.values(PRODUCT_TYPES))
    .optional(),

  isActive: Joi.boolean().optional(),

  sortBy: Joi.string()
    .valid('name', 'sku', 'sellingPrice', 'createdAt')
    .default('createdAt'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
});

/**
 * Search products validation schema
 */
export const searchProductsSchema = Joi.object({
  q: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Search query is required',
      'any.required': 'Search query is required'
    })
});

/**
 * Bulk create products validation schema
 */
export const bulkCreateProductsSchema = Joi.object({
  products: Joi.array()
    .items(createProductSchema)
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one product is required',
      'array.max': 'Maximum 100 products can be created at once',
      'any.required': 'Products array is required'
    })
});

/**
 * Adjust product stock validation schema
 */
export const adjustProductStockSchema = Joi.object({
  warehouseId: Joi.string()
    .uuid()
    .required()
    .messages({
      'any.required': 'Warehouse ID is required'
    }),

  quantity: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Quantity is required'
    }),

  reason: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Reason must be at least 10 characters',
      'string.max': 'Reason must not exceed 500 characters',
      'any.required': 'Reason is required'
    }),

  reference: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null)
});

/**
 * Get product movements validation schema
 */
export const getProductMovementsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),

  warehouseId: Joi.string()
    .uuid()
    .optional(),

  movementType: Joi.string()
    .valid('PURCHASE', 'SALE', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'OPENING_STOCK')
    .optional(),

  startDate: Joi.date()
    .iso()
    .optional(),

  endDate: Joi.date()
    .iso()
    .optional()
});

/**
 * ID parameter validation schema
 */
export const idParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid ID format',
      'any.required': 'ID is required'
    })
});

export default {
  createProductSchema,
  updateProductSchema,
  getProductsSchema,
  searchProductsSchema,
  bulkCreateProductsSchema,
  adjustProductStockSchema,
  getProductMovementsSchema,
  idParamSchema
};
