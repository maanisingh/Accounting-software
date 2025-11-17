/**
 * Ledger API Service
 * Handles ledger and accounting tracking API calls
 */

import axiosInstance from './axiosInstance';

/**
 * Get account ledger with running balance
 * @param {string} accountId - Account ID
 * @param {Object} params - Query parameters (startDate, endDate, page, limit)
 * @returns {Promise} - Account ledger entries
 */
export const getAccountLedger = async (accountId, params = {}) => {
  const response = await axiosInstance.get(`/ledger/account/${accountId}`, { params });
  return response.data;
};

/**
 * Get customer ledger (invoices, payments, outstanding)
 * @param {string} customerId - Customer ID
 * @param {Object} params - Query parameters
 * @returns {Promise} - Customer ledger entries
 */
export const getCustomerLedger = async (customerId, params = {}) => {
  const response = await axiosInstance.get(`/ledger/customer/${customerId}`, { params });
  return response.data;
};

/**
 * Get supplier ledger (bills, payments, outstanding)
 * @param {string} supplierId - Supplier ID
 * @param {Object} params - Query parameters
 * @returns {Promise} - Supplier ledger entries
 */
export const getSupplierLedger = async (supplierId, params = {}) => {
  const response = await axiosInstance.get(`/ledger/supplier/${supplierId}`, { params });
  return response.data;
};

/**
 * Get general ledger for all accounts
 * @param {Object} params - Query parameters (startDate, endDate, accountType, page, limit)
 * @returns {Promise} - General ledger entries
 */
export const getGeneralLedger = async (params = {}) => {
  const response = await axiosInstance.get('/ledger/general', { params });
  return response.data;
};

export default {
  getAccountLedger,
  getCustomerLedger,
  getSupplierLedger,
  getGeneralLedger
};
