/**
 * Category Validation Schemas
 * Joi validation for category management endpoints
 */

import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Category name must be at least 2 characters',
      'string.max': 'Category name must not exceed 100 characters',
      'any.required': 'Category name is required'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('', null),

  parentId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Invalid parent category ID format'
    })
});

export const updateCategorySchema = Joi.object({
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

  parentId: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  isActive: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const getCategoriesSchema = Joi.object({
  isActive: Joi.boolean().optional(),
  search: Joi.string().trim().optional().allow(''),
  flat: Joi.boolean().optional()
});

export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export default {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesSchema,
  idParamSchema
};
