/**
 * Warehouse Validation Schemas
 * Joi validation for warehouse management endpoints
 */

import Joi from 'joi';

export const createWarehouseSchema = Joi.object({
  code: Joi.string()
    .trim()
    .min(2)
    .max(20)
    .required()
    .messages({
      'string.min': 'Warehouse code must be at least 2 characters',
      'string.max': 'Warehouse code must not exceed 20 characters',
      'any.required': 'Warehouse code is required'
    }),

  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'Warehouse name must be at least 3 characters',
      'string.max': 'Warehouse name must not exceed 100 characters',
      'any.required': 'Warehouse name is required'
    }),

  address: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('', null),

  city: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('', null),

  state: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('', null),

  country: Joi.string()
    .trim()
    .max(50)
    .optional()
    .default('India'),

  postalCode: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow('', null),

  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional()
    .allow('', null),

  email: Joi.string()
    .email()
    .optional()
    .allow('', null),

  isDefault: Joi.boolean().optional().default(false)
});

export const updateWarehouseSchema = Joi.object({
  code: Joi.string()
    .trim()
    .min(2)
    .max(20)
    .optional(),

  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .optional(),

  address: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('', null),

  city: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('', null),

  state: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('', null),

  country: Joi.string()
    .trim()
    .max(50)
    .optional(),

  postalCode: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow('', null),

  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional()
    .allow('', null),

  email: Joi.string()
    .email()
    .optional()
    .allow('', null),

  isDefault: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const getWarehousesSchema = Joi.object({
  isActive: Joi.boolean().optional(),
  search: Joi.string().trim().optional().allow('')
});

export const getWarehouseStockSchema = Joi.object({
  showZero: Joi.boolean().optional().default(false),
  search: Joi.string().trim().optional().allow('')
});

export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export default {
  createWarehouseSchema,
  updateWarehouseSchema,
  getWarehousesSchema,
  getWarehouseStockSchema,
  idParamSchema
};
