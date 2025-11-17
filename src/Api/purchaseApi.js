/**
 * Purchase API Service
 * Handles all purchase-related API calls for the accounting system
 */

import axiosInstance from './axiosInstance';

// ==================== PURCHASE QUOTATIONS ====================

export const getPurchaseQuotations = async (params = {}) => {
  const response = await axiosInstance.get('/purchases/quotations', { params });
  return response.data;
};

export const getPurchaseQuotationById = async (id) => {
  const response = await axiosInstance.get(`/purchases/quotations/${id}`);
  return response.data;
};

export const createPurchaseQuotation = async (data) => {
  const response = await axiosInstance.post('/purchases/quotations', data);
  return response.data;
};

export const updatePurchaseQuotation = async (id, data) => {
  const response = await axiosInstance.put(`/purchases/quotations/${id}`, data);
  return response.data;
};

export const deletePurchaseQuotation = async (id) => {
  const response = await axiosInstance.delete(`/purchases/quotations/${id}`);
  return response.data;
};

export const updatePurchaseQuotationStatus = async (id, status) => {
  const response = await axiosInstance.put(`/purchases/quotations/${id}/status`, { status });
  return response.data;
};

// ==================== PURCHASE ORDERS ====================

export const getPurchaseOrders = async (params = {}) => {
  const response = await axiosInstance.get('/purchases/purchase-orders', { params });
  return response.data;
};

export const getPurchaseOrderById = async (id) => {
  const response = await axiosInstance.get(`/purchases/purchase-orders/${id}`);
  return response.data;
};

export const createPurchaseOrder = async (data) => {
  const response = await axiosInstance.post('/purchases/purchase-orders', data);
  return response.data;
};

export const updatePurchaseOrder = async (id, data) => {
  const response = await axiosInstance.put(`/purchases/purchase-orders/${id}`, data);
  return response.data;
};

export const deletePurchaseOrder = async (id) => {
  const response = await axiosInstance.delete(`/purchases/purchase-orders/${id}`);
  return response.data;
};

export const updatePurchaseOrderStatus = async (id, status) => {
  const response = await axiosInstance.put(`/purchases/purchase-orders/${id}/status`, { status });
  return response.data;
};

export const convertPurchaseOrderToBill = async (id) => {
  const response = await axiosInstance.post(`/purchases/purchase-orders/${id}/convert-to-bill`);
  return response.data;
};

// ==================== GOODS RECEIPTS ====================

export const getGoodsReceipts = async (params = {}) => {
  const response = await axiosInstance.get('/purchases/goods-receipts', { params });
  return response.data;
};

export const getGoodsReceiptById = async (id) => {
  const response = await axiosInstance.get(`/purchases/goods-receipts/${id}`);
  return response.data;
};

export const createGoodsReceipt = async (data) => {
  const response = await axiosInstance.post('/purchases/goods-receipts', data);
  return response.data;
};

export const updateGoodsReceipt = async (id, data) => {
  const response = await axiosInstance.put(`/purchases/goods-receipts/${id}`, data);
  return response.data;
};

export const deleteGoodsReceipt = async (id) => {
  const response = await axiosInstance.delete(`/purchases/goods-receipts/${id}`);
  return response.data;
};

// ==================== PURCHASE RETURNS ====================

export const getPurchaseReturns = async (params = {}) => {
  const response = await axiosInstance.get('/purchases/purchase-returns', { params });
  return response.data;
};

export const getPurchaseReturnById = async (id) => {
  const response = await axiosInstance.get(`/purchases/purchase-returns/${id}`);
  return response.data;
};

export const createPurchaseReturn = async (data) => {
  const response = await axiosInstance.post('/purchases/purchase-returns', data);
  return response.data;
};

export const updatePurchaseReturn = async (id, data) => {
  const response = await axiosInstance.put(`/purchases/purchase-returns/${id}`, data);
  return response.data;
};

export const deletePurchaseReturn = async (id) => {
  const response = await axiosInstance.delete(`/purchases/purchase-returns/${id}`);
  return response.data;
};

export const approvePurchaseReturn = async (id) => {
  const response = await axiosInstance.put(`/purchases/purchase-returns/${id}/approve`);
  return response.data;
};

// ==================== HELPER FUNCTIONS ====================

export const formatPurchaseDataForAPI = (formData, type) => {
  const baseData = {
    supplierId: formData.supplierId || formData.vendorId,
    supplierName: formData.supplierName || formData.vendorName,
    supplierAddress: formData.supplierAddress || formData.vendorAddress,
    supplierEmail: formData.supplierEmail || formData.vendorEmail,
    supplierPhone: formData.supplierPhone || formData.vendorPhone,
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
        quotationNumber: formData.quotationNo || formData.purchaseQuotationNo,
        quotationDate: formData.quotationDate || formData.purchaseQuotationDate,
        validTill: formData.validTill,
        referenceNo: formData.referenceNo
      };

    case 'order':
      return {
        ...baseData,
        orderNumber: formData.purchaseOrderNo || formData.orderNo,
        orderDate: formData.orderDate || formData.purchaseOrderDate,
        deliveryDate: formData.deliveryDate,
        quotationId: formData.quotationId,
        expectedDeliveryDate: formData.expectedDeliveryDate
      };

    case 'receipt':
      return {
        ...baseData,
        receiptNumber: formData.receiptNo || formData.goodsReceiptNo,
        receiptDate: formData.receiptDate || formData.goodsReceiptDate,
        purchaseOrderId: formData.purchaseOrderId,
        vehicleNo: formData.vehicleNo,
        driverName: formData.driverName,
        driverPhone: formData.driverPhone,
        warehouseId: formData.warehouseId,
        items: formData.items.map(item => ({
          ...item,
          receivedQuantity: parseFloat(item.receivedQty || item.quantity),
          acceptedQuantity: parseFloat(item.acceptedQty || item.receivedQty || item.quantity),
          rejectedQuantity: parseFloat(item.rejectedQty || 0),
          damageQuantity: parseFloat(item.damageQty || 0)
        }))
      };

    case 'return':
      return {
        ...baseData,
        returnNumber: formData.returnNo || formData.purchaseReturnNo,
        returnDate: formData.returnDate || formData.purchaseReturnDate,
        billId: formData.billId,
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
  getPurchaseQuotations,
  getPurchaseQuotationById,
  createPurchaseQuotation,
  updatePurchaseQuotation,
  deletePurchaseQuotation,
  updatePurchaseQuotationStatus,

  // Purchase Orders
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  updatePurchaseOrderStatus,
  convertPurchaseOrderToBill,

  // Goods Receipts
  getGoodsReceipts,
  getGoodsReceiptById,
  createGoodsReceipt,
  updateGoodsReceipt,
  deleteGoodsReceipt,

  // Purchase Returns
  getPurchaseReturns,
  getPurchaseReturnById,
  createPurchaseReturn,
  updatePurchaseReturn,
  deletePurchaseReturn,
  approvePurchaseReturn,

  // Helpers
  formatPurchaseDataForAPI
};
