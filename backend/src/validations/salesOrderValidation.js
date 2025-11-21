/**
 * Sales Order Validation Schemas
 * Joi validation for sales order management endpoints
 */

import Joi from 'joi';
import { DOCUMENT_STATUS } from '../config/constants.js';

/**
 * Order item schema
 */
const orderItemSchema = Joi.object({
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
 * Create sales order validation schema
 */
export const createSalesOrderSchema = Joi.object({
  customerId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid customer ID format',
      'any.required': 'Customer ID is required'
    }),

  orderDate: Joi.date()
    .iso()
    .optional()
    .default(() => new Date()),

  deliveryDate: Joi.date()
    .iso()
    .greater(Joi.ref('orderDate'))
    .optional()
    .allow(null)
    .messages({
      'date.greater': 'Delivery date must be after order date'
    }),

  quotationId: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  shippingAddress: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('', null),

  items: Joi.array()
    .items(orderItemSchema)
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
 * Update sales order validation schema
 */
export const updateSalesOrderSchema = Joi.object({
  customerId: Joi.string()
    .uuid()
    .optional(),

  orderDate: Joi.date()
    .iso()
    .optional(),

  deliveryDate: Joi.date()
    .iso()
    .optional()
    .allow(null),

  shippingAddress: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('', null),

  items: Joi.array()
    .items(orderItemSchema)
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
 * Convert to invoice validation schema
 */
export const convertToInvoiceSchema = Joi.object({
  invoiceDate: Joi.date()
    .iso()
    .optional()
    .default(() => new Date()),

  dueDate: Joi.date()
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
    .allow('', null),

  allowPartial: Joi.boolean()
    .optional()
    .default(false)
});

/**
 * Get sales orders list validation schema
 */
export const getSalesOrdersSchema = Joi.object({
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
    .valid('orderNumber', 'orderDate', 'total', 'createdAt')
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
  createSalesOrderSchema,
  updateSalesOrderSchema,
  convertToInvoiceSchema,
  getSalesOrdersSchema,
  idParamSchema
};
