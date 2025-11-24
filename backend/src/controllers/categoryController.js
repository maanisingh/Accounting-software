/**
 * Category Controller
 * HTTP request handlers for category management endpoints
 */

import * as categoryService from '../services/categoryService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new category
 * @route POST /api/v1/categories
 * @access Private
 */
export const createCategory = asyncHandler(async (req, res) => {
  const categoryData = { ...req.body, companyId: req.user.companyId };
  const category = await categoryService.createCategory(categoryData, req.user.id);

  ApiResponse.created(category, 'Category created successfully').send(res);
});

/**
 * Get all categories
 * @route GET /api/v1/categories
 * @access Private
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories(req.user.companyId, req.query);

  ApiResponse.success({ categories }, 'Categories retrieved successfully').send(res);
});

/**
 * Get category by ID
 * @route GET /api/v1/categories/:id
 * @access Private
 */
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id, req.user.companyId);

  ApiResponse.success(category, 'Category retrieved successfully').send(res);
});

/**
 * Update category
 * @route PUT /api/v1/categories/:id
 * @access Private
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(category, 'Category updated successfully').send(res);
});

/**
 * Delete category
 * @route DELETE /api/v1/categories/:id
 * @access Private
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Category deleted successfully').send(res);
});

export default {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
