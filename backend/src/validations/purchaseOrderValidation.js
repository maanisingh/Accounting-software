/**
 * Purchase Order Validation Schemas
 * Joi validation for purchase order management endpoints
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
 * Create purchase order validation schema
 */
export const createPurchaseOrderSchema = Joi.object({
  vendorId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid vendor ID format',
      'any.required': 'Vendor ID is required'
    }),

  orderDate: Joi.date()
    .iso()
    .optional()
    .default(() => new Date()),

  expectedDeliveryDate: Joi.date()
    .iso()
    .greater(Joi.ref('orderDate'))
    .optional()
    .allow(null)
    .messages({
      'date.greater': 'Expected delivery date must be after order date'
    }),

  quotationId: Joi.string()
    .uuid()
    .optional()
    .allow(null),

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
 * Update purchase order validation schema
 */
export const updatePurchaseOrderSchema = Joi.object({
  vendorId: Joi.string()
    .uuid()
    .optional(),

  orderDate: Joi.date()
    .iso()
    .optional(),

  expectedDeliveryDate: Joi.date()
    .iso()
    .optional()
    .allow(null),

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
 * Create goods receipt from PO validation schema
 */
export const createGoodsReceiptFromPOSchema = Joi.object({
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
    .items(Joi.object({
      productId: Joi.string().uuid().required(),
      orderedQty: Joi.number().positive().precision(3).required(),
      receivedQty: Joi.number().positive().precision(3).required(),
      acceptedQty: Joi.number().min(0).precision(3).required(),
      rejectedQty: Joi.number().min(0).precision(3).optional().default(0),
      damagedQty: Joi.number().min(0).precision(3).optional().default(0),
      unitPrice: Joi.number().min(0).precision(2).required(),
      taxRate: Joi.number().min(0).max(100).precision(2).optional().default(0),
      discountAmount: Joi.number().min(0).precision(2).optional().default(0),
      description: Joi.string().trim().max(500).optional().allow('', null)
    }))
    .min(1)
    .required(),

  notes: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .allow('', null)
});

/**
 * Get purchase orders list validation schema
 */
export const getPurchaseOrdersSchema = Joi.object({
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
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  createGoodsReceiptFromPOSchema,
  getPurchaseOrdersSchema,
  idParamSchema
};
