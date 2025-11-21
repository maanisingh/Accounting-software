/**
 * Delivery Challan Service
 * Business logic for delivery challan management and stock reduction
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, PAGINATION, DOCUMENT_STATUS, STOCK_MOVEMENT_TYPES } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Generate next challan number
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Next challan number
 */
const generateChallanNumber = async (companyId) => {
  const lastChallan = await prisma.deliveryChallan.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastChallan) {
    return 'DC-0001';
  }

  const lastNumber = parseInt(lastChallan.challanNumber.split('-')[1]);
  return `DC-${String(lastNumber + 1).padStart(4, '0')}`;
};

/**
 * Calculate challan totals
 * @param {Array} items - Challan items
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
 * Get default warehouse for company
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Default warehouse
 */
const getDefaultWarehouse = async (companyId) => {
  const warehouse = await prisma.warehouse.findFirst({
    where: { companyId, isDefault: true, isActive: true }
  });

  if (!warehouse) {
    // If no default, get first active warehouse
    const firstWarehouse = await prisma.warehouse.findFirst({
      where: { companyId, isActive: true }
    });

    if (!firstWarehouse) {
      throw ApiError.notFound('No active warehouse found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

    return firstWarehouse;
  }

  return warehouse;
};

/**
 * Reduce stock for challan items
 * @param {Array} items - Challan items
 * @param {string} challanId - Challan ID
 * @param {string} challanNumber - Challan number
 * @param {string} companyId - Company ID
 * @param {Object} tx - Prisma transaction
 */
const reduceStock = async (items, challanId, challanNumber, companyId, tx) => {
  for (const item of items) {
    // Get warehouse for this item
    const warehouseId = item.warehouseId;

    // Check stock availability
    const stock = await tx.stock.findFirst({
      where: {
        productId: item.productId,
        warehouseId: warehouseId
      }
    });

    if (!stock) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      throw ApiError.badRequest(
        `No stock found for product ${product?.name || item.productId} in selected warehouse`,
        ERROR_CODES.INSUFFICIENT_STOCK
      );
    }

    const availableQty = parseFloat(stock.availableQty);
    const deliveryQty = parseFloat(item.quantity);

    if (availableQty < deliveryQty) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      throw ApiError.badRequest(
        `Insufficient stock for ${product?.name || item.productId}. Available: ${availableQty}, Required: ${deliveryQty}`,
        ERROR_CODES.INSUFFICIENT_STOCK
      );
    }

    // Update stock - reduce quantity and available quantity
    const newQuantity = parseFloat(stock.quantity) - deliveryQty;
    const newAvailableQty = parseFloat(stock.availableQty) - deliveryQty;

    await tx.stock.update({
      where: { id: stock.id },
      data: {
        quantity: newQuantity,
        availableQty: newAvailableQty
      }
    });

    // Create stock movement record
    await tx.stockMovement.create({
      data: {
        companyId,
        productId: item.productId,
        warehouseId: warehouseId,
        movementType: STOCK_MOVEMENT_TYPES.SALE,
        referenceType: 'DELIVERY_CHALLAN',
        referenceId: challanId,
        referenceNumber: challanNumber,
        quantity: -deliveryQty, // Negative for outward
        unitPrice: parseFloat(item.unitPrice),
        totalValue: -(deliveryQty * parseFloat(item.unitPrice)),
        balanceAfter: newQuantity,
        notes: `Stock reduced for delivery challan ${challanNumber}`,
        movementDate: new Date()
      }
    });

    logger.info(`Stock reduced: Product ${item.productId}, Qty: ${deliveryQty}, Warehouse: ${warehouseId}`);
  }
};

/**
 * Reverse stock for deleted challan
 * @param {Array} items - Challan items
 * @param {string} challanId - Challan ID
 * @param {string} challanNumber - Challan number
 * @param {string} companyId - Company ID
 * @param {Object} tx - Prisma transaction
 */
const reverseStock = async (items, challanId, challanNumber, companyId, tx) => {
  for (const item of items) {
    const warehouseId = item.warehouseId || (await getDefaultWarehouse(companyId)).id;

    // Find or create stock record
    let stock = await tx.stock.findFirst({
      where: {
        productId: item.productId,
        warehouseId: warehouseId
      }
    });

    const returnQty = parseFloat(item.quantity);

    if (!stock) {
      // Create new stock record if it doesn't exist
      stock = await tx.stock.create({
        data: {
          companyId,
          productId: item.productId,
          warehouseId: warehouseId,
          quantity: returnQty,
          reservedQty: 0,
          availableQty: returnQty,
          valueAmount: returnQty * parseFloat(item.unitPrice)
        }
      });
    } else {
      // Update existing stock
      const newQuantity = parseFloat(stock.quantity) + returnQty;
      const newAvailableQty = parseFloat(stock.availableQty) + returnQty;

      await tx.stock.update({
        where: { id: stock.id },
        data: {
          quantity: newQuantity,
          availableQty: newAvailableQty
        }
      });
    }

    // Create reversal stock movement record
    await tx.stockMovement.create({
      data: {
        companyId,
        productId: item.productId,
        warehouseId: warehouseId,
        movementType: STOCK_MOVEMENT_TYPES.ADJUSTMENT,
        referenceType: 'DELIVERY_CHALLAN_REVERSAL',
        referenceId: challanId,
        referenceNumber: `${challanNumber}-REV`,
        quantity: returnQty, // Positive for inward
        unitPrice: parseFloat(item.unitPrice),
        totalValue: returnQty * parseFloat(item.unitPrice),
        balanceAfter: parseFloat(stock.quantity) + returnQty,
        notes: `Stock reversed for deleted delivery challan ${challanNumber}`,
        movementDate: new Date()
      }
    });

    logger.info(`Stock reversed: Product ${item.productId}, Qty: ${returnQty}, Warehouse: ${warehouseId}`);
  }
};

/**
 * Create a new delivery challan
 * @param {Object} challanData - Challan data
 * @param {string} userId - ID of user creating the challan
 * @returns {Promise<Object>} Created challan
 */
export const createDeliveryChallan = async (challanData, userId) => {
  const {
    companyId,
    customerId,
    salesOrderId,
    challanDate,
    shippingAddress,
    vehicleNo,
    driverName,
    driverPhone,
    transportMode,
    items,
    notes
  } = challanData;

  // Verify customer exists
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId }
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Verify sales order if provided
  let salesOrder = null;
  if (salesOrderId) {
    salesOrder = await prisma.salesOrder.findFirst({
      where: { id: salesOrderId, companyId },
      include: {
        items: true
      }
    });

    if (!salesOrder) {
      throw ApiError.notFound('Sales order not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

    // Verify all items belong to the sales order
    for (const item of items) {
      const orderItem = salesOrder.items.find(oi => oi.productId === item.productId);
      if (!orderItem) {
        throw ApiError.badRequest(`Product ${item.productId} not found in sales order`, ERROR_CODES.VALIDATION_ERROR);
      }

      // Check if delivery quantity exceeds remaining quantity
      const remainingQty = parseFloat(orderItem.quantity) - parseFloat(orderItem.deliveredQty);
      if (parseFloat(item.quantity) > remainingQty) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        throw ApiError.badRequest(
          `Delivery quantity for ${product?.name || item.productId} exceeds remaining quantity. Remaining: ${remainingQty}`,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
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

    // Get warehouse - use provided or default
    const warehouseId = item.warehouseId || (await getDefaultWarehouse(companyId)).id;
    item.warehouseId = warehouseId;
  }

  // Generate challan number
  const challanNumber = await generateChallanNumber(companyId);

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

  return await prisma.$transaction(async (tx) => {
    // Create delivery challan
    const challan = await tx.deliveryChallan.create({
      data: {
        companyId,
        customerId,
        challanNumber,
        challanDate: challanDate ? new Date(challanDate) : new Date(),
        salesOrderId: salesOrderId || null,
        shippingAddress: shippingAddress || customer.address || null,
        vehicleNo: vehicleNo || null,
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        transportMode: transportMode || null,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        total: totals.total,
        status: DOCUMENT_STATUS.APPROVED,
        notes: notes || null,
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

    // Reduce stock for all items
    await reduceStock(items, challan.id, challanNumber, companyId, tx);

    // Update sales order if provided
    if (salesOrderId) {
      for (const item of items) {
        const orderItem = salesOrder.items.find(oi => oi.productId === item.productId);
        if (orderItem) {
          const newDeliveredQty = parseFloat(orderItem.deliveredQty) + parseFloat(item.quantity);

          await tx.salesOrderItem.update({
            where: { id: orderItem.id },
            data: { deliveredQty: newDeliveredQty }
          });
        }
      }

      // Import to avoid circular dependency
      const { updateOrderStatus } = await import('./salesOrderService.js');
      await updateOrderStatus(salesOrderId, tx);
    }

    logger.info(`Delivery challan created: ${challanNumber} by ${userId}`);

    return challan;
  });
};

/**
 * Get delivery challan by ID
 * @param {string} challanId - Challan ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Challan details
 */
export const getDeliveryChallanById = async (challanId, companyId) => {
  const challan = await prisma.deliveryChallan.findFirst({
    where: { id: challanId, companyId },
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
          taxNumber: true
        }
      },
      salesOrder: {
        select: {
          id: true,
          orderNumber: true,
          orderDate: true,
          status: true
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

  if (!challan) {
    throw ApiError.notFound('Delivery challan not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return challan;
};

/**
 * Get delivery challans list with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Challans list with pagination
 */
export const getDeliveryChallans = async (filters) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search,
    customerId,
    salesOrderId,
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

  if (salesOrderId) {
    where.salesOrderId = salesOrderId;
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.challanDate = {};
    if (startDate) {
      where.challanDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.challanDate.lte = new Date(endDate);
    }
  }

  if (search) {
    where.OR = [
      { challanNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Get total count
  const total = await prisma.deliveryChallan.count({ where });

  // Get challans
  const challans = await prisma.deliveryChallan.findMany({
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
      salesOrder: {
        select: {
          id: true,
          orderNumber: true
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
  const challansWithMeta = challans.map(challan => ({
    ...challan,
    itemCount: challan.items.length,
    items: undefined
  }));

  return {
    challans: challansWithMeta,
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
 * Delete delivery challan and reverse stock
 * @param {string} challanId - Challan ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deleteDeliveryChallan = async (challanId, companyId, userId) => {
  const challan = await prisma.deliveryChallan.findFirst({
    where: { id: challanId, companyId },
    include: {
      items: true,
      invoices: true,
      salesOrder: {
        include: {
          items: true
        }
      }
    }
  });

  if (!challan) {
    throw ApiError.notFound('Delivery challan not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot delete if has invoices
  if (challan.invoices.length > 0) {
    throw ApiError.badRequest('Cannot delete challan with invoices', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  return await prisma.$transaction(async (tx) => {
    // Get stock movements to know which warehouse to reverse to
    const stockMovements = await tx.stockMovement.findMany({
      where: {
        referenceType: 'DELIVERY_CHALLAN',
        referenceId: challanId
      }
    });

    // Map warehouse for each item
    const itemsWithWarehouse = challan.items.map(item => {
      const movement = stockMovements.find(sm => sm.productId === item.productId);
      return {
        ...item,
        warehouseId: movement?.warehouseId
      };
    });

    // Reverse stock
    await reverseStock(itemsWithWarehouse, challan.id, challan.challanNumber, companyId, tx);

    // Update sales order items if linked
    if (challan.salesOrderId && challan.salesOrder) {
      for (const item of challan.items) {
        const orderItem = challan.salesOrder.items.find(oi => oi.productId === item.productId);
        if (orderItem) {
          const newDeliveredQty = parseFloat(orderItem.deliveredQty) - parseFloat(item.quantity);

          await tx.salesOrderItem.update({
            where: { id: orderItem.id },
            data: { deliveredQty: Math.max(0, newDeliveredQty) }
          });
        }
      }

      // Update sales order status
      const { updateOrderStatus } = await import('./salesOrderService.js');
      await updateOrderStatus(challan.salesOrderId, tx);
    }

    // Delete the challan (cascade will delete items)
    await tx.deliveryChallan.delete({
      where: { id: challanId }
    });

    logger.info(`Delivery challan deleted and stock reversed: ${challan.challanNumber} by ${userId}`);
  });
};

export default {
  createDeliveryChallan,
  getDeliveryChallanById,
  getDeliveryChallans,
  deleteDeliveryChallan
};
