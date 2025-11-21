/**
 * Goods Receipt Service
 * Business logic for goods receipt management and stock updates
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, PAGINATION, DOCUMENT_STATUS, STOCK_MOVEMENT_TYPES } from '../config/constants.js';
import logger from '../config/logger.js';
import { updateOrderStatus } from './purchaseOrderService.js';

/**
 * Generate next receipt number
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Next receipt number
 */
const generateReceiptNumber = async (companyId) => {
  const lastReceipt = await prisma.goodsReceipt.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastReceipt) {
    return 'GRN-0001';
  }

  const lastNumber = parseInt(lastReceipt.receiptNumber.split('-')[1]);
  return `GRN-${String(lastNumber + 1).padStart(4, '0')}`;
};

/**
 * Calculate receipt totals
 * @param {Array} items - Receipt items
 * @returns {Object} Calculated totals
 */
const calculateTotals = (items) => {
  let subtotal = 0;
  let taxAmount = 0;
  let discountAmount = 0;

  items.forEach(item => {
    const itemSubtotal = parseFloat(item.acceptedQty) * parseFloat(item.unitPrice);
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
 * Create stock movement and update stock
 * @param {Object} data - Stock movement data
 * @param {Object} tx - Prisma transaction
 */
const createStockMovement = async (data, tx) => {
  const { companyId, productId, warehouseId, quantity, unitPrice, receiptNumber, userId } = data;

  // Get or create stock record
  let stock = await tx.stock.findUnique({
    where: {
      productId_warehouseId: {
        productId,
        warehouseId
      }
    }
  });

  if (!stock) {
    stock = await tx.stock.create({
      data: {
        companyId,
        productId,
        warehouseId,
        quantity: 0,
        reservedQty: 0,
        availableQty: 0,
        valueAmount: 0
      }
    });
  }

  // Calculate new quantity and value
  const newQuantity = stock.quantity + quantity;
  const totalValue = parseFloat(stock.valueAmount) + (quantity * parseFloat(unitPrice));

  // Update stock
  await tx.stock.update({
    where: { id: stock.id },
    data: {
      quantity: newQuantity,
      availableQty: newQuantity - stock.reservedQty,
      valueAmount: totalValue
    }
  });

  // Create stock movement
  await tx.stockMovement.create({
    data: {
      companyId,
      productId,
      warehouseId,
      movementType: STOCK_MOVEMENT_TYPES.PURCHASE,
      referenceType: 'GOODS_RECEIPT',
      referenceNumber: receiptNumber,
      quantity,
      unitPrice: parseFloat(unitPrice),
      totalValue: quantity * parseFloat(unitPrice),
      balanceAfter: newQuantity,
      notes: `Goods received - ${receiptNumber}`,
      createdBy: userId
    }
  });
};

/**
 * Reverse stock movement
 * @param {Object} data - Stock movement data
 * @param {Object} tx - Prisma transaction
 */
const reverseStockMovement = async (data, tx) => {
  const { companyId, productId, warehouseId, quantity, unitPrice, receiptNumber, userId } = data;

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

  // Calculate new quantity
  const newQuantity = stock.quantity - quantity;

  if (newQuantity < 0) {
    throw ApiError.badRequest('Cannot reverse - insufficient stock', ERROR_CODES.INSUFFICIENT_STOCK);
  }

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

  // Create reverse stock movement
  await tx.stockMovement.create({
    data: {
      companyId,
      productId,
      warehouseId,
      movementType: STOCK_MOVEMENT_TYPES.ADJUSTMENT,
      referenceType: 'GOODS_RECEIPT_REVERSAL',
      referenceNumber: receiptNumber,
      quantity: -quantity,
      unitPrice: parseFloat(unitPrice),
      totalValue: -(quantity * parseFloat(unitPrice)),
      balanceAfter: newQuantity,
      notes: `Goods receipt reversed - ${receiptNumber}`,
      createdBy: userId
    }
  });
};

/**
 * Create a new goods receipt
 * @param {Object} receiptData - Receipt data
 * @param {string} userId - ID of user creating the receipt
 * @returns {Promise<Object>} Created receipt
 */
export const createGoodsReceipt = async (receiptData, userId) => {
  const { companyId, vendorId, receiptDate, purchaseOrderId, warehouseId, vehicleNo, driverName, driverPhone, items, notes } = receiptData;

  // Verify vendor exists
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId }
  });

  if (!vendor) {
    throw ApiError.notFound('Vendor not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Verify warehouse exists
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, companyId }
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  let purchaseOrder = null;

  // Verify purchase order if provided
  if (purchaseOrderId) {
    purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, companyId },
      include: {
        items: true
      }
    });

    if (!purchaseOrder) {
      throw ApiError.notFound('Purchase order not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

    // Verify all items belong to the PO
    for (const item of items) {
      const poItem = purchaseOrder.items.find(pi => pi.productId === item.productId);
      if (!poItem) {
        throw ApiError.badRequest(`Product ${item.productId} not in purchase order`, ERROR_CODES.VALIDATION_ERROR);
      }

      // Check if receiving more than ordered
      const totalReceived = parseFloat(poItem.receivedQty) + parseFloat(item.receivedQty);
      if (totalReceived > parseFloat(poItem.quantity)) {
        throw ApiError.badRequest(`Cannot receive more than ordered for product ${item.productId}`, ERROR_CODES.VALIDATION_ERROR);
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
  }

  return await prisma.$transaction(async (tx) => {
    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(companyId);

    // Calculate totals
    const totals = calculateTotals(items);

    // Calculate item amounts
    const itemsWithAmounts = items.map(item => {
      const itemSubtotal = parseFloat(item.acceptedQty) * parseFloat(item.unitPrice);
      const itemDiscount = parseFloat(item.discountAmount) || 0;
      const itemTaxableAmount = itemSubtotal - itemDiscount;
      const itemTax = (itemTaxableAmount * parseFloat(item.taxRate)) / 100;
      const amount = itemTaxableAmount + itemTax;

      return {
        productId: item.productId,
        description: item.description || null,
        orderedQty: parseFloat(item.orderedQty) || 0,
        receivedQty: parseFloat(item.receivedQty),
        acceptedQty: parseFloat(item.acceptedQty),
        rejectedQty: parseFloat(item.rejectedQty) || 0,
        damagedQty: parseFloat(item.damagedQty) || 0,
        unitPrice: parseFloat(item.unitPrice),
        taxRate: parseFloat(item.taxRate) || 0,
        discountAmount: itemDiscount,
        amount
      };
    });

    // Create goods receipt
    const receipt = await tx.goodsReceipt.create({
      data: {
        companyId,
        vendorId,
        receiptNumber,
        receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
        purchaseOrderId: purchaseOrderId || null,
        warehouseId,
        vehicleNo: vehicleNo || null,
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        total: totals.total,
        status: DOCUMENT_STATUS.RECEIVED,
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
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true
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

    // Update stock for each item
    for (const item of itemsWithAmounts) {
      await createStockMovement({
        companyId,
        productId: item.productId,
        warehouseId,
        quantity: item.acceptedQty,
        unitPrice: item.unitPrice,
        receiptNumber,
        userId
      }, tx);
    }

    // Update PO item received quantities
    if (purchaseOrderId) {
      for (const item of items) {
        const poItem = purchaseOrder.items.find(pi => pi.productId === item.productId);
        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: {
              receivedQty: parseFloat(poItem.receivedQty) + parseFloat(item.receivedQty)
            }
          });
        }
      }

      // Update PO status
      await updateOrderStatus(purchaseOrderId, tx);
    }

    logger.info(`Goods receipt created: ${receiptNumber} by ${userId}`);

    return receipt;
  });
};

/**
 * Get goods receipt by ID
 * @param {string} receiptId - Receipt ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Receipt details
 */
export const getGoodsReceiptById = async (receiptId, companyId) => {
  const receipt = await prisma.goodsReceipt.findFirst({
    where: { id: receiptId, companyId },
    include: {
      vendor: true,
      warehouse: true,
      purchaseOrder: {
        select: {
          id: true,
          orderNumber: true,
          orderDate: true
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

  if (!receipt) {
    throw ApiError.notFound('Goods receipt not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return receipt;
};

/**
 * Get goods receipts list with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Receipts list with pagination
 */
export const getGoodsReceipts = async (filters) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search,
    vendorId,
    warehouseId,
    purchaseOrderId,
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

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  if (purchaseOrderId) {
    where.purchaseOrderId = purchaseOrderId;
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.receiptDate = {};
    if (startDate) {
      where.receiptDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.receiptDate.lte = new Date(endDate);
    }
  }

  if (search) {
    where.OR = [
      { receiptNumber: { contains: search, mode: 'insensitive' } },
      { vendor: { name: { contains: search, mode: 'insensitive' } } },
      { vehicleNo: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Get total count
  const total = await prisma.goodsReceipt.count({ where });

  // Get receipts
  const receipts = await prisma.goodsReceipt.findMany({
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
      warehouse: {
        select: {
          id: true,
          code: true,
          name: true
        }
      },
      purchaseOrder: {
        select: {
          id: true,
          orderNumber: true
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
  const receiptsWithCount = receipts.map(receipt => ({
    ...receipt,
    itemCount: receipt.items.length,
    items: undefined
  }));

  return {
    receipts: receiptsWithCount,
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
 * Update goods receipt
 * @param {string} receiptId - Receipt ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated receipt
 */
export const updateGoodsReceipt = async (receiptId, companyId, updateData, userId) => {
  const existingReceipt = await prisma.goodsReceipt.findFirst({
    where: { id: receiptId, companyId }
  });

  if (!existingReceipt) {
    throw ApiError.notFound('Goods receipt not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot update if status is not DRAFT
  if (existingReceipt.status !== DOCUMENT_STATUS.DRAFT) {
    throw ApiError.badRequest('Cannot update received goods receipt', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  const { vehicleNo, driverName, driverPhone, notes } = updateData;

  const receipt = await prisma.goodsReceipt.update({
    where: { id: receiptId },
    data: {
      ...(vehicleNo !== undefined && { vehicleNo: vehicleNo || null }),
      ...(driverName !== undefined && { driverName: driverName || null }),
      ...(driverPhone !== undefined && { driverPhone: driverPhone || null }),
      ...(notes !== undefined && { notes: notes || null })
    },
    include: {
      vendor: true,
      warehouse: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });

  logger.info(`Goods receipt updated: ${receiptId} by ${userId}`);

  return receipt;
};

/**
 * Delete goods receipt and reverse stock
 * @param {string} receiptId - Receipt ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deleteGoodsReceipt = async (receiptId, companyId, userId) => {
  const receipt = await prisma.goodsReceipt.findFirst({
    where: { id: receiptId, companyId },
    include: {
      items: true,
      purchaseOrder: {
        include: {
          items: true
        }
      }
    }
  });

  if (!receipt) {
    throw ApiError.notFound('Goods receipt not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return await prisma.$transaction(async (tx) => {
    // Reverse stock for each item
    for (const item of receipt.items) {
      await reverseStockMovement({
        companyId,
        productId: item.productId,
        warehouseId: receipt.warehouseId,
        quantity: item.acceptedQty,
        unitPrice: item.unitPrice,
        receiptNumber: receipt.receiptNumber,
        userId
      }, tx);
    }

    // Update PO item received quantities
    if (receipt.purchaseOrderId && receipt.purchaseOrder) {
      for (const item of receipt.items) {
        const poItem = receipt.purchaseOrder.items.find(pi => pi.productId === item.productId);
        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: {
              receivedQty: parseFloat(poItem.receivedQty) - parseFloat(item.receivedQty)
            }
          });
        }
      }

      // Update PO status
      await updateOrderStatus(receipt.purchaseOrderId, tx);
    }

    // Delete goods receipt
    await tx.goodsReceipt.update({
      where: { id: receiptId },
      data: { status: DOCUMENT_STATUS.CANCELLED }
    });

    logger.info(`Goods receipt deleted and stock reversed: ${receiptId} by ${userId}`);
  });
};

/**
 * Approve goods receipt
 * @param {string} receiptId - Receipt ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing approval
 * @returns {Promise<Object>} Approved receipt
 */
export const approveGoodsReceipt = async (receiptId, companyId, userId) => {
  const receipt = await prisma.goodsReceipt.findFirst({
    where: { id: receiptId, companyId }
  });

  if (!receipt) {
    throw ApiError.notFound('Goods receipt not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  if (receipt.status !== DOCUMENT_STATUS.DRAFT) {
    throw ApiError.badRequest('Only draft receipts can be approved', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  const approvedReceipt = await prisma.goodsReceipt.update({
    where: { id: receiptId },
    data: {
      status: DOCUMENT_STATUS.APPROVED
    }
  });

  logger.info(`Goods receipt approved: ${receiptId} by ${userId}`);

  return approvedReceipt;
};

/**
 * Get goods receipts for a purchase order
 * @param {string} purchaseOrderId - Purchase order ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} Goods receipts
 */
export const getReceiptsByPurchaseOrder = async (purchaseOrderId, companyId) => {
  const receipts = await prisma.goodsReceipt.findMany({
    where: {
      purchaseOrderId,
      companyId
    },
    include: {
      vendor: {
        select: {
          id: true,
          name: true
        }
      },
      warehouse: {
        select: {
          id: true,
          name: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      receiptDate: 'desc'
    }
  });

  return receipts;
};

export default {
  createGoodsReceipt,
  getGoodsReceiptById,
  getGoodsReceipts,
  updateGoodsReceipt,
  deleteGoodsReceipt,
  approveGoodsReceipt,
  getReceiptsByPurchaseOrder
};
