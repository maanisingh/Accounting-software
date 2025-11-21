/**
 * Financial Report Controller
 * Handles HTTP requests for financial reports
 */

import * as financialReportService from '../services/financialReportService.js';
import ApiError from '../utils/ApiError.js';
import logger from '../config/logger.js';

/**
 * Get Balance Sheet
 * @route GET /api/v1/reports/balance-sheet
 */
export const getBalanceSheet = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await financialReportService.getBalanceSheet(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getBalanceSheet controller:', error);
    next(error);
  }
};

/**
 * Get Profit & Loss Statement
 * @route GET /api/v1/reports/profit-loss
 */
export const getProfitAndLoss = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await financialReportService.getProfitAndLoss(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getProfitAndLoss controller:', error);
    next(error);
  }
};

/**
 * Get Cash Flow Statement
 * @route GET /api/v1/reports/cash-flow
 */
export const getCashFlowStatement = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await financialReportService.getCashFlowStatement(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getCashFlowStatement controller:', error);
    next(error);
  }
};

/**
 * Get Trial Balance
 * @route GET /api/v1/reports/trial-balance
 */
export const getTrialBalance = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await financialReportService.getTrialBalance(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getTrialBalance controller:', error);
    next(error);
  }
};

/**
 * Get Account Ledger
 * @route GET /api/v1/reports/ledger/:accountId
 */
export const getAccountLedger = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { accountId } = req.params;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await financialReportService.getAccountLedger(companyId, accountId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getAccountLedger controller:', error);
    next(error);
  }
};

/**
 * Get General Ledger
 * @route GET /api/v1/reports/general-ledger
 */
export const getGeneralLedger = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await financialReportService.getGeneralLedger(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getGeneralLedger controller:', error);
    next(error);
  }
};

/**
 * Get Day Book
 * @route GET /api/v1/reports/day-book
 */
export const getDayBook = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await financialReportService.getDayBook(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getDayBook controller:', error);
    next(error);
  }
};

/**
 * Get Bank Book
 * @route GET /api/v1/reports/bank-book
 */
export const getBankBook = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await financialReportService.getBankBook(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getBankBook controller:', error);
    next(error);
  }
};

/**
 * Get Cash Book
 * @route GET /api/v1/reports/cash-book
 */
export const getCashBook = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await financialReportService.getCashBook(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getCashBook controller:', error);
    next(error);
  }
};

/**
 * Get Accounts Receivable
 * @route GET /api/v1/reports/receivables
 */
export const getAccountsReceivable = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {};

    const report = await financialReportService.getAccountsReceivable(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getAccountsReceivable controller:', error);
    next(error);
  }
};

/**
 * Get Accounts Payable
 * @route GET /api/v1/reports/payables
 */
export const getAccountsPayable = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {};

    const report = await financialReportService.getAccountsPayable(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getAccountsPayable controller:', error);
    next(error);
  }
};

/**
 * Get Aging Receivables
 * @route GET /api/v1/reports/aging-receivables
 */
export const getAgingReceivables = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {};

    const report = await financialReportService.getAgingReceivables(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getAgingReceivables controller:', error);
    next(error);
  }
};

/**
 * Get Aging Payables
 * @route GET /api/v1/reports/aging-payables
 */
export const getAgingPayables = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {};

    const report = await financialReportService.getAgingPayables(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getAgingPayables controller:', error);
    next(error);
  }
};

/**
 * Get Journal Entries Report
 * @route GET /api/v1/reports/journal-entries
 */
export const getJournalEntriesReport = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
      limit: req.query.limit
    };

    const report = await financialReportService.getJournalEntriesReport(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getJournalEntriesReport controller:', error);
    next(error);
  }
};

/**
 * Get Audit Trail
 * @route GET /api/v1/reports/audit-trail
 */
export const getAuditTrail = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
      limit: req.query.limit
    };

    const report = await financialReportService.getAuditTrail(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getAuditTrail controller:', error);
    next(error);
  }
};
