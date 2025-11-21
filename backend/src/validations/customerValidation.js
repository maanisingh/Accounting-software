/**
 * Customer Validation Schemas
 * Joi validation for customer management endpoints
 */

import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.min': 'Customer name must be at least 2 characters',
      'string.max': 'Customer name must not exceed 200 characters',
      'any.required': 'Customer name is required'
    }),

  email: Joi.string()
    .trim()
    .email()
    .optional()
    .allow('', null),

  phone: Joi.string()
    .trim()
    .min(10)
    .max(20)
    .optional()
    .allow('', null),

  address: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('', null),

  city: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  state: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  country: Joi.string()
    .trim()
    .max(100)
    .optional()
    .default('India'),

  postalCode: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow('', null),

  taxNumber: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('', null),

  creditLimit: Joi.number()
    .min(0)
    .optional()
    .default(0),

  creditDays: Joi.number()
    .integer()
    .min(0)
    .max(365)
    .optional()
    .default(30),

  openingBalance: Joi.number()
    .optional()
    .default(0),

  notes: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('', null)
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .optional(),

  email: Joi.string()
    .trim()
    .email()
    .optional()
    .allow('', null),

  phone: Joi.string()
    .trim()
    .min(10)
    .max(20)
    .optional()
    .allow('', null),

  address: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('', null),

  city: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  state: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  country: Joi.string()
    .trim()
    .max(100)
    .optional(),

  postalCode: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow('', null),

  taxNumber: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('', null),

  creditLimit: Joi.number()
    .min(0)
    .optional(),

  creditDays: Joi.number()
    .integer()
    .min(0)
    .max(365)
    .optional(),

  openingBalance: Joi.number()
    .optional(),

  isActive: Joi.boolean()
    .optional(),

  notes: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('', null)
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const getCustomersSchema = Joi.object({
  isActive: Joi.boolean().optional(),
  search: Joi.string().trim().optional().allow(''),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(50)
});

export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export default {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomersSchema,
  idParamSchema
};
