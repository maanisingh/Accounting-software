/**
 * Stock Validation Schemas
 * Joi validation for stock management endpoints
 */

import Joi from 'joi';
import { STOCK_MOVEMENT_TYPES } from '../config/constants.js';

export const getAllStockSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),

  productId: Joi.string().uuid().optional(),
  warehouseId: Joi.string().uuid().optional(),
  showZero: Joi.boolean().optional().default(false),
  search: Joi.string().trim().optional().allow('')
});

export const transferStockSchema = Joi.object({
  productId: Joi.string()
    .uuid()
    .required()
    .messages({
      'any.required': 'Product ID is required'
    }),

  fromWarehouseId: Joi.string()
    .uuid()
    .required()
    .messages({
      'any.required': 'Source warehouse ID is required'
    }),

  toWarehouseId: Joi.string()
    .uuid()
    .required()
    .messages({
      'any.required': 'Destination warehouse ID is required'
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required'
    }),

  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('', null),

  reference: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null)
});

export const adjustStockSchema = Joi.object({
  productId: Joi.string()
    .uuid()
    .required()
    .messages({
      'any.required': 'Product ID is required'
    }),

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

export const getStockValuationSchema = Joi.object({
  warehouseId: Joi.string().uuid().optional(),
  categoryId: Joi.string().uuid().optional()
});

export const getStockAgingSchema = Joi.object({
  warehouseId: Joi.string().uuid().optional()
});

export const productIdParamSchema = Joi.object({
  productId: Joi.string().uuid().required()
});

export default {
  getAllStockSchema,
  transferStockSchema,
  adjustStockSchema,
  getStockValuationSchema,
  getStockAgingSchema,
  productIdParamSchema
};
