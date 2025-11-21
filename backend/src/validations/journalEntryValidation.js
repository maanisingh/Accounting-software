/**
 * Journal Entry Validation Schemas
 * Joi validation for journal entry management endpoints
 */

import Joi from 'joi';
import { TRANSACTION_TYPES } from '../config/constants.js';

/**
 * Journal line schema
 */
const journalLineSchema = Joi.object({
  accountId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid account ID format',
      'any.required': 'Account ID is required'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('', null),

  transactionType: Joi.string()
    .valid(TRANSACTION_TYPES.DEBIT, TRANSACTION_TYPES.CREDIT)
    .required()
    .messages({
      'any.only': 'Transaction type must be DEBIT or CREDIT',
      'any.required': 'Transaction type is required'
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
 * Create journal entry validation
 */
export const createJournalEntrySchema = Joi.object({
  entryDate: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.max': 'Entry date cannot be in the future',
      'any.required': 'Entry date is required'
    }),

  description: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 500 characters',
      'any.required': 'Description is required'
    }),

  entryType: Joi.string()
    .valid('MANUAL', 'SYSTEM', 'ADJUSTMENT', 'PURCHASE', 'SALE', 'PAYMENT', 'RECEIPT')
    .optional()
    .default('MANUAL'),

  referenceType: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('', null),

  referenceId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Invalid reference ID format'
    }),

  referenceNumber: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('', null),

  lines: Joi.array()
    .items(journalLineSchema)
    .min(2)
    .required()
    .messages({
      'array.min': 'At least 2 journal lines are required',
      'any.required': 'Journal lines are required'
    })
});

/**
 * Update journal entry validation
 */
export const updateJournalEntrySchema = Joi.object({
  entryDate: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.max': 'Entry date cannot be in the future'
    }),

  description: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .optional()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 500 characters'
    }),

  lines: Joi.array()
    .items(journalLineSchema)
    .min(2)
    .optional()
    .messages({
      'array.min': 'At least 2 journal lines are required'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Get journal entries filters validation
 */
export const getJournalEntriesSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20),

  isPosted: Joi.boolean()
    .optional(),

  entryType: Joi.string()
    .valid('MANUAL', 'SYSTEM', 'ADJUSTMENT', 'PURCHASE', 'SALE', 'PAYMENT', 'RECEIPT')
    .optional(),

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

  search: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
});

/**
 * Get entries by account filters validation
 */
export const getEntriesByAccountSchema = Joi.object({
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

  isPosted: Joi.boolean()
    .optional()
});

/**
 * Journal entry ID parameter validation
 */
export const journalEntryIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid journal entry ID format',
      'any.required': 'Journal entry ID is required'
    })
});

/**
 * Account ID parameter validation
 */
export const accountIdParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid account ID format',
      'any.required': 'Account ID is required'
    })
});
