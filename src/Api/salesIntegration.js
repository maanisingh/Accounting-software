/**
 * Sales Integration Helper
 * Handles API calls for the Multi-Step Sales Form
 */

import { toast } from 'react-toastify';
import {
  createSalesOrder,
  createDeliveryChallan,
  formatSalesDataForAPI
} from './salesApi';
import axiosInstance from './axiosInstance';

/**
 * Save Sales Order to backend
 * @param {Object} formData - Complete form data
 * @param {Object} documentIds - Existing document IDs
 * @param {Function} setDocumentIds - Function to update document IDs
 * @returns {Promise<Object>} - Created sales order
 */
export const saveSalesOrder = async (formData, documentIds, setDocumentIds) => {
  try {
    const apiData = formatSalesDataForAPI({
      ...formData.salesOrder,
      quotationId: documentIds.quotationId,
      customerId: formData.quotation.customerId || null
    }, 'order');

    const response = await createSalesOrder(apiData);

    if (response.success) {
      // Store the order ID for next step
      setDocumentIds(prev => ({
        ...prev,
        salesOrderId: response.data.id
      }));

      toast.success('Sales Order saved successfully!');
      return response.data;
    } else {
      toast.error(response.message || 'Failed to save Sales Order');
      throw new Error(response.message);
    }
  } catch (error) {
    console.error('Sales Order save error:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Failed to save Sales Order';
    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Save Delivery Challan to backend
 * @param {Object} formData - Complete form data
 * @param {Object} documentIds - Existing document IDs
 * @param {Function} setDocumentIds - Function to update document IDs
 * @returns {Promise<Object>} - Created delivery challan
 */
export const saveDeliveryChallan = async (formData, documentIds, setDocumentIds) => {
  try {
    const apiData = formatSalesDataForAPI({
      ...formData.deliveryChallan,
      salesOrderId: documentIds.salesOrderId
    }, 'challan');

    const response = await createDeliveryChallan(apiData);

    if (response.success) {
      setDocumentIds(prev => ({
        ...prev,
        challanId: response.data.id
      }));

      toast.success('Delivery Challan saved successfully!');
      return response.data;
    } else {
      toast.error(response.message || 'Failed to save Delivery Challan');
      throw new Error(response.message);
    }
  } catch (error) {
    console.error('Delivery Challan save error:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Failed to save Delivery Challan';
    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Save Invoice to backend
 * @param {Object} formData - Complete form data
 * @param {Object} documentIds - Existing document IDs
 * @param {Function} setDocumentIds - Function to update document IDs
 * @returns {Promise<Object>} - Created invoice
 */
export const saveInvoice = async (formData, documentIds, setDocumentIds) => {
  try {
    // Invoice uses the existing invoices endpoint, not our new sales endpoint
    // So we'll call the existing endpoint structure
    const invoiceData = {
      company_id: formData.invoice.companyId || localStorage.getItem('companyId'),
      customer_name: formData.invoice.customerName,
      customer_address: formData.invoice.customerAddress,
      customer_email: formData.invoice.customerEmail,
      customer_phone: formData.invoice.customerPhone,
      invoice_no: formData.invoice.invoiceNo,
      invoice_date: formData.invoice.invoiceDate,
      due_date: formData.invoice.dueDate,
      items: formData.invoice.items.map(item => ({
        description: item.description,
        quantity: item.qty,
        rate: item.rate,
        tax: item.tax || 0,
        discount: item.discount || 0,
        amount: item.amount
      })),
      subtotal: formData.invoice.subtotal || calculateSubtotal(formData.invoice.items),
      tax: formData.invoice.tax || 0,
      discount: formData.invoice.discount || 0,
      total: formData.invoice.total || calculateTotal(formData.invoice.items),
      notes: formData.invoice.notes || '',
      terms: formData.invoice.terms || '',
      challan_id: documentIds.challanId, // Link to delivery challan
      status: 'UNPAID'
    };

    const response = await axiosInstance.post('/invoices', invoiceData);

    if (response.data.success) {
      setDocumentIds(prev => ({
        ...prev,
        invoiceId: response.data.data.id
      }));

      toast.success('Invoice saved successfully!');
      return response.data.data;
    } else {
      toast.error(response.data.message || 'Failed to save Invoice');
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Invoice save error:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Failed to save Invoice';
    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Save Payment to backend
 * @param {Object} formData - Complete form data
 * @param {Object} documentIds - Existing document IDs
 * @param {Function} setDocumentIds - Function to update document IDs
 * @returns {Promise<Object>} - Created payment
 */
export const savePayment = async (formData, documentIds, setDocumentIds) => {
  try {
    const paymentData = {
      company_id: formData.payment.companyId || localStorage.getItem('companyId'),
      invoice_id: documentIds.invoiceId,
      payment_no: formData.payment.paymentNo,
      payment_date: formData.payment.paymentDate,
      payment_method: formData.payment.paymentMethod || 'cash',
      amount: parseFloat(formData.payment.amount),
      reference_no: formData.payment.referenceNo || '',
      notes: formData.payment.notes || '',
      status: 'COMPLETED'
    };

    const response = await axiosInstance.post('/payments', paymentData);

    if (response.data.success) {
      setDocumentIds(prev => ({
        ...prev,
        paymentId: response.data.data.id
      }));

      toast.success('Payment recorded successfully!');
      return response.data.data;
    } else {
      toast.error(response.data.message || 'Failed to record Payment');
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Payment save error:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Failed to record Payment';
    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Helper function to calculate subtotal
 */
const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
};

/**
 * Helper function to calculate total with tax and discount
 */
const calculateTotal = (items) => {
  const subtotal = calculateSubtotal(items);
  const tax = items.reduce((sum, item) => sum + (parseFloat(item.tax) || 0), 0);
  const discount = items.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0);
  return subtotal + tax - discount;
};

/**
 * Validate form data before submission
 */
export const validateSalesOrder = (formData) => {
  const errors = [];

  if (!formData.salesOrder.customerName) {
    errors.push('Customer name is required');
  }

  if (!formData.salesOrder.items || formData.salesOrder.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (!formData.salesOrder.orderDate) {
    errors.push('Order date is required');
  }

  return errors;
};

export const validateDeliveryChallan = (formData) => {
  const errors = [];

  if (!formData.deliveryChallan.billToName) {
    errors.push('Customer name is required');
  }

  if (!formData.deliveryChallan.items || formData.deliveryChallan.items.length === 0) {
    errors.push('At least one item is required');
  }

  return errors;
};

export const validateInvoice = (formData) => {
  const errors = [];

  if (!formData.invoice.customerName) {
    errors.push('Customer name is required');
  }

  if (!formData.invoice.items || formData.invoice.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (!formData.invoice.invoiceDate) {
    errors.push('Invoice date is required');
  }

  return errors;
};

export const validatePayment = (formData) => {
  const errors = [];

  if (!formData.payment.amount || parseFloat(formData.payment.amount) <= 0) {
    errors.push('Payment amount must be greater than 0');
  }

  if (!formData.payment.paymentMethod) {
    errors.push('Payment method is required');
  }

  return errors;
};

export default {
  saveSalesOrder,
  saveDeliveryChallan,
  saveInvoice,
  savePayment,
  validateSalesOrder,
  validateDeliveryChallan,
  validateInvoice,
  validatePayment
};
