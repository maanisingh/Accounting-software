/**
 * Stock Movement Validation Schemas
 * Joi validation for stock movement tracking endpoints
 */

import Joi from 'joi';
import { STOCK_MOVEMENT_TYPES } from '../config/constants.js';

export const getAllMovementsSchema = Joi.object({
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

  movementType: Joi.string()
    .valid(...Object.values(STOCK_MOVEMENT_TYPES))
    .optional(),

  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  search: Joi.string().trim().optional().allow('')
});

export const createMovementSchema = Joi.object({
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

  movementType: Joi.string()
    .valid(...Object.values(STOCK_MOVEMENT_TYPES))
    .optional()
    .default(STOCK_MOVEMENT_TYPES.ADJUSTMENT),

  quantity: Joi.number()
    .integer()
    .required()
    .messages({
      'any.required': 'Quantity is required'
    }),

  notes: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .optional()
    .allow('', null),

  reference: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null)
});

export const getMovementsByDateRangeSchema = Joi.object({
  startDate: Joi.date()
    .iso()
    .required()
    .messages({
      'any.required': 'Start date is required'
    }),

  endDate: Joi.date()
    .iso()
    .required()
    .messages({
      'any.required': 'End date is required'
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
});

export const bulkCreateMovementsSchema = Joi.object({
  movements: Joi.array()
    .items(createMovementSchema)
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one movement is required',
      'array.max': 'Maximum 100 movements can be created at once',
      'any.required': 'Movements array is required'
    })
});

export const getMovementStatsSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  warehouseId: Joi.string().uuid().optional(),
  productId: Joi.string().uuid().optional()
});

export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export const typeParamSchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(STOCK_MOVEMENT_TYPES))
    .required()
});

export default {
  getAllMovementsSchema,
  createMovementSchema,
  getMovementsByDateRangeSchema,
  bulkCreateMovementsSchema,
  getMovementStatsSchema,
  idParamSchema,
  typeParamSchema
};
