/**
 * Sales API Service
 * Handles all sales-related API calls for the accounting system
 */

import axiosInstance from './axiosInstance';

// ==================== SALES QUOTATIONS ====================

/**
 * Get all sales quotations for the company
 * @param {Object} params - Query parameters (page, limit, status, etc.)
 * @returns {Promise} - List of quotations
 */
export const getSalesQuotations = async (params = {}) => {
  const response = await axiosInstance.get('/sales/quotations', { params });
  return response.data;
};

/**
 * Get a single sales quotation by ID
 * @param {string} id - Quotation ID
 * @returns {Promise} - Quotation details
 */
export const getSalesQuotationById = async (id) => {
  const response = await axiosInstance.get(`/sales/quotations/${id}`);
  return response.data;
};

/**
 * Create a new sales quotation
 * @param {Object} data - Quotation data
 * @returns {Promise} - Created quotation
 */
export const createSalesQuotation = async (data) => {
  const response = await axiosInstance.post('/sales/quotations', data);
  return response.data;
};

/**
 * Update an existing sales quotation
 * @param {string} id - Quotation ID
 * @param {Object} data - Updated quotation data
 * @returns {Promise} - Updated quotation
 */
export const updateSalesQuotation = async (id, data) => {
  const response = await axiosInstance.put(`/sales/quotations/${id}`, data);
  return response.data;
};

/**
 * Delete a sales quotation
 * @param {string} id - Quotation ID
 * @returns {Promise} - Deletion confirmation
 */
export const deleteSalesQuotation = async (id) => {
  const response = await axiosInstance.delete(`/sales/quotations/${id}`);
  return response.data;
};

/**
 * Update quotation status (DRAFT, SENT, APPROVED, REJECTED)
 * @param {string} id - Quotation ID
 * @param {string} status - New status
 * @returns {Promise} - Updated quotation
 */
export const updateQuotationStatus = async (id, status) => {
  const response = await axiosInstance.put(`/sales/quotations/${id}/status`, { status });
  return response.data;
};

// ==================== SALES ORDERS ====================

/**
 * Get all sales orders for the company
 * @param {Object} params - Query parameters
 * @returns {Promise} - List of sales orders
 */
export const getSalesOrders = async (params = {}) => {
  const response = await axiosInstance.get('/sales/sales-orders', { params });
  return response.data;
};

/**
 * Get a single sales order by ID
 * @param {string} id - Sales order ID
 * @returns {Promise} - Sales order details
 */
export const getSalesOrderById = async (id) => {
  const response = await axiosInstance.get(`/sales/sales-orders/${id}`);
  return response.data;
};

/**
 * Create a new sales order
 * @param {Object} data - Sales order data
 * @returns {Promise} - Created sales order
 */
export const createSalesOrder = async (data) => {
  const response = await axiosInstance.post('/sales/sales-orders', data);
  return response.data;
};

/**
 * Update an existing sales order
 * @param {string} id - Sales order ID
 * @param {Object} data - Updated sales order data
 * @returns {Promise} - Updated sales order
 */
export const updateSalesOrder = async (id, data) => {
  const response = await axiosInstance.put(`/sales/sales-orders/${id}`, data);
  return response.data;
};

/**
 * Delete a sales order
 * @param {string} id - Sales order ID
 * @returns {Promise} - Deletion confirmation
 */
export const deleteSalesOrder = async (id) => {
  const response = await axiosInstance.delete(`/sales/sales-orders/${id}`);
  return response.data;
};

/**
 * Update sales order status
 * @param {string} id - Sales order ID
 * @param {string} status - New status (PENDING, CONFIRMED, FULFILLED, etc.)
 * @returns {Promise} - Updated sales order
 */
export const updateSalesOrderStatus = async (id, status) => {
  const response = await axiosInstance.put(`/sales/sales-orders/${id}/status`, { status });
  return response.data;
};

/**
 * Convert sales order to invoice
 * @param {string} id - Sales order ID
 * @returns {Promise} - Created invoice
 */
export const convertSalesOrderToInvoice = async (id) => {
  const response = await axiosInstance.post(`/sales/sales-orders/${id}/convert-to-invoice`);
  return response.data;
};

// ==================== DELIVERY CHALLANS ====================

/**
 * Get all delivery challans for the company
 * @param {Object} params - Query parameters
 * @returns {Promise} - List of delivery challans
 */
export const getDeliveryChallans = async (params = {}) => {
  const response = await axiosInstance.get('/sales/delivery-challans', { params });
  return response.data;
};

/**
 * Get a single delivery challan by ID
 * @param {string} id - Delivery challan ID
 * @returns {Promise} - Delivery challan details
 */
export const getDeliveryChallanById = async (id) => {
  const response = await axiosInstance.get(`/sales/delivery-challans/${id}`);
  return response.data;
};

/**
 * Create a new delivery challan
 * @param {Object} data - Delivery challan data
 * @returns {Promise} - Created delivery challan
 */
export const createDeliveryChallan = async (data) => {
  const response = await axiosInstance.post('/sales/delivery-challans', data);
  return response.data;
};

/**
 * Update an existing delivery challan
 * @param {string} id - Delivery challan ID
 * @param {Object} data - Updated delivery challan data
 * @returns {Promise} - Updated delivery challan
 */
export const updateDeliveryChallan = async (id, data) => {
  const response = await axiosInstance.put(`/sales/delivery-challans/${id}`, data);
  return response.data;
};

/**
 * Delete a delivery challan
 * @param {string} id - Delivery challan ID
 * @returns {Promise} - Deletion confirmation
 */
export const deleteDeliveryChallan = async (id) => {
  const response = await axiosInstance.delete(`/sales/delivery-challans/${id}`);
  return response.data;
};

// ==================== SALES RETURNS ====================

/**
 * Get all sales returns for the company
 * @param {Object} params - Query parameters
 * @returns {Promise} - List of sales returns
 */
export const getSalesReturns = async (params = {}) => {
  const response = await axiosInstance.get('/sales/sales-returns', { params });
  return response.data;
};

/**
 * Get a single sales return by ID
 * @param {string} id - Sales return ID
 * @returns {Promise} - Sales return details
 */
export const getSalesReturnById = async (id) => {
  const response = await axiosInstance.get(`/sales/sales-returns/${id}`);
  return response.data;
};

/**
 * Create a new sales return
 * @param {Object} data - Sales return data
 * @returns {Promise} - Created sales return
 */
export const createSalesReturn = async (data) => {
  const response = await axiosInstance.post('/sales/sales-returns', data);
  return response.data;
};

/**
 * Update an existing sales return
 * @param {string} id - Sales return ID
 * @param {Object} data - Updated sales return data
 * @returns {Promise} - Updated sales return
 */
export const updateSalesReturn = async (id, data) => {
  const response = await axiosInstance.put(`/sales/sales-returns/${id}`, data);
  return response.data;
};

/**
 * Delete a sales return
 * @param {string} id - Sales return ID
 * @returns {Promise} - Deletion confirmation
 */
export const deleteSalesReturn = async (id) => {
  const response = await axiosInstance.delete(`/sales/sales-returns/${id}`);
  return response.data;
};

/**
 * Approve a sales return
 * @param {string} id - Sales return ID
 * @returns {Promise} - Approved sales return
 */
export const approveSalesReturn = async (id) => {
  const response = await axiosInstance.put(`/sales/sales-returns/${id}/approve`);
  return response.data;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Format sales data for API submission
 * @param {Object} formData - Raw form data
 * @param {string} type - Type of document (quotation, order, challan, return)
 * @returns {Object} - Formatted data for API
 */
export const formatSalesDataForAPI = (formData, type) => {
  const baseData = {
    customerId: formData.customerId,
    customerName: formData.billToName || formData.customerName,
    customerAddress: formData.billToAddress,
    customerEmail: formData.customerEmail,
    customerPhone: formData.customerPhone,
    shippingAddress: formData.shipToAddress,
    items: formData.items.map(item => ({
      productId: item.productId || item.id,
      description: item.description || item.name,
      quantity: parseFloat(item.qty || item.quantity),
      unitPrice: parseFloat(item.rate || item.price || item.unitPrice),  // Backend expects unitPrice
      taxRate: parseFloat(item.tax || item.taxPercent || item.taxRate || 0),  // Backend expects taxRate (percentage)
      discountAmount: parseFloat(item.discount || item.discountAmount || 0)  // Backend expects discountAmount
      // Note: amount is calculated by backend, don't send it
    })),
    subtotal: parseFloat(formData.subtotal || 0),
    taxAmount: parseFloat(formData.tax || formData.taxAmount || 0),
    discountAmount: parseFloat(formData.discount || formData.discountAmount || 0),
    total: parseFloat(formData.total || formData.totalAmount || 0),
    notes: formData.notes || '',
    terms: formData.terms || '',
    status: formData.status || 'DRAFT'
  };

  switch (type) {
    case 'quotation':
      return {
        ...baseData,
        quotationNumber: formData.quotationNo,
        quotationDate: formData.quotationDate,
        validTill: formData.validTill,
        referenceNo: formData.referenceNo
      };

    case 'order':
      return {
        ...baseData,
        orderNumber: formData.salesOrderNo || formData.orderNo,
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate,
        quotationId: formData.quotationId
      };

    case 'challan':
      return {
        ...baseData,
        challanNumber: formData.challanNo,
        challanDate: formData.challanDate,
        salesOrderId: formData.salesOrderId,
        vehicleNo: formData.vehicleNo,
        driverName: formData.driverName,
        driverPhone: formData.driverPhone,
        transportMode: formData.transportMode
      };

    case 'return':
      return {
        ...baseData,
        returnNumber: formData.returnNo,
        returnDate: formData.returnDate,
        invoiceId: formData.invoiceId,
        reason: formData.reason,
        refundAmount: parseFloat(formData.refundAmount || formData.total),
        items: formData.items.map(item => ({
          ...item,
          returnQuantity: parseFloat(item.returnQty || item.quantity),
          returnReason: item.returnReason || formData.reason
        }))
      };

    default:
      return baseData;
  }
};

export default {
  // Quotations
  getSalesQuotations,
  getSalesQuotationById,
  createSalesQuotation,
  updateSalesQuotation,
  deleteSalesQuotation,
  updateQuotationStatus,

  // Sales Orders
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  updateSalesOrderStatus,
  convertSalesOrderToInvoice,

  // Delivery Challans
  getDeliveryChallans,
  getDeliveryChallanById,
  createDeliveryChallan,
  updateDeliveryChallan,
  deleteDeliveryChallan,

  // Sales Returns
  getSalesReturns,
  getSalesReturnById,
  createSalesReturn,
  updateSalesReturn,
  deleteSalesReturn,
  approveSalesReturn,

  // Helpers
  formatSalesDataForAPI
};
