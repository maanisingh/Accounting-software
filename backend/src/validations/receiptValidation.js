/**
 * Receipt Validation Schemas
 * Joi validation for receipt management endpoints
 */

import Joi from 'joi';
import { PAYMENT_METHODS } from '../config/constants.js';

/**
 * Invoice allocation schema
 */
const invoiceAllocationSchema = Joi.object({
  invoiceId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid invoice ID format',
      'any.required': 'Invoice ID is required'
    }),

  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    })
});

/**
 * Create receipt validation
 */
export const createReceiptSchema = Joi.object({
  customerId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid customer ID format',
      'any.required': 'Customer ID is required'
    }),

  invoiceId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Invalid invoice ID format'
    }),

  receiptDate: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.max': 'Receipt date cannot be in the future',
      'any.required': 'Receipt date is required'
    }),

  paymentMethod: Joi.string()
    .valid(...Object.values(PAYMENT_METHODS))
    .required()
    .messages({
      'any.only': 'Invalid payment method',
      'any.required': 'Payment method is required'
    }),

  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),

  accountId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid account ID format (bank/cash account)',
      'any.required': 'Receipt account ID is required'
    }),

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
    .max(1000)
    .optional()
    .allow('', null),

  invoices: Joi.array()
    .items(invoiceAllocationSchema)
    .optional()
    .messages({
      'array.base': 'Invoices must be an array'
    })
});

/**
 * Get receipts filters validation
 */
export const getReceiptsSchema = Joi.object({
  customerId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Invalid customer ID format'
    }),

  startDate: Joi.date()
    .iso()
    .optional(),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.min': 'End date must be after start date'
    }),

  paymentMethod: Joi.string()
    .valid(...Object.values(PAYMENT_METHODS))
    .optional()
    .messages({
      'any.only': 'Invalid payment method'
    }),

  search: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
});

/**
 * Receipt ID parameter validation
 */
export const receiptIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid receipt ID format',
      'any.required': 'Receipt ID is required'
    })
});

/**
 * Customer ID parameter validation
 */
export const customerIdParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid customer ID format',
      'any.required': 'Customer ID is required'
    })
});

/**
 * Get pending invoices filters validation
 */
export const getPendingInvoicesSchema = Joi.object({
  customerId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Invalid customer ID format'
    })
});
