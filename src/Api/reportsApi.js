/**
 * Reports API Service
 * Handles all financial reports API calls
 */

import axiosInstance from './axiosInstance';

/**
 * Get Sales Report with customer & product breakdown
 * @param {Object} params - { startDate, endDate, customerId, productId, groupBy }
 * @returns {Promise} - Sales report data
 */
export const getSalesReport = async (params) => {
  const response = await axiosInstance.get('/reports/sales', { params });
  return response.data;
};

/**
 * Get Purchase Report with supplier & product breakdown
 * @param {Object} params - { startDate, endDate, supplierId, productId, groupBy }
 * @returns {Promise} - Purchase report data
 */
export const getPurchaseReport = async (params) => {
  const response = await axiosInstance.get('/reports/purchase', { params });
  return response.data;
};

/**
 * Get Tax Summary Report (GST/VAT collected vs paid)
 * @param {Object} params - { startDate, endDate }
 * @returns {Promise} - Tax summary data
 */
export const getTaxSummaryReport = async (params) => {
  const response = await axiosInstance.get('/reports/tax-summary', { params });
  return response.data;
};

/**
 * Get Inventory Summary Report with reorder alerts
 * @param {Object} params - { warehouseId, categoryId, lowStockOnly }
 * @returns {Promise} - Inventory summary data
 */
export const getInventorySummaryReport = async (params = {}) => {
  const response = await axiosInstance.get('/reports/inventory-summary', { params });
  return response.data;
};

/**
 * Get VAT Report by period
 * @param {Object} params - { startDate, endDate, period }
 * @returns {Promise} - VAT report data
 */
export const getVATReport = async (params) => {
  const response = await axiosInstance.get('/reports/vat', { params });
  return response.data;
};

/**
 * Get Day Book Report (daily transactions)
 * @param {Object} params - { date, accountType }
 * @returns {Promise} - Day book entries
 */
export const getDayBookReport = async (params) => {
  const response = await axiosInstance.get('/reports/daybook', { params });
  return response.data;
};

/**
 * Get Journal Entries Report
 * @param {Object} params - { startDate, endDate, status, page, limit }
 * @returns {Promise} - Journal entries
 */
export const getJournalEntriesReport = async (params) => {
  const response = await axiosInstance.get('/reports/journal-entries', { params });
  return response.data;
};

/**
 * Get Ledger Report for specific account
 * @param {Object} params - { accountId, startDate, endDate }
 * @returns {Promise} - Account ledger report
 */
export const getLedgerReport = async (params) => {
  const response = await axiosInstance.get('/reports/ledger', { params });
  return response.data;
};

/**
 * Get Trial Balance with debit/credit verification
 * @param {Object} params - { asOfDate, includeZeroBalance }
 * @returns {Promise} - Trial balance data
 */
export const getTrialBalanceReport = async (params) => {
  const response = await axiosInstance.get('/reports/trial-balance', { params });
  return response.data;
};

/**
 * Get Profit & Loss Statement
 * @param {Object} params - { startDate, endDate, comparePrevious }
 * @returns {Promise} - P&L statement
 */
export const getProfitLossReport = async (params) => {
  const response = await axiosInstance.get('/reports/profit-loss', { params });
  return response.data;
};

/**
 * Get Balance Sheet
 * @param {Object} params - { asOfDate, comparePrevious }
 * @returns {Promise} - Balance sheet data
 */
export const getBalanceSheetReport = async (params) => {
  const response = await axiosInstance.get('/reports/balance-sheet', { params });
  return response.data;
};

/**
 * Get Cash Flow Statement
 * @param {Object} params - { startDate, endDate, method }
 * @returns {Promise} - Cash flow statement
 */
export const getCashFlowReport = async (params) => {
  const response = await axiosInstance.get('/reports/cash-flow', { params });
  return response.data;
};

/**
 * Export report to PDF/Excel
 * @param {string} reportType - Type of report
 * @param {string} format - 'pdf' or 'excel'
 * @param {Object} params - Report parameters
 * @returns {Promise} - File blob
 */
export const exportReport = async (reportType, format, params) => {
  const response = await axiosInstance.get(`/reports/${reportType}/export`, {
    params: { ...params, format },
    responseType: 'blob'
  });
  return response.data;
};

export default {
  getSalesReport,
  getPurchaseReport,
  getTaxSummaryReport,
  getInventorySummaryReport,
  getVATReport,
  getDayBookReport,
  getJournalEntriesReport,
  getLedgerReport,
  getTrialBalanceReport,
  getProfitLossReport,
  getBalanceSheetReport,
  getCashFlowReport,
  exportReport
};
