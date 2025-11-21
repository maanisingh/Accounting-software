/**
 * Receipt Controller
 * Handles customer receipt HTTP requests
 */

import * as receiptService from '../services/receiptService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @route   POST /api/v1/receipts
 * @desc    Record receipt from customer
 * @access  Private
 */
export const createReceipt = asyncHandler(async (req, res) => {
  const receiptData = {
    ...req.body,
    companyId: req.user.companyId
  };

  const receipt = await receiptService.createReceipt(receiptData, req.user.id);

  ApiResponse.created(receipt, 'Receipt recorded successfully').send(res);
});

/**
 * @route   GET /api/v1/receipts
 * @desc    Get all receipts
 * @access  Private
 */
export const getReceipts = asyncHandler(async (req, res) => {
  const filters = {
    customerId: req.query.customerId,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    paymentMethod: req.query.paymentMethod,
    search: req.query.search
  };

  const receipts = await receiptService.getReceipts(req.user.companyId, filters);

  ApiResponse.success(
    receipts,
    `Retrieved ${receipts.length} receipts`
  ).send(res);
});

/**
 * @route   GET /api/v1/receipts/:id
 * @desc    Get receipt details
 * @access  Private
 */
export const getReceiptById = asyncHandler(async (req, res) => {
  const receipt = await receiptService.getReceiptById(req.params.id, req.user.companyId);

  ApiResponse.success(receipt, 'Receipt retrieved successfully').send(res);
});

/**
 * @route   DELETE /api/v1/receipts/:id
 * @desc    Delete receipt (reverse journal)
 * @access  Private
 */
export const deleteReceipt = asyncHandler(async (req, res) => {
  await receiptService.deleteReceipt(req.params.id, req.user.companyId);

  ApiResponse.success(null, 'Receipt deleted and reversed successfully').send(res);
});

/**
 * @route   GET /api/v1/receipts/customer/:id
 * @desc    Get receipts by customer
 * @access  Private
 */
export const getReceiptsByCustomer = asyncHandler(async (req, res) => {
  const receipts = await receiptService.getReceiptsByCustomer(
    req.params.id,
    req.user.companyId
  );

  ApiResponse.success(
    receipts,
    `Retrieved ${receipts.length} receipts for customer`
  ).send(res);
});

/**
 * @route   GET /api/v1/receipts/pending
 * @desc    Get invoices pending payment
 * @access  Private
 */
export const getPendingInvoices = asyncHandler(async (req, res) => {
  const invoices = await receiptService.getPendingInvoices(
    req.user.companyId,
    req.query.customerId
  );

  ApiResponse.success(
    invoices,
    `Retrieved ${invoices.length} pending invoices`
  ).send(res);
});
