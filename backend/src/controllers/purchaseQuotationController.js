/**
 * Purchase Quotation Controller
 * HTTP request handlers for purchase quotation management endpoints
 */

import * as purchaseQuotationService from '../services/purchaseQuotationService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new purchase quotation
 * @route POST /api/v1/purchase-quotations
 * @access Private
 */
export const createPurchaseQuotation = asyncHandler(async (req, res) => {
  const quotationData = { ...req.body, companyId: req.user.companyId };
  const quotation = await purchaseQuotationService.createPurchaseQuotation(quotationData, req.user.id);

  ApiResponse.created(quotation, 'Purchase quotation created successfully').send(res);
});

/**
 * Get all purchase quotations with filters
 * @route GET /api/v1/purchase-quotations
 * @access Private
 */
export const getPurchaseQuotations = asyncHandler(async (req, res) => {
  const filters = { ...req.query, companyId: req.user.companyId };
  const result = await purchaseQuotationService.getPurchaseQuotations(filters);

  ApiResponse.paginated(
    result.quotations,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Purchase quotations retrieved successfully'
  ).send(res);
});

/**
 * Get purchase quotation by ID
 * @route GET /api/v1/purchase-quotations/:id
 * @access Private
 */
export const getPurchaseQuotationById = asyncHandler(async (req, res) => {
  const quotation = await purchaseQuotationService.getPurchaseQuotationById(req.params.id, req.user.companyId);

  ApiResponse.success(quotation, 'Purchase quotation retrieved successfully').send(res);
});

/**
 * Update purchase quotation
 * @route PUT /api/v1/purchase-quotations/:id
 * @access Private
 */
export const updatePurchaseQuotation = asyncHandler(async (req, res) => {
  const quotation = await purchaseQuotationService.updatePurchaseQuotation(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(quotation, 'Purchase quotation updated successfully').send(res);
});

/**
 * Delete purchase quotation
 * @route DELETE /api/v1/purchase-quotations/:id
 * @access Private
 */
export const deletePurchaseQuotation = asyncHandler(async (req, res) => {
  await purchaseQuotationService.deletePurchaseQuotation(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Purchase quotation deleted successfully').send(res);
});

/**
 * Convert quotation to purchase order
 * @route POST /api/v1/purchase-quotations/:id/convert
 * @access Private
 */
export const convertToPurchaseOrder = asyncHandler(async (req, res) => {
  const purchaseOrder = await purchaseQuotationService.convertToPurchaseOrder(
    req.params.id,
    req.user.companyId,
    req.user.id
  );

  ApiResponse.created(purchaseOrder, 'Quotation converted to purchase order successfully').send(res);
});

/**
 * Generate PDF for quotation
 * @route GET /api/v1/purchase-quotations/:id/pdf
 * @access Private
 */
export const generatePDF = asyncHandler(async (req, res) => {
  const quotation = await purchaseQuotationService.getPurchaseQuotationById(req.params.id, req.user.companyId);

  // TODO: Implement PDF generation
  // For now, return quotation data with message
  ApiResponse.success(
    { quotation, pdf: null },
    'PDF generation not yet implemented - returning quotation data'
  ).send(res);
});

/**
 * Email quotation to vendor
 * @route POST /api/v1/purchase-quotations/:id/email
 * @access Private
 */
export const emailQuotation = asyncHandler(async (req, res) => {
  const quotation = await purchaseQuotationService.getPurchaseQuotationById(req.params.id, req.user.companyId);

  // TODO: Implement email functionality
  // For now, return success message
  ApiResponse.success(
    { quotation, emailSent: false },
    'Email functionality not yet implemented'
  ).send(res);
});

export default {
  createPurchaseQuotation,
  getPurchaseQuotations,
  getPurchaseQuotationById,
  updatePurchaseQuotation,
  deletePurchaseQuotation,
  convertToPurchaseOrder,
  generatePDF,
  emailQuotation
};
