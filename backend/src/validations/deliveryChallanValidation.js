/**
 * Delivery Challan Validation Schemas
 * Joi validation for delivery challan management endpoints
 */

import Joi from 'joi';
import { DOCUMENT_STATUS } from '../config/constants.js';

/**
 * Challan item schema
 */
const challanItemSchema = Joi.object({
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
    .default(0),

  warehouseId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Invalid warehouse ID format'
    })
});

/**
 * Create delivery challan validation schema
 */
export const createDeliveryChallanSchema = Joi.object({
  customerId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid customer ID format',
      'any.required': 'Customer ID is required'
    }),

  salesOrderId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Invalid sales order ID format'
    }),

  challanDate: Joi.date()
    .iso()
    .optional()
    .default(() => new Date()),

  shippingAddress: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('', null),

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

  transportMode: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('', null),

  items: Joi.array()
    .items(challanItemSchema)
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
 * Get delivery challans list validation schema
 */
export const getDeliveryChallansSchema = Joi.object({
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

  salesOrderId: Joi.string()
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
    .valid('challanNumber', 'challanDate', 'total', 'createdAt')
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
  createDeliveryChallanSchema,
  getDeliveryChallansSchema,
  idParamSchema
};
