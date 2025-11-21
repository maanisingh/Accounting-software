/**
 * Sales Report Controller
 * Handles HTTP requests for sales reports
 */

import * as salesReportService from '../services/salesReportService.js';
import ApiError from '../utils/ApiError.js';
import logger from '../config/logger.js';

/**
 * Get Sales Summary
 * @route GET /api/v1/reports/sales-summary
 */
export const getSalesSummary = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await salesReportService.getSalesSummary(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getSalesSummary controller:', error);
    next(error);
  }
};

/**
 * Get Detailed Sales
 * @route GET /api/v1/reports/sales-detailed
 */
export const getDetailedSales = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
      limit: req.query.limit
    };

    const report = await salesReportService.getDetailedSales(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getDetailedSales controller:', error);
    next(error);
  }
};

/**
 * Get Sales by Customer
 * @route GET /api/v1/reports/sales-by-customer
 */
export const getSalesByCustomer = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await salesReportService.getSalesByCustomer(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getSalesByCustomer controller:', error);
    next(error);
  }
};

/**
 * Get Sales by Product
 * @route GET /api/v1/reports/sales-by-product
 */
export const getSalesByProduct = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await salesReportService.getSalesByProduct(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getSalesByProduct controller:', error);
    next(error);
  }
};

/**
 * Get Sales by Date
 * @route GET /api/v1/reports/sales-by-date
 */
export const getSalesByDate = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await salesReportService.getSalesByDate(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getSalesByDate controller:', error);
    next(error);
  }
};

/**
 * Get Sales Trends
 * @route GET /api/v1/reports/sales-trends
 */
export const getSalesTrends = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      groupBy: req.query.groupBy
    };

    const report = await salesReportService.getSalesTrends(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getSalesTrends controller:', error);
    next(error);
  }
};

/**
 * Get Sales Returns
 * @route GET /api/v1/reports/sales-returns
 */
export const getSalesReturns = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await salesReportService.getSalesReturns(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getSalesReturns controller:', error);
    next(error);
  }
};

/**
 * Get Sales Tax Report
 * @route GET /api/v1/reports/sales-tax
 */
export const getSalesTax = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await salesReportService.getSalesTax(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getSalesTax controller:', error);
    next(error);
  }
};
