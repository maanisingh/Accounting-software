/**
 * Sales Order Service
 * Business logic for sales order management operations
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
  const lastOrder = await prisma.salesOrder.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastOrder) {
    return 'SO-0001';
  }

  const lastNumber = parseInt(lastOrder.orderNumber.split('-')[1]);
  return `SO-${String(lastNumber + 1).padStart(4, '0')}`;
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
 * Check credit limit for customer
 * @param {string} customerId - Customer ID
 * @param {number} orderTotal - Order total amount
 * @returns {Promise<void>}
 */
const checkCreditLimit = async (customerId, orderTotal) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Check credit limit
  const newBalance = parseFloat(customer.currentBalance) + parseFloat(orderTotal);

  if (parseFloat(customer.creditLimit) > 0 && newBalance > parseFloat(customer.creditLimit)) {
    throw ApiError.badRequest(
      `Credit limit exceeded. Available credit: ${parseFloat(customer.creditLimit) - parseFloat(customer.currentBalance)}`,
      ERROR_CODES.CREDIT_LIMIT_EXCEEDED
    );
  }
};

/**
 * Check product availability
 * @param {Array} items - Order items
 * @param {string} companyId - Company ID
 * @returns {Promise<void>}
 */
const checkProductAvailability = async (items, companyId) => {
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

    // Check stock if tracking inventory
    if (product.trackInventory) {
      const totalStock = await prisma.stock.aggregate({
        where: { productId: item.productId },
        _sum: {
          availableQty: true
        }
      });

      const availableQty = totalStock._sum.availableQty || 0;

      if (availableQty < parseFloat(item.quantity)) {
        throw ApiError.badRequest(
          `Insufficient stock for ${product.name}. Available: ${availableQty}, Required: ${item.quantity}`,
          ERROR_CODES.INSUFFICIENT_STOCK
        );
      }
    }
  }
};

/**
 * Create a new sales order
 * @param {Object} orderData - Order data
 * @param {string} userId - ID of user creating the order
 * @returns {Promise<Object>} Created order
 */
export const createSalesOrder = async (orderData, userId) => {
  const { companyId, customerId, orderDate, deliveryDate, quotationId, shippingAddress, items, notes, terms } = orderData;

  // Verify customer exists and is active
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId }
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  if (!customer.isActive) {
    throw ApiError.badRequest('Customer is inactive', ERROR_CODES.VALIDATION_ERROR);
  }

  // Verify quotation if provided
  if (quotationId) {
    const quotation = await prisma.salesQuotation.findFirst({
      where: { id: quotationId, companyId }
    });

    if (!quotation) {
      throw ApiError.notFound('Sales quotation not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }
  }

  // Check product availability
  await checkProductAvailability(items, companyId);

  // Calculate totals
  const totals = calculateTotals(items);

  // Check credit limit
  await checkCreditLimit(customerId, totals.total);

  // Generate order number
  const orderNumber = await generateOrderNumber(companyId);

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
      deliveredQty: 0,
      unitPrice: parseFloat(item.unitPrice),
      taxRate: parseFloat(item.taxRate) || 0,
      discountAmount: itemDiscount,
      amount
    };
  });

  // Create order with items
  const order = await prisma.salesOrder.create({
    data: {
      companyId,
      customerId,
      orderNumber,
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      quotationId: quotationId || null,
      shippingAddress: shippingAddress || customer.address || null,
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

  logger.info(`Sales order created: ${orderNumber} by ${userId}`);

  return order;
};

/**
 * Get sales order by ID
 * @param {string} orderId - Order ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Order details
 */
export const getSalesOrderById = async (orderId, companyId) => {
  const order = await prisma.salesOrder.findFirst({
    where: { id: orderId, companyId },
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
          creditDays: true,
          currentBalance: true
        }
      },
      quotation: {
        select: {
          id: true,
          quotationNumber: true,
          quotationDate: true
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
      deliveryChallans: {
        select: {
          id: true,
          challanNumber: true,
          challanDate: true,
          status: true
        }
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          status: true
        }
      }
    }
  });

  if (!order) {
    throw ApiError.notFound('Sales order not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return order;
};

/**
 * Get sales orders list with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Orders list with pagination
 */
export const getSalesOrders = async (filters) => {
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
      { customer: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Get total count
  const total = await prisma.salesOrder.count({ where });

  // Get orders
  const orders = await prisma.salesOrder.findMany({
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
          quantity: true,
          deliveredQty: true
        }
      }
    }
  });

  // Add item count and delivery status
  const ordersWithMeta = orders.map(order => {
    const totalOrdered = order.items.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
    const totalDelivered = order.items.reduce((sum, item) => sum + parseFloat(item.deliveredQty), 0);

    return {
      ...order,
      itemCount: order.items.length,
      totalOrdered,
      totalDelivered,
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
 * Update sales order
 * @param {string} orderId - Order ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated order
 */
export const updateSalesOrder = async (orderId, companyId, updateData, userId) => {
  // Check if order exists
  const existingOrder = await prisma.salesOrder.findFirst({
    where: { id: orderId, companyId }
  });

  if (!existingOrder) {
    throw ApiError.notFound('Sales order not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot update if completed or cancelled
  if ([DOCUMENT_STATUS.COMPLETED, DOCUMENT_STATUS.CANCELLED].includes(existingOrder.status)) {
    throw ApiError.badRequest('Cannot update completed or cancelled order', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  const { customerId, orderDate, deliveryDate, shippingAddress, items, notes, terms, status } = updateData;

  // Verify customer if being updated
  if (customerId && customerId !== existingOrder.customerId) {
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
      // Check product availability
      await checkProductAvailability(items, companyId);

      // Calculate totals
      totals = calculateTotals(items);

      // Check credit limit if customer or total changed
      const targetCustomerId = customerId || existingOrder.customerId;
      await checkCreditLimit(targetCustomerId, totals.total);

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
          deliveredQty: 0,
          unitPrice: parseFloat(item.unitPrice),
          taxRate: parseFloat(item.taxRate) || 0,
          discountAmount: itemDiscount,
          amount
        };
      });

      // Delete existing items
      await tx.salesOrderItem.deleteMany({
        where: { orderId }
      });
    }

    // Update order
    const order = await tx.salesOrder.update({
      where: { id: orderId },
      data: {
        ...(customerId && { customerId }),
        ...(orderDate && { orderDate: new Date(orderDate) }),
        ...(deliveryDate !== undefined && { deliveryDate: deliveryDate ? new Date(deliveryDate) : null }),
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

    logger.info(`Sales order updated: ${orderId} by ${userId}`);

    return order;
  });
};

/**
 * Delete sales order
 * @param {string} orderId - Order ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deleteSalesOrder = async (orderId, companyId, userId) => {
  const order = await prisma.salesOrder.findFirst({
    where: { id: orderId, companyId },
    include: {
      deliveryChallans: true,
      invoices: true
    }
  });

  if (!order) {
    throw ApiError.notFound('Sales order not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot delete if has delivery challans or invoices
  if (order.deliveryChallans.length > 0 || order.invoices.length > 0) {
    throw ApiError.badRequest('Cannot delete order with delivery challans or invoices', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Cannot delete if approved
  if ([DOCUMENT_STATUS.APPROVED, DOCUMENT_STATUS.COMPLETED].includes(order.status)) {
    throw ApiError.badRequest('Cannot delete approved or completed order', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Soft delete by setting status to CANCELLED
  await prisma.salesOrder.update({
    where: { id: orderId },
    data: { status: DOCUMENT_STATUS.CANCELLED }
  });

  logger.info(`Sales order deleted: ${orderId} by ${userId}`);
};

/**
 * Convert sales order to invoice
 * @param {string} orderId - Order ID
 * @param {string} companyId - Company ID
 * @param {Object} invoiceData - Additional invoice data
 * @param {string} userId - ID of user performing conversion
 * @returns {Promise<Object>} Created invoice
 */
export const convertToInvoice = async (orderId, companyId, invoiceData, userId) => {
  const order = await prisma.salesOrder.findFirst({
    where: { id: orderId, companyId },
    include: {
      items: {
        include: {
          product: true
        }
      },
      customer: true
    }
  });

  if (!order) {
    throw ApiError.notFound('Sales order not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Check if order is in valid status
  if (![DOCUMENT_STATUS.APPROVED, DOCUMENT_STATUS.RECEIVED].includes(order.status)) {
    throw ApiError.badRequest('Order must be approved before creating invoice', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Check if all items are delivered
  const allDelivered = order.items.every(item =>
    parseFloat(item.deliveredQty) >= parseFloat(item.quantity)
  );

  if (!allDelivered && !invoiceData.allowPartial) {
    throw ApiError.badRequest('All items must be delivered before creating invoice', ERROR_CODES.VALIDATION_ERROR);
  }

  // Generate invoice number
  const lastInvoice = await prisma.invoice.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  const invoiceNumber = lastInvoice
    ? `INV-${String(parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1).padStart(4, '0')}`
    : 'INV-0001';

  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (order.customer.creditDays || 30));

  // Prepare invoice items
  const invoiceItems = order.items.map(item => ({
    productId: item.productId,
    description: item.description,
    quantity: parseFloat(item.quantity),
    unitPrice: parseFloat(item.unitPrice),
    taxRate: parseFloat(item.taxRate),
    discountAmount: parseFloat(item.discountAmount),
    amount: parseFloat(item.amount)
  }));

  return await prisma.$transaction(async (tx) => {
    // Create invoice
    const invoice = await tx.invoice.create({
      data: {
        companyId,
        customerId: order.customerId,
        invoiceNumber,
        invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date(),
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : dueDate,
        salesOrderId: order.id,
        shippingAddress: invoiceData.shippingAddress || order.shippingAddress,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        discountAmount: order.discountAmount,
        total: order.total,
        paidAmount: 0,
        balanceAmount: order.total,
        paymentStatus: 'PENDING',
        status: DOCUMENT_STATUS.APPROVED,
        notes: invoiceData.notes || order.notes,
        terms: invoiceData.terms || order.terms,
        createdBy: userId,
        items: {
          create: invoiceItems
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Update sales order status
    await tx.salesOrder.update({
      where: { id: orderId },
      data: { status: DOCUMENT_STATUS.COMPLETED }
    });

    logger.info(`Sales order ${order.orderNumber} converted to invoice ${invoiceNumber} by ${userId}`);

    return invoice;
  });
};

/**
 * Update order status based on delivered quantities
 * @param {string} orderId - Order ID
 * @param {Object} tx - Prisma transaction
 */
export const updateOrderStatus = async (orderId, tx) => {
  const order = await tx.salesOrder.findUnique({
    where: { id: orderId },
    include: {
      items: true
    }
  });

  if (!order) return;

  // Check if all items are fully delivered
  const allDelivered = order.items.every(item =>
    parseFloat(item.deliveredQty) >= parseFloat(item.quantity)
  );

  // Check if any items are partially delivered
  const anyDelivered = order.items.some(item =>
    parseFloat(item.deliveredQty) > 0
  );

  let newStatus = order.status;

  if (allDelivered) {
    newStatus = DOCUMENT_STATUS.RECEIVED;
  } else if (anyDelivered && order.status === DOCUMENT_STATUS.APPROVED) {
    newStatus = DOCUMENT_STATUS.RECEIVED; // Using RECEIVED for partial as well
  }

  if (newStatus !== order.status) {
    await tx.salesOrder.update({
      where: { id: orderId },
      data: { status: newStatus }
    });
  }
};

export default {
  createSalesOrder,
  getSalesOrderById,
  getSalesOrders,
  updateSalesOrder,
  deleteSalesOrder,
  convertToInvoice,
  updateOrderStatus
};
