/**
 * Goods Receipt Validation Schemas
 * Joi validation for goods receipt management endpoints
 */

import Joi from 'joi';
import { DOCUMENT_STATUS } from '../config/constants.js';

/**
 * Receipt item schema
 */
const receiptItemSchema = Joi.object({
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

  orderedQty: Joi.number()
    .min(0)
    .precision(3)
    .optional()
    .default(0),

  receivedQty: Joi.number()
    .positive()
    .precision(3)
    .required()
    .messages({
      'number.positive': 'Received quantity must be positive',
      'any.required': 'Received quantity is required'
    }),

  acceptedQty: Joi.number()
    .min(0)
    .precision(3)
    .required()
    .messages({
      'number.min': 'Accepted quantity cannot be negative',
      'any.required': 'Accepted quantity is required'
    }),

  rejectedQty: Joi.number()
    .min(0)
    .precision(3)
    .optional()
    .default(0),

  damagedQty: Joi.number()
    .min(0)
    .precision(3)
    .optional()
    .default(0),

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
 * Create goods receipt validation schema
 */
export const createGoodsReceiptSchema = Joi.object({
  vendorId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid vendor ID format',
      'any.required': 'Vendor ID is required'
    }),

  warehouseId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid warehouse ID format',
      'any.required': 'Warehouse ID is required'
    }),

  receiptDate: Joi.date()
    .iso()
    .optional()
    .default(() => new Date()),

  purchaseOrderId: Joi.string()
    .uuid()
    .optional()
    .allow(null),

  vehicleNo: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('', null),

  driverName: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  driverPhone: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow('', null),

  items: Joi.array()
    .items(receiptItemSchema)
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
    .allow('', null)
});

/**
 * Update goods receipt validation schema
 */
export const updateGoodsReceiptSchema = Joi.object({
  vehicleNo: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('', null),

  driverName: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  driverPhone: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow('', null),

  notes: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .allow('', null)
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Get goods receipts list validation schema
 */
export const getGoodsReceiptsSchema = Joi.object({
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

  warehouseId: Joi.string()
    .uuid()
    .optional(),

  purchaseOrderId: Joi.string()
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
    .valid('receiptNumber', 'receiptDate', 'total', 'createdAt')
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
  createGoodsReceiptSchema,
  updateGoodsReceiptSchema,
  getGoodsReceiptsSchema,
  idParamSchema
};
