/**
 * Purchase Order Service
 * Business logic for purchase order management operations
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, PAGINATION, DOCUMENT_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Generate next order number
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Next order number
 */
const generateOrderNumber = async (companyId) => {
  const lastOrder = await prisma.purchaseOrder.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastOrder) {
    return 'PO-0001';
  }

  const lastNumber = parseInt(lastOrder.orderNumber.split('-')[1]);
  return `PO-${String(lastNumber + 1).padStart(4, '0')}`;
};

/**
 * Calculate order totals
 * @param {Array} items - Order items
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
 * Create a new purchase order
 * @param {Object} orderData - Order data
 * @param {string} userId - ID of user creating the order
 * @returns {Promise<Object>} Created order
 */
export const createPurchaseOrder = async (orderData, userId) => {
  const { companyId, vendorId, orderDate, expectedDeliveryDate, quotationId, items, notes, terms } = orderData;

  // Verify vendor exists
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId }
  });

  if (!vendor) {
    throw ApiError.notFound('Vendor not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Verify quotation if provided
  if (quotationId) {
    const quotation = await prisma.purchaseQuotation.findFirst({
      where: { id: quotationId, companyId }
    });

    if (!quotation) {
      throw ApiError.notFound('Purchase quotation not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }
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

  // Generate order number
  const orderNumber = await generateOrderNumber(companyId);

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
      receivedQty: 0,
      unitPrice: parseFloat(item.unitPrice),
      taxRate: parseFloat(item.taxRate) || 0,
      discountAmount: itemDiscount,
      amount
    };
  });

  // Create order with items
  const order = await prisma.purchaseOrder.create({
    data: {
      companyId,
      vendorId,
      orderNumber,
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      quotationId: quotationId || null,
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

  logger.info(`Purchase order created: ${orderNumber} by ${userId}`);

  return order;
};

/**
 * Get purchase order by ID
 * @param {string} orderId - Order ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Order details
 */
export const getPurchaseOrderById = async (orderId, companyId) => {
  const order = await prisma.purchaseOrder.findFirst({
    where: { id: orderId, companyId },
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
          taxNumber: true,
          paymentTerms: true
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
      goodsReceipts: {
        select: {
          id: true,
          receiptNumber: true,
          receiptDate: true,
          status: true
        }
      },
      bills: {
        select: {
          id: true,
          billNumber: true,
          billDate: true,
          status: true
        }
      }
    }
  });

  if (!order) {
    throw ApiError.notFound('Purchase order not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return order;
};

/**
 * Get purchase orders list with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Orders list with pagination
 */
export const getPurchaseOrders = async (filters) => {
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
    where.orderDate = {};
    if (startDate) {
      where.orderDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.orderDate.lte = new Date(endDate);
    }
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { vendor: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Get total count
  const total = await prisma.purchaseOrder.count({ where });

  // Get orders
  const orders = await prisma.purchaseOrder.findMany({
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
          id: true,
          quantity: true,
          receivedQty: true
        }
      }
    }
  });

  // Add item count and received status
  const ordersWithMeta = orders.map(order => {
    const totalOrdered = order.items.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
    const totalReceived = order.items.reduce((sum, item) => sum + parseFloat(item.receivedQty), 0);

    return {
      ...order,
      itemCount: order.items.length,
      totalOrdered,
      totalReceived,
      items: undefined
    };
  });

  return {
    orders: ordersWithMeta,
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
 * Update purchase order
 * @param {string} orderId - Order ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated order
 */
export const updatePurchaseOrder = async (orderId, companyId, updateData, userId) => {
  // Check if order exists
  const existingOrder = await prisma.purchaseOrder.findFirst({
    where: { id: orderId, companyId }
  });

  if (!existingOrder) {
    throw ApiError.notFound('Purchase order not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot update if approved or received
  if ([DOCUMENT_STATUS.APPROVED, DOCUMENT_STATUS.RECEIVED, DOCUMENT_STATUS.COMPLETED].includes(existingOrder.status)) {
    throw ApiError.badRequest('Cannot update approved or received order', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  const { vendorId, orderDate, expectedDeliveryDate, items, notes, terms, status } = updateData;

  // Verify vendor if being updated
  if (vendorId && vendorId !== existingOrder.vendorId) {
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
          receivedQty: 0,
          unitPrice: parseFloat(item.unitPrice),
          taxRate: parseFloat(item.taxRate) || 0,
          discountAmount: itemDiscount,
          amount
        };
      });

      // Delete existing items
      await tx.purchaseOrderItem.deleteMany({
        where: { orderId }
      });
    }

    // Update order
    const order = await tx.purchaseOrder.update({
      where: { id: orderId },
      data: {
        ...(vendorId && { vendorId }),
        ...(orderDate && { orderDate: new Date(orderDate) }),
        ...(expectedDeliveryDate !== undefined && { expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null }),
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

    logger.info(`Purchase order updated: ${orderId} by ${userId}`);

    return order;
  });
};

/**
 * Delete purchase order
 * @param {string} orderId - Order ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deletePurchaseOrder = async (orderId, companyId, userId) => {
  const order = await prisma.purchaseOrder.findFirst({
    where: { id: orderId, companyId },
    include: {
      items: true,
      goodsReceipts: true
    }
  });

  if (!order) {
    throw ApiError.notFound('Purchase order not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot delete if has goods receipts
  if (order.goodsReceipts.length > 0) {
    throw ApiError.badRequest('Cannot delete order with goods receipts', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Cannot delete if approved
  if (order.status === DOCUMENT_STATUS.APPROVED) {
    throw ApiError.badRequest('Cannot delete approved order', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Soft delete by setting status to CANCELLED
  await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: { status: DOCUMENT_STATUS.CANCELLED }
  });

  logger.info(`Purchase order deleted: ${orderId} by ${userId}`);
};

/**
 * Approve purchase order
 * @param {string} orderId - Order ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing approval
 * @returns {Promise<Object>} Approved order
 */
export const approvePurchaseOrder = async (orderId, companyId, userId) => {
  const order = await prisma.purchaseOrder.findFirst({
    where: { id: orderId, companyId }
  });

  if (!order) {
    throw ApiError.notFound('Purchase order not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Can only approve DRAFT or PENDING_APPROVAL orders
  if (![DOCUMENT_STATUS.DRAFT, DOCUMENT_STATUS.PENDING_APPROVAL].includes(order.status)) {
    throw ApiError.badRequest('Order cannot be approved in current status', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  const approvedOrder = await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: {
      status: DOCUMENT_STATUS.APPROVED,
      approvedBy: userId,
      approvedAt: new Date()
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

  logger.info(`Purchase order approved: ${orderId} by ${userId}`);

  return approvedOrder;
};

/**
 * Close purchase order
 * @param {string} orderId - Order ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing closure
 * @returns {Promise<Object>} Closed order
 */
export const closePurchaseOrder = async (orderId, companyId, userId) => {
  const order = await prisma.purchaseOrder.findFirst({
    where: { id: orderId, companyId }
  });

  if (!order) {
    throw ApiError.notFound('Purchase order not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Can only close approved or partially received orders
  if (![DOCUMENT_STATUS.APPROVED, DOCUMENT_STATUS.RECEIVED].includes(order.status)) {
    throw ApiError.badRequest('Order cannot be closed in current status', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  const closedOrder = await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: {
      status: DOCUMENT_STATUS.COMPLETED
    }
  });

  logger.info(`Purchase order closed: ${orderId} by ${userId}`);

  return closedOrder;
};

/**
 * Update order status based on received quantities
 * @param {string} orderId - Order ID
 * @param {Object} tx - Prisma transaction
 */
export const updateOrderStatus = async (orderId, tx) => {
  const order = await tx.purchaseOrder.findUnique({
    where: { id: orderId },
    include: {
      items: true
    }
  });

  if (!order) return;

  // Check if all items are fully received
  const allReceived = order.items.every(item =>
    parseFloat(item.receivedQty) >= parseFloat(item.quantity)
  );

  // Check if any items are partially received
  const anyReceived = order.items.some(item =>
    parseFloat(item.receivedQty) > 0
  );

  let newStatus = order.status;

  if (allReceived) {
    newStatus = DOCUMENT_STATUS.RECEIVED;
  } else if (anyReceived) {
    newStatus = DOCUMENT_STATUS.RECEIVED; // Using RECEIVED for partial as well (can create custom status)
  }

  if (newStatus !== order.status) {
    await tx.purchaseOrder.update({
      where: { id: orderId },
      data: { status: newStatus }
    });
  }
};

export default {
  createPurchaseOrder,
  getPurchaseOrderById,
  getPurchaseOrders,
  updatePurchaseOrder,
  deletePurchaseOrder,
  approvePurchaseOrder,
  closePurchaseOrder,
  updateOrderStatus
};
