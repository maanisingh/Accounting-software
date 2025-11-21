/**
 * Purchase Report Controller
 * Handles HTTP requests for purchase reports
 */

import * as purchaseReportService from '../services/purchaseReportService.js';
import ApiError from '../utils/ApiError.js';
import logger from '../config/logger.js';

/**
 * Get Purchases Summary
 * @route GET /api/v1/reports/purchases-summary
 */
export const getPurchasesSummary = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await purchaseReportService.getPurchasesSummary(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getPurchasesSummary controller:', error);
    next(error);
  }
};

/**
 * Get Detailed Purchases
 * @route GET /api/v1/reports/purchases-detailed
 */
export const getDetailedPurchases = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
      limit: req.query.limit
    };

    const report = await purchaseReportService.getDetailedPurchases(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getDetailedPurchases controller:', error);
    next(error);
  }
};

/**
 * Get Purchases by Vendor
 * @route GET /api/v1/reports/purchases-by-vendor
 */
export const getPurchasesByVendor = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await purchaseReportService.getPurchasesByVendor(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getPurchasesByVendor controller:', error);
    next(error);
  }
};

/**
 * Get Purchases by Product
 * @route GET /api/v1/reports/purchases-by-product
 */
export const getPurchasesByProduct = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await purchaseReportService.getPurchasesByProduct(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getPurchasesByProduct controller:', error);
    next(error);
  }
};

/**
 * Get Pending Purchase Orders
 * @route GET /api/v1/reports/purchases-pending
 */
export const getPendingPurchaseOrders = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {};

    const report = await purchaseReportService.getPendingPurchaseOrders(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getPendingPurchaseOrders controller:', error);
    next(error);
  }
};

/**
 * Get Purchase Returns
 * @route GET /api/v1/reports/purchases-returns
 */
export const getPurchaseReturns = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await purchaseReportService.getPurchaseReturns(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getPurchaseReturns controller:', error);
    next(error);
  }
};

/**
 * Get Purchase Tax Report
 * @route GET /api/v1/reports/purchases-tax
 */
export const getPurchaseTax = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await purchaseReportService.getPurchaseTax(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getPurchaseTax controller:', error);
    next(error);
  }
};

/**
 * Get Vendor Payments History
 * @route GET /api/v1/reports/vendor-payments
 */
export const getVendorPayments = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await purchaseReportService.getVendorPayments(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getVendorPayments controller:', error);
    next(error);
  }
};
