/**
 * Payment Validation Schemas
 * Joi validation for payment management endpoints
 */

import Joi from 'joi';
import { PAYMENT_METHODS } from '../config/constants.js';

/**
 * Bill allocation schema
 */
const billAllocationSchema = Joi.object({
  billId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid bill ID format',
      'any.required': 'Bill ID is required'
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
 * Create payment validation
 */
export const createPaymentSchema = Joi.object({
  vendorId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid vendor ID format',
      'any.required': 'Vendor ID is required'
    }),

  billId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Invalid bill ID format'
    }),

  paymentDate: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.max': 'Payment date cannot be in the future',
      'any.required': 'Payment date is required'
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
      'any.required': 'Payment account ID is required'
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

  bills: Joi.array()
    .items(billAllocationSchema)
    .optional()
    .messages({
      'array.base': 'Bills must be an array'
    })
});

/**
 * Get payments filters validation
 */
export const getPaymentsSchema = Joi.object({
  vendorId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Invalid vendor ID format'
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
 * Payment ID parameter validation
 */
export const paymentIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid payment ID format',
      'any.required': 'Payment ID is required'
    })
});

/**
 * Vendor ID parameter validation
 */
export const vendorIdParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid vendor ID format',
      'any.required': 'Vendor ID is required'
    })
});

/**
 * Get pending bills filters validation
 */
export const getPendingBillsSchema = Joi.object({
  vendorId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Invalid vendor ID format'
    })
});
