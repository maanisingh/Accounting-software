/**
 * Tax Report Controller
 * Handles HTTP requests for tax reports
 */

import * as taxReportService from '../services/taxReportService.js';
import ApiError from '../utils/ApiError.js';
import logger from '../config/logger.js';

/**
 * Get Tax Summary
 * @route GET /api/v1/reports/tax-summary
 */
export const getTaxSummary = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await taxReportService.getTaxSummary(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getTaxSummary controller:', error);
    next(error);
  }
};

/**
 * Get GST Report
 * @route GET /api/v1/reports/tax-gst
 */
export const getGSTReport = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await taxReportService.getGSTReport(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getGSTReport controller:', error);
    next(error);
  }
};

/**
 * Get VAT Report
 * @route GET /api/v1/reports/tax-vat
 */
export const getVATReport = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await taxReportService.getVATReport(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getVATReport controller:', error);
    next(error);
  }
};

/**
 * Get Input Tax Credit
 * @route GET /api/v1/reports/tax-input
 */
export const getInputTaxCredit = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await taxReportService.getInputTaxCredit(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getInputTaxCredit controller:', error);
    next(error);
  }
};

/**
 * Get Output Tax Liability
 * @route GET /api/v1/reports/tax-output
 */
export const getOutputTaxLiability = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await taxReportService.getOutputTaxLiability(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getOutputTaxLiability controller:', error);
    next(error);
  }
};

/**
 * Get Tax Filing Data
 * @route GET /api/v1/reports/tax-filing
 */
export const getTaxFilingData = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await taxReportService.getTaxFilingData(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getTaxFilingData controller:', error);
    next(error);
  }
};
