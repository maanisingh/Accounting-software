/**
 * Vendor Controller
 * HTTP request handlers for vendor management endpoints
 */

import * as vendorService from '../services/vendorService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new vendor
 * @route POST /api/v1/vendors
 * @access Private
 */
export const createVendor = asyncHandler(async (req, res) => {
  const vendorData = { ...req.body, companyId: req.user.companyId };
  const vendor = await vendorService.createVendor(vendorData, req.user.id);

  ApiResponse.created(vendor, 'Vendor created successfully').send(res);
});

/**
 * Get all vendors
 * @route GET /api/v1/vendors
 * @access Private
 */
export const getVendors = asyncHandler(async (req, res) => {
  const result = await vendorService.getVendors(req.user.companyId, req.query);

  ApiResponse.success(result, 'Vendors retrieved successfully').send(res);
});

/**
 * Get vendor by ID
 * @route GET /api/v1/vendors/:id
 * @access Private
 */
export const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendorById(req.params.id, req.user.companyId);

  ApiResponse.success(vendor, 'Vendor retrieved successfully').send(res);
});

/**
 * Update vendor
 * @route PUT /api/v1/vendors/:id
 * @access Private
 */
export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.updateVendor(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(vendor, 'Vendor updated successfully').send(res);
});

/**
 * Delete vendor
 * @route DELETE /api/v1/vendors/:id
 * @access Private
 */
export const deleteVendor = asyncHandler(async (req, res) => {
  await vendorService.deleteVendor(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Vendor deleted successfully').send(res);
});

export default {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor
};
