/**
 * Account Validation Schemas
 * Joi validation for account management endpoints
 */

import Joi from 'joi';
import { ACCOUNT_TYPES, TRANSACTION_TYPES } from '../config/constants.js';

/**
 * Create account validation
 */
export const createAccountSchema = Joi.object({
  accountName: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Account name must be at least 3 characters',
      'string.max': 'Account name cannot exceed 200 characters',
      'any.required': 'Account name is required'
    }),

  accountNumber: Joi.string()
    .trim()
    .pattern(/^[0-9]+$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Account number must contain only digits'
    }),

  accountType: Joi.string()
    .valid(...Object.values(ACCOUNT_TYPES))
    .required()
    .messages({
      'any.only': 'Invalid account type',
      'any.required': 'Account type is required'
    }),

  parentId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Invalid parent account ID format'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('', null),

  currency: Joi.string()
    .trim()
    .length(3)
    .uppercase()
    .optional()
    .default('INR')
    .messages({
      'string.length': 'Currency must be 3 characters (e.g., INR, USD)'
    }),

  openingBalance: Joi.number()
    .precision(2)
    .default(0)
    .messages({
      'number.base': 'Opening balance must be a number'
    }),

  openingBalanceType: Joi.string()
    .valid(TRANSACTION_TYPES.DEBIT, TRANSACTION_TYPES.CREDIT)
    .required()
    .messages({
      'any.only': 'Opening balance type must be DEBIT or CREDIT',
      'any.required': 'Opening balance type is required'
    })
});

/**
 * Update account validation
 */
export const updateAccountSchema = Joi.object({
  accountName: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Account name must be at least 3 characters',
      'string.max': 'Account name cannot exceed 200 characters'
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
      'string.guid': 'Invalid parent account ID format'
    }),

  isActive: Joi.boolean()
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Get accounts filters validation
 */
export const getAccountsSchema = Joi.object({
  accountType: Joi.string()
    .valid(...Object.values(ACCOUNT_TYPES))
    .optional()
    .messages({
      'any.only': 'Invalid account type'
    }),

  isActive: Joi.boolean()
    .optional(),

  parentId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Invalid parent account ID format'
    }),

  search: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
});

/**
 * Toggle account status validation
 */
export const toggleAccountStatusSchema = Joi.object({
  isActive: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Active status is required'
    })
});

/**
 * Account ID parameter validation
 */
export const accountIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid account ID format',
      'any.required': 'Account ID is required'
    })
});
