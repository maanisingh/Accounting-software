/**
 * Customer Controller
 * HTTP request handlers for customer management endpoints
 */

import * as customerService from '../services/customerService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new customer
 * @route POST /api/v1/customers
 * @access Private
 */
export const createCustomer = asyncHandler(async (req, res) => {
  const customerData = { ...req.body, companyId: req.user.companyId };
  const customer = await customerService.createCustomer(customerData, req.user.id);

  ApiResponse.created(customer, 'Customer created successfully').send(res);
});

/**
 * Get all customers
 * @route GET /api/v1/customers
 * @access Private
 */
export const getCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.getCustomers(req.user.companyId, req.query);

  ApiResponse.success(result, 'Customers retrieved successfully').send(res);
});

/**
 * Get customer by ID
 * @route GET /api/v1/customers/:id
 * @access Private
 */
export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id, req.user.companyId);

  ApiResponse.success(customer, 'Customer retrieved successfully').send(res);
});

/**
 * Update customer
 * @route PUT /api/v1/customers/:id
 * @access Private
 */
export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(customer, 'Customer updated successfully').send(res);
});

/**
 * Delete customer
 * @route DELETE /api/v1/customers/:id
 * @access Private
 */
export const deleteCustomer = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Customer deleted successfully').send(res);
});

export default {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
};
