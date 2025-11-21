/**
 * Warehouse Controller
 * HTTP request handlers for warehouse management endpoints
 */

import * as warehouseService from '../services/warehouseService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new warehouse
 * @route POST /api/v1/warehouses
 * @access Private
 */
export const createWarehouse = asyncHandler(async (req, res) => {
  const warehouseData = { ...req.body, companyId: req.user.companyId };
  const warehouse = await warehouseService.createWarehouse(warehouseData, req.user.id);

  ApiResponse.created(warehouse, 'Warehouse created successfully').send(res);
});

/**
 * Get all warehouses
 * @route GET /api/v1/warehouses
 * @access Private
 */
export const getWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await warehouseService.getWarehouses(req.user.companyId, req.query);

  ApiResponse.success(warehouses, 'Warehouses retrieved successfully').send(res);
});

/**
 * Get warehouse by ID
 * @route GET /api/v1/warehouses/:id
 * @access Private
 */
export const getWarehouseById = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.getWarehouseById(req.params.id, req.user.companyId);

  ApiResponse.success(warehouse, 'Warehouse retrieved successfully').send(res);
});

/**
 * Update warehouse
 * @route PUT /api/v1/warehouses/:id
 * @access Private
 */
export const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.updateWarehouse(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(warehouse, 'Warehouse updated successfully').send(res);
});

/**
 * Delete warehouse
 * @route DELETE /api/v1/warehouses/:id
 * @access Private
 */
export const deleteWarehouse = asyncHandler(async (req, res) => {
  await warehouseService.deleteWarehouse(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Warehouse deleted successfully').send(res);
});

/**
 * Get warehouse stock
 * @route GET /api/v1/warehouses/:id/stock
 * @access Private
 */
export const getWarehouseStock = asyncHandler(async (req, res) => {
  const stockItems = await warehouseService.getWarehouseStock(
    req.params.id,
    req.user.companyId,
    req.query
  );

  ApiResponse.success(stockItems, 'Warehouse stock retrieved successfully').send(res);
});

export default {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseStock
};
