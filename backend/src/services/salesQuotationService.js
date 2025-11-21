/**
 * Sales Quotation Service
 * Business logic for sales quotation management operations
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, PAGINATION, DOCUMENT_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Generate next quotation number
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Next quotation number
 */
const generateQuotationNumber = async (companyId) => {
  const lastQuotation = await prisma.salesQuotation.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastQuotation) {
    return 'SQ-0001';
  }

  const lastNumber = parseInt(lastQuotation.quotationNumber.split('-')[1]);
  return `SQ-${String(lastNumber + 1).padStart(4, '0')}`;
};

/**
 * Calculate quotation totals
 * @param {Array} items - Quotation items
 * @returns {Object} Calculated totals
 */
const calculateTotals = (items) => {
  let subtotal = 0;
  let taxAmount = 0;
  let discountAmount = 0;

  items.forEach(item => {
    const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
    const itemDiscount = parseFloat(item.discountAmount) || 0;
    const itemTaxableAmount = itemSubtotal - itemDiscount;
    const itemTax = (itemTaxableAmount * parseFloat(item.taxRate)) / 100;

    subtotal += itemSubtotal;
    discountAmount += itemDiscount;
    taxAmount += itemTax;
  });

  const total = subtotal - discountAmount + taxAmount;

  return {
    subtotal,
    taxAmount,
    discountAmount,
    total
  };
};

/**
 * Create a new sales quotation
 * @param {Object} quotationData - Quotation data
 * @param {string} userId - ID of user creating the quotation
 * @returns {Promise<Object>} Created quotation
 */
export const createSalesQuotation = async (quotationData, userId) => {
  const { companyId, customerId, quotationDate, validTill, referenceNo, shippingAddress, items, notes, terms } = quotationData;

  // Verify customer exists
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId }
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  if (!customer.isActive) {
    throw ApiError.badRequest('Customer is inactive', ERROR_CODES.VALIDATION_ERROR);
  }

  // Verify all products exist and are saleable
  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, companyId }
    });

    if (!product) {
      throw ApiError.notFound(`Product ${item.productId} not found`, ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

    if (!product.isActive) {
      throw ApiError.badRequest(`Product ${product.name} is inactive`, ERROR_CODES.VALIDATION_ERROR);
    }

    if (!product.isSaleable) {
      throw ApiError.badRequest(`Product ${product.name} is not saleable`, ERROR_CODES.VALIDATION_ERROR);
    }
  }

  // Generate quotation number
  const quotationNumber = await generateQuotationNumber(companyId);

  // Calculate totals
  const totals = calculateTotals(items);

  // Calculate item amounts
  const itemsWithAmounts = items.map(item => {
    const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
    const itemDiscount = parseFloat(item.discountAmount) || 0;
    const itemTaxableAmount = itemSubtotal - itemDiscount;
    const itemTax = (itemTaxableAmount * parseFloat(item.taxRate)) / 100;
    const amount = itemTaxableAmount + itemTax;

    return {
      productId: item.productId,
      description: item.description || null,
      quantity: parseFloat(item.quantity),
      unitPrice: parseFloat(item.unitPrice),
      taxRate: parseFloat(item.taxRate) || 0,
      discountAmount: itemDiscount,
      amount
    };
  });

  // Create quotation with items
  const quotation = await prisma.salesQuotation.create({
    data: {
      companyId,
      customerId,
      quotationNumber,
      quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
      validTill: validTill ? new Date(validTill) : null,
      referenceNo: referenceNo || null,
      shippingAddress: shippingAddress || null,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: totals.discountAmount,
      total: totals.total,
      status: DOCUMENT_STATUS.DRAFT,
      notes: notes || null,
      terms: terms || null,
      createdBy: userId,
      items: {
        create: itemsWithAmounts
      }
    },
    include: {
      customer: {
        select: {
          id: true,
          customerNumber: true,
          name: true,
          email: true,
          phone: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: true
            }
          }
        }
      }
    }
  });

  logger.info(`Sales quotation created: ${quotationNumber} by ${userId}`);

  return quotation;
};

/**
 * Get sales quotation by ID
 * @param {string} quotationId - Quotation ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Quotation details
 */
export const getSalesQuotationById = async (quotationId, companyId) => {
  const quotation = await prisma.salesQuotation.findFirst({
    where: { id: quotationId, companyId },
    include: {
      customer: {
        select: {
          id: true,
          customerNumber: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          taxNumber: true,
          creditLimit: true,
          creditDays: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: true,
              hsnCode: true
            }
          }
        }
      },
      salesOrders: {
        select: {
          id: true,
          orderNumber: true,
          orderDate: true,
          status: true
        }
      }
    }
  });

  if (!quotation) {
    throw ApiError.notFound('Sales quotation not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return quotation;
};

/**
 * Get sales quotations list with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Quotations list with pagination
 */
export const getSalesQuotations = async (filters) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search,
    customerId,
    status,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    companyId
  } = filters;

  // Build where clause
  const where = { companyId };

  if (customerId) {
    where.customerId = customerId;
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.quotationDate = {};
    if (startDate) {
      where.quotationDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.quotationDate.lte = new Date(endDate);
    }
  }

  if (search) {
    where.OR = [
      { quotationNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Get total count
  const total = await prisma.salesQuotation.count({ where });

  // Get quotations
  const quotations = await prisma.salesQuotation.findMany({
    where,
    skip,
    take,
    orderBy: { [sortBy]: sortOrder },
    include: {
      customer: {
        select: {
          id: true,
          customerNumber: true,
          name: true
        }
      },
      items: {
        select: {
          id: true,
          quantity: true
        }
      }
    }
  });

  // Add item count
  const quotationsWithMeta = quotations.map(quotation => ({
    ...quotation,
    itemCount: quotation.items.length,
    items: undefined
  }));

  return {
    quotations: quotationsWithMeta,
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
      hasNextPage: page < Math.ceil(total / take),
      hasPrevPage: page > 1
    }
  };
};

/**
 * Update sales quotation
 * @param {string} quotationId - Quotation ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated quotation
 */
export const updateSalesQuotation = async (quotationId, companyId, updateData, userId) => {
  // Check if quotation exists
  const existingQuotation = await prisma.salesQuotation.findFirst({
    where: { id: quotationId, companyId }
  });

  if (!existingQuotation) {
    throw ApiError.notFound('Sales quotation not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot update if converted to order
  if (existingQuotation.status === DOCUMENT_STATUS.COMPLETED) {
    throw ApiError.badRequest('Cannot update converted quotation', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  const { customerId, quotationDate, validTill, referenceNo, shippingAddress, items, notes, terms, status } = updateData;

  // Verify customer if being updated
  if (customerId && customerId !== existingQuotation.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId }
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

    if (!customer.isActive) {
      throw ApiError.badRequest('Customer is inactive', ERROR_CODES.VALIDATION_ERROR);
    }
  }

  return await prisma.$transaction(async (tx) => {
    let totals = null;
    let itemsWithAmounts = null;

    // If items are being updated, recalculate totals
    if (items) {
      // Verify all products exist
      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, companyId }
        });

        if (!product) {
          throw ApiError.notFound(`Product ${item.productId} not found`, ERROR_CODES.DB_RECORD_NOT_FOUND);
        }

        if (!product.isActive || !product.isSaleable) {
          throw ApiError.badRequest(`Product ${product.name} is not available for sale`, ERROR_CODES.VALIDATION_ERROR);
        }
      }

      // Calculate totals
      totals = calculateTotals(items);

      // Calculate item amounts
      itemsWithAmounts = items.map(item => {
        const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
        const itemDiscount = parseFloat(item.discountAmount) || 0;
        const itemTaxableAmount = itemSubtotal - itemDiscount;
        const itemTax = (itemTaxableAmount * parseFloat(item.taxRate)) / 100;
        const amount = itemTaxableAmount + itemTax;

        return {
          productId: item.productId,
          description: item.description || null,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          taxRate: parseFloat(item.taxRate) || 0,
          discountAmount: itemDiscount,
          amount
        };
      });

      // Delete existing items
      await tx.salesQuotationItem.deleteMany({
        where: { quotationId }
      });
    }

    // Update quotation
    const quotation = await tx.salesQuotation.update({
      where: { id: quotationId },
      data: {
        ...(customerId && { customerId }),
        ...(quotationDate && { quotationDate: new Date(quotationDate) }),
        ...(validTill !== undefined && { validTill: validTill ? new Date(validTill) : null }),
        ...(referenceNo !== undefined && { referenceNo: referenceNo || null }),
        ...(shippingAddress !== undefined && { shippingAddress: shippingAddress || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(terms !== undefined && { terms: terms || null }),
        ...(status && { status }),
        ...(totals && {
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          total: totals.total
        }),
        ...(itemsWithAmounts && {
          items: {
            create: itemsWithAmounts
          }
        })
      },
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unit: true
              }
            }
          }
        }
      }
    });

    logger.info(`Sales quotation updated: ${quotationId} by ${userId}`);

    return quotation;
  });
};

/**
 * Delete sales quotation
 * @param {string} quotationId - Quotation ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deleteSalesQuotation = async (quotationId, companyId, userId) => {
  const quotation = await prisma.salesQuotation.findFirst({
    where: { id: quotationId, companyId },
    include: {
      salesOrders: true
    }
  });

  if (!quotation) {
    throw ApiError.notFound('Sales quotation not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot delete if has sales orders
  if (quotation.salesOrders.length > 0) {
    throw ApiError.badRequest('Cannot delete quotation with sales orders', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Cannot delete if already sent to customer
  if ([DOCUMENT_STATUS.SENT, DOCUMENT_STATUS.APPROVED, DOCUMENT_STATUS.COMPLETED].includes(quotation.status)) {
    throw ApiError.badRequest('Cannot delete sent or approved quotation', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Soft delete by setting status to CANCELLED
  await prisma.salesQuotation.update({
    where: { id: quotationId },
    data: { status: DOCUMENT_STATUS.CANCELLED }
  });

  logger.info(`Sales quotation deleted: ${quotationId} by ${userId}`);
};

/**
 * Convert sales quotation to sales order
 * @param {string} quotationId - Quotation ID
 * @param {string} companyId - Company ID
 * @param {Object} orderData - Additional order data
 * @param {string} userId - ID of user performing conversion
 * @returns {Promise<Object>} Created sales order
 */
export const convertToSalesOrder = async (quotationId, companyId, orderData, userId) => {
  const quotation = await prisma.salesQuotation.findFirst({
    where: { id: quotationId, companyId },
    include: {
      items: {
        include: {
          product: true
        }
      },
      customer: true
    }
  });

  if (!quotation) {
    throw ApiError.notFound('Sales quotation not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Check if quotation is in valid status
  if (![DOCUMENT_STATUS.DRAFT, DOCUMENT_STATUS.SENT, DOCUMENT_STATUS.APPROVED].includes(quotation.status)) {
    throw ApiError.badRequest('Quotation cannot be converted in current status', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Check if already converted
  if (quotation.status === DOCUMENT_STATUS.COMPLETED) {
    throw ApiError.badRequest('Quotation already converted to sales order', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Import the sales order service to avoid circular dependency
  const { createSalesOrder } = await import('./salesOrderService.js');

  // Prepare order data from quotation
  const salesOrderData = {
    companyId,
    customerId: quotation.customerId,
    quotationId: quotation.id,
    orderDate: orderData.orderDate || new Date(),
    deliveryDate: orderData.deliveryDate || null,
    shippingAddress: orderData.shippingAddress || quotation.shippingAddress,
    items: quotation.items.map(item => ({
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      discountAmount: item.discountAmount
    })),
    notes: orderData.notes || quotation.notes,
    terms: orderData.terms || quotation.terms
  };

  return await prisma.$transaction(async (tx) => {
    // Create the sales order
    const salesOrder = await createSalesOrder(salesOrderData, userId);

    // Update quotation status to COMPLETED
    await tx.salesQuotation.update({
      where: { id: quotationId },
      data: { status: DOCUMENT_STATUS.COMPLETED }
    });

    logger.info(`Sales quotation ${quotation.quotationNumber} converted to sales order ${salesOrder.orderNumber} by ${userId}`);

    return salesOrder;
  });
};

export default {
  createSalesQuotation,
  getSalesQuotationById,
  getSalesQuotations,
  updateSalesQuotation,
  deleteSalesQuotation,
  convertToSalesOrder
};
