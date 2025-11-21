/**
 * Sales Quotation Validation Schemas
 * Joi validation for sales quotation management endpoints
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
 * Create sales quotation validation schema
 */
export const createSalesQuotationSchema = Joi.object({
  customerId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid customer ID format',
      'any.required': 'Customer ID is required'
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

  shippingAddress: Joi.string()
    .trim()
    .max(1000)
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
 * Update sales quotation validation schema
 */
export const updateSalesQuotationSchema = Joi.object({
  customerId: Joi.string()
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

  shippingAddress: Joi.string()
    .trim()
    .max(1000)
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
 * Convert to sales order validation schema
 */
export const convertToSalesOrderSchema = Joi.object({
  orderDate: Joi.date()
    .iso()
    .optional()
    .default(() => new Date()),

  deliveryDate: Joi.date()
    .iso()
    .optional()
    .allow(null),

  shippingAddress: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('', null),

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
 * Get sales quotations list validation schema
 */
export const getSalesQuotationsSchema = Joi.object({
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

  customerId: Joi.string()
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
  createSalesQuotationSchema,
  updateSalesQuotationSchema,
  convertToSalesOrderSchema,
  getSalesQuotationsSchema,
  idParamSchema
};
