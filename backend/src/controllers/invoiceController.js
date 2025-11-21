/**
 * Invoice Controller
 * Handles invoice CRUD operations
 */

import prisma from '../config/database.js';
import logger from '../config/logger.js';
import ApiError from '../utils/ApiError.js';

/**
 * Create new invoice
 */
export const createInvoice = async (req, res, next) => {
  try {
    const { customerId, invoiceDate, dueDate, items, ...otherData } = req.body;
    const companyId = req.user.companyId;

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { companyId },
      orderBy: { invoiceNumber: 'desc' }
    });

    const nextNumber = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.replace(/\D/g, '')) + 1
      : 1;
    const invoiceNumber = `INV-${String(nextNumber).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    items.forEach(item => {
      const itemAmount = item.quantity * item.unitPrice;
      const itemTax = itemAmount * (item.taxRate / 100);
      subtotal += itemAmount;
      taxAmount += itemTax;
      discountAmount += item.discountAmount || 0;
    });

    const total = subtotal + taxAmount - discountAmount;

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        customerId,
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        taxAmount,
        discountAmount,
        total,
        balanceAmount: total,
        ...otherData,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            discountAmount: item.discountAmount || 0,
            amount: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        items: { include: { product: true } },
        customer: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    logger.error('Create invoice error:', error);
    next(new ApiError(500, 'Failed to create invoice'));
  }
};

/**
 * Get all invoices with filters
 */
export const getInvoices = async (req, res, next) => {
  try {
    const { companyId } = req.query;
    const { page = 1, limit = 10, status, customerId, startDate, endDate } = req.query;

    const where = {
      companyId: companyId || req.user.companyId
    };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) where.invoiceDate.lte = new Date(endDate);
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: true,
          items: { include: { product: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.invoice.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get invoices error:', error);
    next(new ApiError(500, 'Failed to fetch invoices'));
  }
};

/**
 * Get invoice by ID
 */
export const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    logger.error('Get invoice error:', error);
    next(error);
  }
};

/**
 * Update invoice
 */
export const updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const updateData = req.body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    logger.error('Update invoice error:', error);
    next(new ApiError(500, 'Failed to update invoice'));
  }
};

/**
 * Delete invoice
 */
export const deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    await prisma.invoice.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    logger.error('Delete invoice error:', error);
    next(new ApiError(500, 'Failed to delete invoice'));
  }
};
