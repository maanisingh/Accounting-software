/**
 * Purchase Return Service
 * Business logic for purchase return management
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
  const lastReturn = await prisma.purchaseReturn.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastReturn) {
    return 'PR-0001';
  }

  const lastNumber = parseInt(lastReturn.returnNumber.split('-')[1]);
  return `PR-${String(lastNumber + 1).padStart(4, '0')}`;
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
 * Create stock movement for return (decrease stock)
 * @param {Object} data - Stock movement data
 * @param {Object} tx - Prisma transaction
 */
const createReturnStockMovement = async (data, tx) => {
  const { companyId, productId, warehouseId, quantity, unitPrice, returnNumber, userId } = data;

  // Get stock record
  const stock = await tx.stock.findUnique({
    where: {
      productId_warehouseId: {
        productId,
        warehouseId
      }
    }
  });

  if (!stock) {
    throw ApiError.notFound('Stock record not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Check if sufficient stock available
  if (stock.availableQty < quantity) {
    throw ApiError.badRequest('Insufficient stock for return', ERROR_CODES.INSUFFICIENT_STOCK);
  }

  // Calculate new quantity
  const newQuantity = stock.quantity - quantity;
  const totalValue = parseFloat(stock.valueAmount) - (quantity * parseFloat(unitPrice));

  // Update stock
  await tx.stock.update({
    where: { id: stock.id },
    data: {
      quantity: newQuantity,
      availableQty: newQuantity - stock.reservedQty,
      valueAmount: totalValue < 0 ? 0 : totalValue
    }
  });

  // Create stock movement
  await tx.stockMovement.create({
    data: {
      companyId,
      productId,
      warehouseId,
      movementType: STOCK_MOVEMENT_TYPES.RETURN,
      referenceType: 'PURCHASE_RETURN',
      referenceNumber: returnNumber,
      quantity: -quantity, // Negative for return
      unitPrice: parseFloat(unitPrice),
      totalValue: -(quantity * parseFloat(unitPrice)),
      balanceAfter: newQuantity,
      notes: `Purchase return - ${returnNumber}`,
      createdBy: userId
    }
  });
};

/**
 * Create credit note (reverse journal entry)
 * @param {Object} purchaseReturn - Purchase return data
 * @param {Object} tx - Prisma transaction
 * @param {string} userId - User ID
 */
const createCreditNote = async (purchaseReturn, tx, userId) => {
  // Generate entry number
  const lastEntry = await tx.journalEntry.findFirst({
    where: { companyId: purchaseReturn.companyId },
    orderBy: { createdAt: 'desc' }
  });

  const entryNumber = lastEntry
    ? `JE-${String(parseInt(lastEntry.entryNumber.split('-')[1]) + 1).padStart(4, '0')}`
    : 'JE-0001';

  // Create journal entry
  const journalEntry = await tx.journalEntry.create({
    data: {
      companyId: purchaseReturn.companyId,
      entryNumber,
      entryDate: purchaseReturn.returnDate,
      entryType: 'SYSTEM',
      referenceType: 'PURCHASE_RETURN',
      referenceId: purchaseReturn.id,
      referenceNumber: purchaseReturn.returnNumber,
      description: `Purchase return credit note - ${purchaseReturn.returnNumber}`,
      totalDebit: purchaseReturn.total,
      totalCredit: purchaseReturn.total,
      isPosted: true,
      postedAt: new Date(),
      createdBy: userId
    }
  });

  // Note: In production, you would create actual journal lines:
  // 1. Debit: Accounts Payable (reduce liability)
  // 2. Credit: Purchases Return Account

  logger.info(`Credit note created for purchase return: ${purchaseReturn.returnNumber}`);

  return journalEntry;
};

/**
 * Create a new purchase return
 * @param {Object} returnData - Return data
 * @param {string} userId - ID of user creating the return
 * @returns {Promise<Object>} Created return
 */
export const createPurchaseReturn = async (returnData, userId) => {
  const { companyId, vendorId, returnDate, billId, reason, items, notes, warehouseId } = returnData;

  // Verify vendor exists
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId }
  });

  if (!vendor) {
    throw ApiError.notFound('Vendor not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Verify bill if provided
  if (billId) {
    const bill = await prisma.bill.findFirst({
      where: { id: billId, companyId }
    });

    if (!bill) {
      throw ApiError.notFound('Bill not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }
  }

  // Verify warehouse exists
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, companyId }
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
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

  return await prisma.$transaction(async (tx) => {
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
        returnReason: item.returnReason || null,
        unitPrice: parseFloat(item.unitPrice),
        taxRate: parseFloat(item.taxRate) || 0,
        discountAmount: itemDiscount,
        amount
      };
    });

    // Create purchase return
    const purchaseReturn = await tx.purchaseReturn.create({
      data: {
        companyId,
        vendorId,
        returnNumber,
        returnDate: returnDate ? new Date(returnDate) : new Date(),
        billId: billId || null,
        reason: reason || null,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        total: totals.total,
        refundAmount: 0,
        status: DOCUMENT_STATUS.DRAFT,
        notes: notes || null,
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

    // Decrease stock for each item
    for (const item of itemsWithAmounts) {
      await createReturnStockMovement({
        companyId,
        productId: item.productId,
        warehouseId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        returnNumber,
        userId
      }, tx);
    }

    logger.info(`Purchase return created: ${returnNumber} by ${userId}`);

    return purchaseReturn;
  });
};

/**
 * Get purchase return by ID
 * @param {string} returnId - Return ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Return details
 */
export const getPurchaseReturnById = async (returnId, companyId) => {
  const purchaseReturn = await prisma.purchaseReturn.findFirst({
    where: { id: returnId, companyId },
    include: {
      vendor: true,
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

  if (!purchaseReturn) {
    throw ApiError.notFound('Purchase return not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return purchaseReturn;
};

/**
 * Get purchase returns list with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Returns list with pagination
 */
export const getPurchaseReturns = async (filters) => {
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
      { vendor: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Get total count
  const total = await prisma.purchaseReturn.count({ where });

  // Get returns
  const returns = await prisma.purchaseReturn.findMany({
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
  const returnsWithCount = returns.map(returnItem => ({
    ...returnItem,
    itemCount: returnItem.items.length,
    items: undefined
  }));

  return {
    returns: returnsWithCount,
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
 * Update purchase return
 * @param {string} returnId - Return ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated return
 */
export const updatePurchaseReturn = async (returnId, companyId, updateData, userId) => {
  const existingReturn = await prisma.purchaseReturn.findFirst({
    where: { id: returnId, companyId }
  });

  if (!existingReturn) {
    throw ApiError.notFound('Purchase return not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot update if approved
  if (existingReturn.status === DOCUMENT_STATUS.APPROVED) {
    throw ApiError.badRequest('Cannot update approved return', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  const { reason, notes, refundAmount } = updateData;

  const purchaseReturn = await prisma.purchaseReturn.update({
    where: { id: returnId },
    data: {
      ...(reason !== undefined && { reason: reason || null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(refundAmount !== undefined && { refundAmount: parseFloat(refundAmount) })
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

  logger.info(`Purchase return updated: ${returnId} by ${userId}`);

  return purchaseReturn;
};

/**
 * Delete purchase return
 * @param {string} returnId - Return ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deletePurchaseReturn = async (returnId, companyId, userId) => {
  const purchaseReturn = await prisma.purchaseReturn.findFirst({
    where: { id: returnId, companyId }
  });

  if (!purchaseReturn) {
    throw ApiError.notFound('Purchase return not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot delete if approved
  if (purchaseReturn.status === DOCUMENT_STATUS.APPROVED) {
    throw ApiError.badRequest('Cannot delete approved return', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Soft delete by setting status to CANCELLED
  await prisma.purchaseReturn.update({
    where: { id: returnId },
    data: { status: DOCUMENT_STATUS.CANCELLED }
  });

  logger.info(`Purchase return deleted: ${returnId} by ${userId}`);
};

/**
 * Approve purchase return and create credit note
 * @param {string} returnId - Return ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing approval
 * @returns {Promise<Object>} Approved return
 */
export const approvePurchaseReturn = async (returnId, companyId, userId) => {
  const purchaseReturn = await prisma.purchaseReturn.findFirst({
    where: { id: returnId, companyId }
  });

  if (!purchaseReturn) {
    throw ApiError.notFound('Purchase return not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  if (purchaseReturn.status !== DOCUMENT_STATUS.DRAFT) {
    throw ApiError.badRequest('Only draft returns can be approved', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  return await prisma.$transaction(async (tx) => {
    // Update return status
    const approvedReturn = await tx.purchaseReturn.update({
      where: { id: returnId },
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

    // Create credit note (journal entry)
    await createCreditNote(approvedReturn, tx, userId);

    // Update vendor balance (reduce payable)
    await tx.vendor.update({
      where: { id: purchaseReturn.vendorId },
      data: {
        currentBalance: {
          decrement: purchaseReturn.total
        }
      }
    });

    logger.info(`Purchase return approved: ${returnId} by ${userId}`);

    return approvedReturn;
  });
};

export default {
  createPurchaseReturn,
  getPurchaseReturnById,
  getPurchaseReturns,
  updatePurchaseReturn,
  deletePurchaseReturn,
  approvePurchaseReturn
};
