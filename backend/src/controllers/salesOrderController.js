/**
 * Sales Order Controller
 * HTTP request handlers for sales order management endpoints
 */

import * as salesOrderService from '../services/salesOrderService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new sales order
 * @route POST /api/v1/sales-orders
 * @access Private
 */
export const createSalesOrder = asyncHandler(async (req, res) => {
  const orderData = { ...req.body, companyId: req.user.companyId };
  const order = await salesOrderService.createSalesOrder(orderData, req.user.id);

  ApiResponse.created(order, 'Sales order created successfully').send(res);
});

/**
 * Get all sales orders with filters
 * @route GET /api/v1/sales-orders
 * @access Private
 */
export const getSalesOrders = asyncHandler(async (req, res) => {
  const filters = { ...req.query, companyId: req.user.companyId };
  const result = await salesOrderService.getSalesOrders(filters);

  ApiResponse.paginated(
    result.orders,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Sales orders retrieved successfully'
  ).send(res);
});

/**
 * Get sales order by ID
 * @route GET /api/v1/sales-orders/:id
 * @access Private
 */
export const getSalesOrderById = asyncHandler(async (req, res) => {
  const order = await salesOrderService.getSalesOrderById(req.params.id, req.user.companyId);

  ApiResponse.success(order, 'Sales order retrieved successfully').send(res);
});

/**
 * Update sales order
 * @route PUT /api/v1/sales-orders/:id
 * @access Private
 */
export const updateSalesOrder = asyncHandler(async (req, res) => {
  const order = await salesOrderService.updateSalesOrder(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(order, 'Sales order updated successfully').send(res);
});

/**
 * Delete sales order
 * @route DELETE /api/v1/sales-orders/:id
 * @access Private
 */
export const deleteSalesOrder = asyncHandler(async (req, res) => {
  await salesOrderService.deleteSalesOrder(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Sales order deleted successfully').send(res);
});

/**
 * Convert sales order to invoice
 * @route POST /api/v1/sales-orders/:id/invoice
 * @access Private
 */
export const convertToInvoice = asyncHandler(async (req, res) => {
  const invoice = await salesOrderService.convertToInvoice(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.created(invoice, 'Sales order converted to invoice successfully').send(res);
});

export default {
  createSalesOrder,
  getSalesOrders,
  getSalesOrderById,
  updateSalesOrder,
  deleteSalesOrder,
  convertToInvoice
};
