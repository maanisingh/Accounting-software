/**
 * Purchase Quotation Service
 * Business logic for purchase quotation management operations
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
  const lastQuotation = await prisma.purchaseQuotation.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastQuotation) {
    return 'PQ-0001';
  }

  const lastNumber = parseInt(lastQuotation.quotationNumber.split('-')[1]);
  return `PQ-${String(lastNumber + 1).padStart(4, '0')}`;
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
 * Create a new purchase quotation
 * @param {Object} quotationData - Quotation data
 * @param {string} userId - ID of user creating the quotation
 * @returns {Promise<Object>} Created quotation
 */
export const createPurchaseQuotation = async (quotationData, userId) => {
  const { companyId, vendorId, quotationDate, validTill, referenceNo, items, notes, terms } = quotationData;

  // Verify vendor exists
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId }
  });

  if (!vendor) {
    throw ApiError.notFound('Vendor not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Verify all products exist
  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, companyId }
    });

    if (!product) {
      throw ApiError.notFound(`Product ${item.productId} not found`, ERROR_CODES.DB_RECORD_NOT_FOUND);
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
  const quotation = await prisma.purchaseQuotation.create({
    data: {
      companyId,
      vendorId,
      quotationNumber,
      quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
      validTill: validTill ? new Date(validTill) : null,
      referenceNo: referenceNo || null,
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
      vendor: {
        select: {
          id: true,
          vendorNumber: true,
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

  logger.info(`Purchase quotation created: ${quotationNumber} by ${userId}`);

  return quotation;
};

/**
 * Get purchase quotation by ID
 * @param {string} quotationId - Quotation ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Quotation details
 */
export const getPurchaseQuotationById = async (quotationId, companyId) => {
  const quotation = await prisma.purchaseQuotation.findFirst({
    where: { id: quotationId, companyId },
    include: {
      vendor: {
        select: {
          id: true,
          vendorNumber: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          taxNumber: true
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
      }
    }
  });

  if (!quotation) {
    throw ApiError.notFound('Purchase quotation not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return quotation;
};

/**
 * Get purchase quotations list with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Quotations list with pagination
 */
export const getPurchaseQuotations = async (filters) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search,
    vendorId,
    status,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    companyId
  } = filters;

  // Build where clause
  const where = { companyId };

  if (vendorId) {
    where.vendorId = vendorId;
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
      { referenceNo: { contains: search, mode: 'insensitive' } },
      { vendor: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Get total count
  const total = await prisma.purchaseQuotation.count({ where });

  // Get quotations
  const quotations = await prisma.purchaseQuotation.findMany({
    where,
    skip,
    take,
    orderBy: { [sortBy]: sortOrder },
    include: {
      vendor: {
        select: {
          id: true,
          vendorNumber: true,
          name: true
        }
      },
      items: {
        select: {
          id: true
        }
      }
    }
  });

  // Add item count
  const quotationsWithCount = quotations.map(quotation => ({
    ...quotation,
    itemCount: quotation.items.length,
    items: undefined
  }));

  return {
    quotations: quotationsWithCount,
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
 * Update purchase quotation
 * @param {string} quotationId - Quotation ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated quotation
 */
export const updatePurchaseQuotation = async (quotationId, companyId, updateData, userId) => {
  // Check if quotation exists
  const existingQuotation = await prisma.purchaseQuotation.findFirst({
    where: { id: quotationId, companyId }
  });

  if (!existingQuotation) {
    throw ApiError.notFound('Purchase quotation not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot update if already converted
  if (existingQuotation.status === DOCUMENT_STATUS.COMPLETED) {
    throw ApiError.badRequest('Cannot update converted quotation', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  const { vendorId, quotationDate, validTill, referenceNo, items, notes, terms, status } = updateData;

  // Verify vendor if being updated
  if (vendorId && vendorId !== existingQuotation.vendorId) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, companyId }
    });

    if (!vendor) {
      throw ApiError.notFound('Vendor not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
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
      await tx.purchaseQuotationItem.deleteMany({
        where: { quotationId }
      });
    }

    // Update quotation
    const quotation = await tx.purchaseQuotation.update({
      where: { id: quotationId },
      data: {
        ...(vendorId && { vendorId }),
        ...(quotationDate && { quotationDate: new Date(quotationDate) }),
        ...(validTill !== undefined && { validTill: validTill ? new Date(validTill) : null }),
        ...(referenceNo !== undefined && { referenceNo: referenceNo || null }),
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
        vendor: {
          select: {
            id: true,
            vendorNumber: true,
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

    logger.info(`Purchase quotation updated: ${quotationId} by ${userId}`);

    return quotation;
  });
};

/**
 * Delete purchase quotation
 * @param {string} quotationId - Quotation ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deletePurchaseQuotation = async (quotationId, companyId, userId) => {
  const quotation = await prisma.purchaseQuotation.findFirst({
    where: { id: quotationId, companyId }
  });

  if (!quotation) {
    throw ApiError.notFound('Purchase quotation not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot delete if converted
  if (quotation.status === DOCUMENT_STATUS.COMPLETED) {
    throw ApiError.badRequest('Cannot delete converted quotation', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Soft delete by setting status to CANCELLED
  await prisma.purchaseQuotation.update({
    where: { id: quotationId },
    data: { status: DOCUMENT_STATUS.CANCELLED }
  });

  logger.info(`Purchase quotation deleted: ${quotationId} by ${userId}`);
};

/**
 * Convert purchase quotation to purchase order
 * @param {string} quotationId - Quotation ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing conversion
 * @returns {Promise<Object>} Created purchase order
 */
export const convertToPurchaseOrder = async (quotationId, companyId, userId) => {
  const quotation = await prisma.purchaseQuotation.findFirst({
    where: { id: quotationId, companyId },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!quotation) {
    throw ApiError.notFound('Purchase quotation not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot convert if already converted or cancelled
  if (quotation.status === DOCUMENT_STATUS.COMPLETED) {
    throw ApiError.badRequest('Quotation already converted', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  if (quotation.status === DOCUMENT_STATUS.CANCELLED) {
    throw ApiError.badRequest('Cannot convert cancelled quotation', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  return await prisma.$transaction(async (tx) => {
    // Generate PO number
    const lastOrder = await tx.purchaseOrder.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    const orderNumber = lastOrder
      ? `PO-${String(parseInt(lastOrder.orderNumber.split('-')[1]) + 1).padStart(4, '0')}`
      : 'PO-0001';

    // Create purchase order
    const purchaseOrder = await tx.purchaseOrder.create({
      data: {
        companyId,
        vendorId: quotation.vendorId,
        orderNumber,
        orderDate: new Date(),
        quotationId,
        subtotal: quotation.subtotal,
        taxAmount: quotation.taxAmount,
        discountAmount: quotation.discountAmount,
        total: quotation.total,
        status: DOCUMENT_STATUS.DRAFT,
        notes: quotation.notes,
        terms: quotation.terms,
        createdBy: userId,
        items: {
          create: quotation.items.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            receivedQty: 0,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            discountAmount: item.discountAmount,
            amount: item.amount
          }))
        }
      },
      include: {
        vendor: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Update quotation status to COMPLETED
    await tx.purchaseQuotation.update({
      where: { id: quotationId },
      data: { status: DOCUMENT_STATUS.COMPLETED }
    });

    logger.info(`Purchase quotation ${quotationId} converted to PO ${orderNumber}`);

    return purchaseOrder;
  });
};

export default {
  createPurchaseQuotation,
  getPurchaseQuotationById,
  getPurchaseQuotations,
  updatePurchaseQuotation,
  deletePurchaseQuotation,
  convertToPurchaseOrder
};
