/**
 * Delivery Challan Controller
 * HTTP request handlers for delivery challan management endpoints
 */

import * as deliveryChallanService from '../services/deliveryChallanService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new delivery challan
 * @route POST /api/v1/delivery-challans
 * @access Private
 */
export const createDeliveryChallan = asyncHandler(async (req, res) => {
  const challanData = { ...req.body, companyId: req.user.companyId };
  const challan = await deliveryChallanService.createDeliveryChallan(challanData, req.user.id);

  ApiResponse.created(challan, 'Delivery challan created successfully').send(res);
});

/**
 * Get all delivery challans with filters
 * @route GET /api/v1/delivery-challans
 * @access Private
 */
export const getDeliveryChallans = asyncHandler(async (req, res) => {
  const filters = { ...req.query, companyId: req.user.companyId };
  const result = await deliveryChallanService.getDeliveryChallans(filters);

  ApiResponse.paginated(
    result.challans,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Delivery challans retrieved successfully'
  ).send(res);
});

/**
 * Get delivery challan by ID
 * @route GET /api/v1/delivery-challans/:id
 * @access Private
 */
export const getDeliveryChallanById = asyncHandler(async (req, res) => {
  const challan = await deliveryChallanService.getDeliveryChallanById(req.params.id, req.user.companyId);

  ApiResponse.success(challan, 'Delivery challan retrieved successfully').send(res);
});

/**
 * Delete delivery challan
 * @route DELETE /api/v1/delivery-challans/:id
 * @access Private
 */
export const deleteDeliveryChallan = asyncHandler(async (req, res) => {
  await deliveryChallanService.deleteDeliveryChallan(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Delivery challan deleted and stock reversed successfully').send(res);
});

export default {
  createDeliveryChallan,
  getDeliveryChallans,
  getDeliveryChallanById,
  deleteDeliveryChallan
};
