/**
 * Sales Quotation Controller
 * HTTP request handlers for sales quotation management endpoints
 */

import * as salesQuotationService from '../services/salesQuotationService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new sales quotation
 * @route POST /api/v1/sales-quotations
 * @access Private
 */
export const createSalesQuotation = asyncHandler(async (req, res) => {
  const quotationData = { ...req.body, companyId: req.user.companyId };
  const quotation = await salesQuotationService.createSalesQuotation(quotationData, req.user.id);

  ApiResponse.created(quotation, 'Sales quotation created successfully').send(res);
});

/**
 * Get all sales quotations with filters
 * @route GET /api/v1/sales-quotations
 * @access Private
 */
export const getSalesQuotations = asyncHandler(async (req, res) => {
  const filters = { ...req.query, companyId: req.user.companyId };
  const result = await salesQuotationService.getSalesQuotations(filters);

  ApiResponse.paginated(
    result.quotations,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Sales quotations retrieved successfully'
  ).send(res);
});

/**
 * Get sales quotation by ID
 * @route GET /api/v1/sales-quotations/:id
 * @access Private
 */
export const getSalesQuotationById = asyncHandler(async (req, res) => {
  const quotation = await salesQuotationService.getSalesQuotationById(req.params.id, req.user.companyId);

  ApiResponse.success(quotation, 'Sales quotation retrieved successfully').send(res);
});

/**
 * Update sales quotation
 * @route PUT /api/v1/sales-quotations/:id
 * @access Private
 */
export const updateSalesQuotation = asyncHandler(async (req, res) => {
  const quotation = await salesQuotationService.updateSalesQuotation(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(quotation, 'Sales quotation updated successfully').send(res);
});

/**
 * Delete sales quotation
 * @route DELETE /api/v1/sales-quotations/:id
 * @access Private
 */
export const deleteSalesQuotation = asyncHandler(async (req, res) => {
  await salesQuotationService.deleteSalesQuotation(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Sales quotation deleted successfully').send(res);
});

/**
 * Convert sales quotation to sales order
 * @route POST /api/v1/sales-quotations/:id/convert
 * @access Private
 */
export const convertToSalesOrder = asyncHandler(async (req, res) => {
  const salesOrder = await salesQuotationService.convertToSalesOrder(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.created(salesOrder, 'Sales quotation converted to sales order successfully').send(res);
});

export default {
  createSalesQuotation,
  getSalesQuotations,
  getSalesQuotationById,
  updateSalesQuotation,
  deleteSalesQuotation,
  convertToSalesOrder
};
