/**
 * Purchase Quotation Validation Schemas
 * Joi validation for purchase quotation management endpoints
 */

import Joi from 'joi';
import { DOCUMENT_STATUS } from '../config/constants.js';

/**
 * Quotation item schema
 */
const quotationItemSchema = Joi.object({
  productId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid product ID format',
      'any.required': 'Product ID is required'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('', null),

  quantity: Joi.number()
    .positive()
    .precision(3)
    .required()
    .messages({
      'number.positive': 'Quantity must be positive',
      'any.required': 'Quantity is required'
    }),

  unitPrice: Joi.number()
    .min(0)
    .precision(2)
    .required()
    .messages({
      'number.min': 'Unit price cannot be negative',
      'any.required': 'Unit price is required'
    }),

  taxRate: Joi.number()
    .min(0)
    .max(100)
    .precision(2)
    .optional()
    .default(0),

  discountAmount: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .default(0)
});

/**
 * Create purchase quotation validation schema
 */
export const createPurchaseQuotationSchema = Joi.object({
  vendorId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid vendor ID format',
      'any.required': 'Vendor ID is required'
    }),

  quotationDate: Joi.date()
    .iso()
    .optional()
    .default(() => new Date()),

  validTill: Joi.date()
    .iso()
    .greater(Joi.ref('quotationDate'))
    .optional()
    .allow(null)
    .messages({
      'date.greater': 'Valid till date must be after quotation date'
    }),

  referenceNo: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  items: Joi.array()
    .items(quotationItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'any.required': 'Items are required'
    }),

  notes: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .allow('', null),

  terms: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .allow('', null)
});

/**
 * Update purchase quotation validation schema
 */
export const updatePurchaseQuotationSchema = Joi.object({
  vendorId: Joi.string()
    .uuid()
    .optional(),

  quotationDate: Joi.date()
    .iso()
    .optional(),

  validTill: Joi.date()
    .iso()
    .optional()
    .allow(null),

  referenceNo: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  items: Joi.array()
    .items(quotationItemSchema)
    .min(1)
    .optional(),

  notes: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .allow('', null),

  terms: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .allow('', null),

  status: Joi.string()
    .valid(...Object.values(DOCUMENT_STATUS))
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Get purchase quotations list validation schema
 */
export const getPurchaseQuotationsSchema = Joi.object({
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

  vendorId: Joi.string()
    .uuid()
    .optional(),

  status: Joi.string()
    .valid(...Object.values(DOCUMENT_STATUS))
    .optional(),

  startDate: Joi.date()
    .iso()
    .optional(),

  endDate: Joi.date()
    .iso()
    .optional(),

  sortBy: Joi.string()
    .valid('quotationNumber', 'quotationDate', 'total', 'createdAt')
    .default('createdAt'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
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
  createPurchaseQuotationSchema,
  updatePurchaseQuotationSchema,
  getPurchaseQuotationsSchema,
  idParamSchema
};
