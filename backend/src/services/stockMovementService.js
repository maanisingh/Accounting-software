/**
 * Stock Movement Service
 * Business logic for stock movement tracking operations
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, PAGINATION, STOCK_MOVEMENT_TYPES } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Get all stock movements
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Movements list with pagination
 */
export const getAllMovements = async (companyId, filters = {}) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    productId,
    warehouseId,
    movementType,
    startDate,
    endDate,
    search
  } = filters;

  const where = { companyId };

  if (productId) {
    where.productId = productId;
  }

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  if (movementType) {
    where.movementType = movementType;
  }

  if (startDate || endDate) {
    where.movementDate = {};
    if (startDate) {
      where.movementDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.movementDate.lte = new Date(endDate);
    }
  }

  if (search) {
    where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
      {
        product: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } }
          ]
        }
      }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Get total count
  const total = await prisma.stockMovement.count({ where });

  // Get movements
  const movements = await prisma.stockMovement.findMany({
    where,
    skip,
    take,
    orderBy: { movementDate: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true
        }
      },
      warehouse: {
        select: {
          id: true,
          code: true,
          name: true
        }
      }
    }
  });

  return {
    movements,
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
 * Get movement by ID
 * @param {string} movementId - Movement ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Movement details
 */
export const getMovementById = async (movementId, companyId) => {
  const movement = await prisma.stockMovement.findFirst({
    where: { id: movementId, companyId },
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
          category: {
            select: {
              id: true,
              name: true
            }
          },
          brand: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      warehouse: {
        select: {
          id: true,
          code: true,
          name: true,
          address: true,
          city: true
        }
      }
    }
  });

  if (!movement) {
    throw ApiError.notFound('Stock movement not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return movement;
};

/**
 * Create manual stock movement
 * @param {Object} movementData - Movement data
 * @param {string} userId - ID of user creating the movement
 * @returns {Promise<Object>} Created movement
 */
export const createMovement = async (movementData, userId) => {
  const { companyId, productId, warehouseId, movementType, quantity, notes, reference } = movementData;

  if (quantity === 0) {
    throw ApiError.badRequest('Movement quantity cannot be zero');
  }

  return await prisma.$transaction(async (tx) => {
    // Verify product exists
    const product = await tx.product.findFirst({
      where: { id: productId, companyId }
    });

    if (!product) {
      throw ApiError.notFound('Product not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

    // Verify warehouse exists
    const warehouse = await tx.warehouse.findFirst({
      where: { id: warehouseId, companyId }
    });

    if (!warehouse) {
      throw ApiError.notFound('Warehouse not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

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

    // Calculate new quantity
    const newQuantity = stock.quantity + quantity;

    // Prevent negative stock
    if (newQuantity < 0) {
      throw ApiError.badRequest(
        `Stock cannot go negative. Current: ${stock.quantity}, Change: ${quantity}`,
        ERROR_CODES.INSUFFICIENT_STOCK
      );
    }

    // Update stock
    await tx.stock.update({
      where: { id: stock.id },
      data: {
        quantity: newQuantity,
        availableQty: newQuantity - stock.reservedQty,
        valueAmount: newQuantity * product.purchasePrice
      }
    });

    // Create stock movement
    const movement = await tx.stockMovement.create({
      data: {
        companyId,
        productId,
        warehouseId,
        movementType: movementType || STOCK_MOVEMENT_TYPES.ADJUSTMENT,
        referenceType: 'MANUAL',
        referenceNumber: reference || null,
        quantity,
        unitPrice: product.purchasePrice,
        totalValue: quantity * product.purchasePrice,
        balanceAfter: newQuantity,
        notes: notes || null,
        createdBy: userId
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            unit: true
          }
        },
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });

    logger.info(`Manual stock movement created: Product ${productId}, Warehouse ${warehouseId}, Qty ${quantity}`);

    return movement;
  });
};

/**
 * Get movements by product
 * @param {string} productId - Product ID
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Movements list with pagination
 */
export const getMovementsByProduct = async (productId, companyId, filters = {}) => {
  // Verify product exists
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId }
  });

  if (!product) {
    throw ApiError.notFound('Product not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return await getAllMovements(companyId, { ...filters, productId });
};

/**
 * Get movements by warehouse
 * @param {string} warehouseId - Warehouse ID
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Movements list with pagination
 */
export const getMovementsByWarehouse = async (warehouseId, companyId, filters = {}) => {
  // Verify warehouse exists
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, companyId }
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return await getAllMovements(companyId, { ...filters, warehouseId });
};

/**
 * Get movements by type
 * @param {string} movementType - Movement type
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Movements list with pagination
 */
export const getMovementsByType = async (movementType, companyId, filters = {}) => {
  // Validate movement type
  if (!Object.values(STOCK_MOVEMENT_TYPES).includes(movementType)) {
    throw ApiError.badRequest('Invalid movement type');
  }

  return await getAllMovements(companyId, { ...filters, movementType });
};

/**
 * Get movements by date range
 * @param {string} companyId - Company ID
 * @param {Object} dateRange - Date range filter
 * @returns {Promise<Object>} Movements list with pagination
 */
export const getMovementsByDateRange = async (companyId, dateRange) => {
  const { startDate, endDate, ...otherFilters } = dateRange;

  if (!startDate || !endDate) {
    throw ApiError.badRequest('Both startDate and endDate are required');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw ApiError.badRequest('startDate must be before endDate');
  }

  return await getAllMovements(companyId, {
    ...otherFilters,
    startDate: start,
    endDate: end
  });
};

/**
 * Bulk create stock movements
 * @param {Array} movementsData - Array of movement data
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user creating movements
 * @returns {Promise<Object>} Created movements and errors
 */
export const bulkCreateMovements = async (movementsData, companyId, userId) => {
  const created = [];
  const errors = [];

  for (const movementData of movementsData) {
    try {
      const movement = await createMovement({ ...movementData, companyId }, userId);
      created.push(movement);
    } catch (error) {
      errors.push({
        productId: movementData.productId,
        warehouseId: movementData.warehouseId,
        error: error.message
      });
    }
  }

  logger.info(`Bulk movement creation: ${created.length} succeeded, ${errors.length} failed`);

  return { created, errors };
};

/**
 * Get movement statistics
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Movement statistics
 */
export const getMovementStats = async (companyId, filters = {}) => {
  const { startDate, endDate, warehouseId, productId } = filters;

  const where = { companyId };

  if (startDate || endDate) {
    where.movementDate = {};
    if (startDate) {
      where.movementDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.movementDate.lte = new Date(endDate);
    }
  }

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  if (productId) {
    where.productId = productId;
  }

  // Get counts by type
  const byType = await prisma.stockMovement.groupBy({
    by: ['movementType'],
    where,
    _count: true,
    _sum: {
      quantity: true,
      totalValue: true
    }
  });

  // Get total movements
  const total = await prisma.stockMovement.count({ where });

  // Calculate totals
  let totalQuantityIn = 0;
  let totalQuantityOut = 0;
  let totalValueIn = 0;
  let totalValueOut = 0;

  byType.forEach(item => {
    const qty = item._sum.quantity || 0;
    const value = parseFloat(item._sum.totalValue || 0);

    if (qty > 0) {
      totalQuantityIn += qty;
      totalValueIn += value;
    } else {
      totalQuantityOut += Math.abs(qty);
      totalValueOut += Math.abs(value);
    }
  });

  return {
    total,
    byType: byType.reduce((acc, item) => {
      acc[item.movementType] = {
        count: item._count,
        totalQuantity: item._sum.quantity || 0,
        totalValue: parseFloat(item._sum.totalValue || 0)
      };
      return acc;
    }, {}),
    summary: {
      totalQuantityIn,
      totalQuantityOut,
      totalValueIn,
      totalValueOut,
      netQuantity: totalQuantityIn - totalQuantityOut,
      netValue: totalValueIn - totalValueOut
    }
  };
};

export default {
  getAllMovements,
  getMovementById,
  createMovement,
  getMovementsByProduct,
  getMovementsByWarehouse,
  getMovementsByType,
  getMovementsByDateRange,
  bulkCreateMovements,
  getMovementStats
};
