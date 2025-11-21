/**
 * Vendor Routes
 * API routes for vendor management
 */

import express from 'express';
import * as vendorController from '../../controllers/vendorController.js';
import * as vendorValidation from '../../validations/vendorValidation.js';
import { validateBody, validateQuery, validateParams } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all vendor routes
router.use(authenticate);

/**
 * @route   POST /api/v1/vendors
 * @desc    Create new vendor
 * @access  Private
 */
router.post(
  '/',
  validateBody(vendorValidation.createVendorSchema),
  vendorController.createVendor
);

/**
 * @route   GET /api/v1/vendors
 * @desc    Get all vendors with filters and pagination
 * @access  Private
 */
router.get(
  '/',
  validateQuery(vendorValidation.getVendorsSchema),
  vendorController.getVendors
);

/**
 * @route   GET /api/v1/vendors/getVendorsByCompany/:id
 * @desc    Get vendors by company ID (alias for backward compatibility)
 * @access  Private
 * @note    MUST be before /:id route
 */
router.get(
  '/getVendorsByCompany/:id',
  vendorController.getVendors
);

/**
 * @route   GET /api/v1/vendors/company/:id
 * @desc    Get vendors by company ID
 * @access  Private
 * @note    MUST be before /:id route
 */
router.get(
  '/company/:id',
  vendorController.getVendors
);

/**
 * @route   GET /api/v1/vendors/:id
 * @desc    Get vendor by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(vendorValidation.idParamSchema),
  vendorController.getVendorById
);

/**
 * @route   PUT /api/v1/vendors/:id
 * @desc    Update vendor
 * @access  Private
 */
router.put(
  '/:id',
  validateParams(vendorValidation.idParamSchema),
  validateBody(vendorValidation.updateVendorSchema),
  vendorController.updateVendor
);

/**
 * @route   DELETE /api/v1/vendors/:id
 * @desc    Delete vendor (only if no transactions)
 * @access  Private
 */
router.delete(
  '/:id',
  validateParams(vendorValidation.idParamSchema),
  vendorController.deleteVendor
);

export default router;
