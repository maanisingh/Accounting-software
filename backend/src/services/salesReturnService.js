/**
 * Sales Return Service
 * Business logic for sales return management and stock reversal
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, PAGINATION, DOCUMENT_STATUS, STOCK_MOVEMENT_TYPES } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Generate next return number
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Next return number
 */
const generateReturnNumber = async (companyId) => {
  const lastReturn = await prisma.salesReturn.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastReturn) {
    return 'SR-0001';
  }

  const lastNumber = parseInt(lastReturn.returnNumber.split('-')[1]);
  return `SR-${String(lastNumber + 1).padStart(4, '0')}`;
};

/**
 * Calculate return totals
 * @param {Array} items - Return items
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
 * Increase stock for return items
 * @param {Array} items - Return items
 * @param {string} returnId - Return ID
 * @param {string} returnNumber - Return number
 * @param {string} companyId - Company ID
 * @param {Object} tx - Prisma transaction
 */
const increaseStock = async (items, returnId, returnNumber, companyId, tx) => {
  for (const item of items) {
    // Get warehouse for this item
    const warehouseId = item.warehouseId;

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

      logger.info(`Created new stock record for product ${item.productId} in warehouse ${warehouseId}`);
    } else {
      // Update existing stock - increase quantity and available quantity
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

    const currentBalance = stock ? parseFloat(stock.quantity) + returnQty : returnQty;

    // Create stock movement record
    await tx.stockMovement.create({
      data: {
        companyId,
        productId: item.productId,
        warehouseId: warehouseId,
        movementType: STOCK_MOVEMENT_TYPES.RETURN,
        referenceType: 'SALES_RETURN',
        referenceId: returnId,
        referenceNumber: returnNumber,
        quantity: returnQty, // Positive for inward
        unitPrice: parseFloat(item.unitPrice),
        totalValue: returnQty * parseFloat(item.unitPrice),
        balanceAfter: currentBalance,
        notes: `Stock returned via sales return ${returnNumber} - Reason: ${item.returnReason || 'Not specified'}`,
        movementDate: new Date()
      }
    });

    logger.info(`Stock increased: Product ${item.productId}, Qty: ${returnQty}, Warehouse: ${warehouseId}`);
  }
};

/**
 * Create a new sales return
 * @param {Object} returnData - Return data
 * @param {string} userId - ID of user creating the return
 * @returns {Promise<Object>} Created sales return
 */
export const createSalesReturn = async (returnData, userId) => {
  const {
    companyId,
    customerId,
    invoiceId,
    returnDate,
    reason,
    items,
    notes
  } = returnData;

  // Verify customer exists
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId }
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Verify invoice if provided
  let invoice = null;
  if (invoiceId) {
    invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        items: true
      }
    });

    if (!invoice) {
      throw ApiError.notFound('Invoice not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

    // Verify customer matches
    if (invoice.customerId !== customerId) {
      throw ApiError.badRequest('Invoice does not belong to specified customer', ERROR_CODES.VALIDATION_ERROR);
    }

    // Verify all items belong to the invoice
    for (const item of items) {
      const invoiceItem = invoice.items.find(ii => ii.productId === item.productId);
      if (!invoiceItem) {
        throw ApiError.badRequest(`Product ${item.productId} not found in invoice`, ERROR_CODES.VALIDATION_ERROR);
      }

      // Check if return quantity exceeds invoice quantity
      if (parseFloat(item.quantity) > parseFloat(invoiceItem.quantity)) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        throw ApiError.badRequest(
          `Return quantity for ${product?.name || item.productId} exceeds invoice quantity`,
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

    // Validate return reason
    const validReasons = ['DAMAGED', 'DEFECTIVE', 'WRONG_ITEM', 'QUALITY_ISSUE', 'OTHER'];
    if (!validReasons.includes(item.returnReason)) {
      throw ApiError.badRequest(`Invalid return reason: ${item.returnReason}`, ERROR_CODES.VALIDATION_ERROR);
    }

    // Get warehouse - use provided or default
    const warehouseId = item.warehouseId || (await getDefaultWarehouse(companyId)).id;
    item.warehouseId = warehouseId;
  }

  // Generate return number
  const returnNumber = await generateReturnNumber(companyId);

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
      returnReason: item.returnReason,
      unitPrice: parseFloat(item.unitPrice),
      taxRate: parseFloat(item.taxRate) || 0,
      discountAmount: itemDiscount,
      amount
    };
  });

  return await prisma.$transaction(async (tx) => {
    // Create sales return
    const salesReturn = await tx.salesReturn.create({
      data: {
        companyId,
        customerId,
        returnNumber,
        returnDate: returnDate ? new Date(returnDate) : new Date(),
        invoiceId: invoiceId || null,
        reason: reason || null,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        total: totals.total,
        refundAmount: 0, // To be processed separately
        status: DOCUMENT_STATUS.APPROVED,
        notes: notes || null,
        createdBy: userId,
        approvedBy: userId,
        approvedAt: new Date(),
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

    // Increase stock for all items
    await increaseStock(items, salesReturn.id, returnNumber, companyId, tx);

    // Update customer balance (credit the customer)
    await tx.customer.update({
      where: { id: customerId },
      data: {
        currentBalance: {
          decrement: totals.total
        }
      }
    });

    logger.info(`Sales return created: ${returnNumber} by ${userId}`);

    return salesReturn;
  });
};

/**
 * Get sales return by ID
 * @param {string} returnId - Return ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Return details
 */
export const getSalesReturnById = async (returnId, companyId) => {
  const salesReturn = await prisma.salesReturn.findFirst({
    where: { id: returnId, companyId },
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
          currentBalance: true
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

  if (!salesReturn) {
    throw ApiError.notFound('Sales return not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return salesReturn;
};

/**
 * Get sales returns list with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Returns list with pagination
 */
export const getSalesReturns = async (filters) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search,
    customerId,
    invoiceId,
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

  if (invoiceId) {
    where.invoiceId = invoiceId;
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.returnDate = {};
    if (startDate) {
      where.returnDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.returnDate.lte = new Date(endDate);
    }
  }

  if (search) {
    where.OR = [
      { returnNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Get total count
  const total = await prisma.salesReturn.count({ where });

  // Get returns
  const returns = await prisma.salesReturn.findMany({
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
          returnReason: true
        }
      }
    }
  });

  // Add item count
  const returnsWithMeta = returns.map(ret => ({
    ...ret,
    itemCount: ret.items.length,
    items: undefined
  }));

  return {
    returns: returnsWithMeta,
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

export default {
  createSalesReturn,
  getSalesReturnById,
  getSalesReturns
};
