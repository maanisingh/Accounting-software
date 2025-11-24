/**
 * Brand Controller
 * HTTP request handlers for brand management endpoints
 */

import * as brandService from '../services/brandService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new brand
 * @route POST /api/v1/brands
 * @access Private
 */
export const createBrand = asyncHandler(async (req, res) => {
  const brandData = { ...req.body, companyId: req.user.companyId };
  const brand = await brandService.createBrand(brandData, req.user.id);

  ApiResponse.created(brand, 'Brand created successfully').send(res);
});

/**
 * Get all brands
 * @route GET /api/v1/brands
 * @access Private
 */
export const getBrands = asyncHandler(async (req, res) => {
  const brands = await brandService.getBrands(req.user.companyId, req.query);

  ApiResponse.success({ brands }, 'Brands retrieved successfully').send(res);
});

/**
 * Get brand by ID
 * @route GET /api/v1/brands/:id
 * @access Private
 */
export const getBrandById = asyncHandler(async (req, res) => {
  const brand = await brandService.getBrandById(req.params.id, req.user.companyId);

  ApiResponse.success(brand, 'Brand retrieved successfully').send(res);
});

/**
 * Update brand
 * @route PUT /api/v1/brands/:id
 * @access Private
 */
export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.updateBrand(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(brand, 'Brand updated successfully').send(res);
});

/**
 * Delete brand
 * @route DELETE /api/v1/brands/:id
 * @access Private
 */
export const deleteBrand = asyncHandler(async (req, res) => {
  await brandService.deleteBrand(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Brand deleted successfully').send(res);
});

export default {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand
};
