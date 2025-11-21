/**
 * Bill Validation Schemas
 * Joi validation for bill management endpoints
 */

import Joi from 'joi';
import { DOCUMENT_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../config/constants.js';

/**
 * Bill item schema
 */
const billItemSchema = Joi.object({
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
 * Create bill validation schema
 */
export const createBillSchema = Joi.object({
  vendorId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid vendor ID format',
      'any.required': 'Vendor ID is required'
    }),

  billDate: Joi.date()
    .iso()
    .optional()
    .default(() => new Date()),

  purchaseOrderId: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  items: Joi.array()
    .items(billItemSchema)
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
 * Update bill validation schema
 */
export const updateBillSchema = Joi.object({
  billDate: Joi.date()
    .iso()
    .optional(),

  items: Joi.array()
    .items(billItemSchema)
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
    .allow('', null)
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Record payment validation schema
 */
export const recordPaymentSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Payment amount must be positive',
      'any.required': 'Payment amount is required'
    }),

  paymentMethod: Joi.string()
    .valid(...Object.values(PAYMENT_METHODS))
    .required()
    .messages({
      'any.required': 'Payment method is required',
      'any.only': 'Invalid payment method'
    }),

  paymentDate: Joi.date()
    .iso()
    .optional()
    .default(() => new Date()),

  referenceNo: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  bankName: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  chequeNo: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('', null),

  chequeDate: Joi.date()
    .iso()
    .optional()
    .allow(null),

  upiId: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('', null)
});

/**
 * Get bills list validation schema
 */
export const getBillsSchema = Joi.object({
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

  paymentStatus: Joi.string()
    .valid(...Object.values(PAYMENT_STATUS))
    .optional(),

  startDate: Joi.date()
    .iso()
    .optional(),

  endDate: Joi.date()
    .iso()
    .optional(),

  sortBy: Joi.string()
    .valid('billNumber', 'billDate', 'dueDate', 'total', 'createdAt')
    .default('createdAt'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
});

/**
 * Get pending bills validation schema
 */
export const getPendingBillsSchema = Joi.object({
  vendorId: Joi.string()
    .uuid()
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
  createBillSchema,
  updateBillSchema,
  recordPaymentSchema,
  getBillsSchema,
  getPendingBillsSchema,
  idParamSchema
};
