/**
 * Payment Controller
 * Handles vendor payment HTTP requests
 */

import * as paymentService from '../services/paymentService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @route   POST /api/v1/payments
 * @desc    Record payment to vendor
 * @access  Private
 */
export const createPayment = asyncHandler(async (req, res) => {
  const paymentData = {
    ...req.body,
    companyId: req.user.companyId
  };

  const payment = await paymentService.createPayment(paymentData, req.user.id);

  ApiResponse.created(payment, 'Payment recorded successfully').send(res);
});

/**
 * @route   GET /api/v1/payments
 * @desc    Get all payments
 * @access  Private
 */
export const getPayments = asyncHandler(async (req, res) => {
  const filters = {
    vendorId: req.query.vendorId,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    paymentMethod: req.query.paymentMethod,
    search: req.query.search
  };

  const payments = await paymentService.getPayments(req.user.companyId, filters);

  ApiResponse.success(
    payments,
    `Retrieved ${payments.length} payments`
  ).send(res);
});

/**
 * @route   GET /api/v1/payments/:id
 * @desc    Get payment details
 * @access  Private
 */
export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id, req.user.companyId);

  ApiResponse.success(payment, 'Payment retrieved successfully').send(res);
});

/**
 * @route   DELETE /api/v1/payments/:id
 * @desc    Delete payment (reverse journal)
 * @access  Private
 */
export const deletePayment = asyncHandler(async (req, res) => {
  await paymentService.deletePayment(req.params.id, req.user.companyId);

  ApiResponse.success(null, 'Payment deleted and reversed successfully').send(res);
});

/**
 * @route   GET /api/v1/payments/vendor/:id
 * @desc    Get payments by vendor
 * @access  Private
 */
export const getPaymentsByVendor = asyncHandler(async (req, res) => {
  const payments = await paymentService.getPaymentsByVendor(
    req.params.id,
    req.user.companyId
  );

  ApiResponse.success(
    payments,
    `Retrieved ${payments.length} payments for vendor`
  ).send(res);
});

/**
 * @route   GET /api/v1/payments/pending
 * @desc    Get bills pending payment
 * @access  Private
 */
export const getPendingBills = asyncHandler(async (req, res) => {
  const bills = await paymentService.getPendingBills(
    req.user.companyId,
    req.query.vendorId
  );

  ApiResponse.success(
    bills,
    `Retrieved ${bills.length} pending bills`
  ).send(res);
});
