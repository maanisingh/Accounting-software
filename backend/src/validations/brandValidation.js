/**
 * Brand Validation Schemas
 * Joi validation for brand management endpoints
 */

import Joi from 'joi';

export const createBrandSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Brand name must be at least 2 characters',
      'string.max': 'Brand name must not exceed 100 characters',
      'any.required': 'Brand name is required'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('', null),

  logo: Joi.string()
    .uri()
    .optional()
    .allow('', null)
});

export const updateBrandSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('', null),

  logo: Joi.string()
    .uri()
    .optional()
    .allow('', null),

  isActive: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const getBrandsSchema = Joi.object({
  isActive: Joi.boolean().optional(),
  search: Joi.string().trim().optional().allow('')
});

export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export default {
  createBrandSchema,
  updateBrandSchema,
  getBrandsSchema,
  idParamSchema
};
