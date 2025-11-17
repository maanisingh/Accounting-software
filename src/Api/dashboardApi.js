/**
 * Dashboard API Service
 * Handles dashboard statistics and analytics API calls
 */

import axiosInstance from './axiosInstance';

/**
 * Get company dashboard statistics
 * @returns {Promise} - Dashboard stats (revenue, expenses, receivables, payables, etc.)
 */
export const getCompanyDashboardStats = async () => {
  const response = await axiosInstance.get('/dashboard/company');
  return response.data;
};

/**
 * Get company dashboard charts data
 * @param {Object} params - Query parameters (period, startDate, endDate)
 * @returns {Promise} - Charts data (monthly revenue/expenses, top customers/products)
 */
export const getCompanyDashboardCharts = async (params = {}) => {
  const response = await axiosInstance.get('/dashboard/company/charts', { params });
  return response.data;
};

/**
 * Get superadmin dashboard statistics (requires SUPERADMIN role)
 * @returns {Promise} - System-wide statistics
 */
export const getSuperadminDashboardStats = async () => {
  const response = await axiosInstance.get('/dashboard/superadmin');
  return response.data;
};

export default {
  getCompanyDashboardStats,
  getCompanyDashboardCharts,
  getSuperadminDashboardStats
};
