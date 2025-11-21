/**
 * Bill Controller
 * HTTP request handlers for bill management endpoints
 */

import * as billService from '../services/billService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create new bill
 * @route POST /api/v1/bills
 * @access Private
 */
export const createBill = asyncHandler(async (req, res) => {
  const billData = { ...req.body, companyId: req.user.companyId };
  const bill = await billService.createBill(billData, req.user.id);

  ApiResponse.created(bill, 'Bill created successfully').send(res);
});

/**
 * Get all bills with filters
 * @route GET /api/v1/bills
 * @access Private
 */
export const getBills = asyncHandler(async (req, res) => {
  const filters = { ...req.query, companyId: req.user.companyId };
  const result = await billService.getBills(filters);

  ApiResponse.paginated(
    result.bills,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Bills retrieved successfully'
  ).send(res);
});

/**
 * Get bill by ID
 * @route GET /api/v1/bills/:id
 * @access Private
 */
export const getBillById = asyncHandler(async (req, res) => {
  const bill = await billService.getBillById(req.params.id, req.user.companyId);

  ApiResponse.success(bill, 'Bill retrieved successfully').send(res);
});

/**
 * Update bill
 * @route PUT /api/v1/bills/:id
 * @access Private
 */
export const updateBill = asyncHandler(async (req, res) => {
  const bill = await billService.updateBill(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(bill, 'Bill updated successfully').send(res);
});

/**
 * Delete bill
 * @route DELETE /api/v1/bills/:id
 * @access Private
 */
export const deleteBill = asyncHandler(async (req, res) => {
  await billService.deleteBill(req.params.id, req.user.companyId, req.user.id);

  ApiResponse.success(null, 'Bill deleted successfully').send(res);
});

/**
 * Approve bill and create journal entry
 * @route POST /api/v1/bills/:id/approve
 * @access Private
 */
export const approveBill = asyncHandler(async (req, res) => {
  const bill = await billService.approveBill(
    req.params.id,
    req.user.companyId,
    req.user.id
  );

  ApiResponse.success(bill, 'Bill approved and journal entry created successfully').send(res);
});

/**
 * Record payment for bill
 * @route POST /api/v1/bills/:id/pay
 * @access Private
 */
export const recordPayment = asyncHandler(async (req, res) => {
  const bill = await billService.recordPayment(
    req.params.id,
    req.user.companyId,
    req.body,
    req.user.id
  );

  ApiResponse.success(bill, 'Payment recorded successfully').send(res);
});

/**
 * Generate PDF for bill
 * @route GET /api/v1/bills/:id/pdf
 * @access Private
 */
export const generatePDF = asyncHandler(async (req, res) => {
  const bill = await billService.getBillById(req.params.id, req.user.companyId);

  // TODO: Implement PDF generation
  ApiResponse.success(
    { bill, pdf: null },
    'PDF generation not yet implemented - returning bill data'
  ).send(res);
});

/**
 * Get pending (unpaid) bills
 * @route GET /api/v1/bills/pending
 * @access Private
 */
export const getPendingBills = asyncHandler(async (req, res) => {
  const bills = await billService.getPendingBills(req.user.companyId, req.query);

  ApiResponse.success(bills, 'Pending bills retrieved successfully').send(res);
});

/**
 * Get bills by vendor
 * @route GET /api/v1/bills/vendor/:id
 * @access Private
 */
export const getBillsByVendor = asyncHandler(async (req, res) => {
  const bills = await billService.getBillsByVendor(req.params.id, req.user.companyId);

  ApiResponse.success(bills, 'Vendor bills retrieved successfully').send(res);
});

export default {
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
  approveBill,
  recordPayment,
  generatePDF,
  getPendingBills,
  getBillsByVendor
};
