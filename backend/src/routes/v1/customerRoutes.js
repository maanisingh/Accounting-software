/**
 * Customer Routes
 * API routes for customer management
 */

import express from 'express';
import * as customerController from '../../controllers/customerController.js';
import * as customerValidation from '../../validations/customerValidation.js';
import { validateBody, validateQuery, validateParams } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all customer routes
router.use(authenticate);

/**
 * @route   POST /api/v1/customers
 * @desc    Create new customer
 * @access  Private
 */
router.post(
  '/',
  validateBody(customerValidation.createCustomerSchema),
  customerController.createCustomer
);

/**
 * @route   GET /api/v1/customers
 * @desc    Get all customers with filters and pagination
 * @access  Private
 */
router.get(
  '/',
  validateQuery(customerValidation.getCustomersSchema),
  customerController.getCustomers
);

/**
 * @route   GET /api/v1/customers/getCustomersByCompany/:id
 * @desc    Get customers by company ID (alias for backward compatibility)
 * @access  Private
 * @note    MUST be before /:id route
 */
router.get(
  '/getCustomersByCompany/:id',
  customerController.getCustomers
);

/**
 * @route   GET /api/v1/customers/company/:id
 * @desc    Get customers by company ID
 * @access  Private
 * @note    MUST be before /:id route
 */
router.get(
  '/company/:id',
  customerController.getCustomers
);

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get customer by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(customerValidation.idParamSchema),
  customerController.getCustomerById
);

/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Update customer
 * @access  Private
 */
router.put(
  '/:id',
  validateParams(customerValidation.idParamSchema),
  validateBody(customerValidation.updateCustomerSchema),
  customerController.updateCustomer
);

/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Delete customer (only if no transactions)
 * @access  Private
 */
router.delete(
  '/:id',
  validateParams(customerValidation.idParamSchema),
  customerController.deleteCustomer
);

export default router;
