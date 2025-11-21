/**
 * Stock Service
 * Business logic for stock management operations
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, PAGINATION, STOCK_MOVEMENT_TYPES } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Get all stock for a company
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Stock list with pagination
 */
export const getAllStock = async (companyId, filters = {}) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    productId,
    warehouseId,
    showZero = false,
    search
  } = filters;

  const where = { companyId };

  if (productId) {
    where.productId = productId;
  }

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  // By default, hide zero stock items
  if (showZero !== 'true' && showZero !== true) {
    where.quantity = { gt: 0 };
  }

  // Apply search filter on product
  if (search) {
    where.product = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Get total count
  const total = await prisma.stock.count({ where });

  // Get stock items
  const stockItems = await prisma.stock.findMany({
    where,
    skip,
    take,
    orderBy: [
      { quantity: 'desc' }
    ],
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
          sellingPrice: true,
          purchasePrice: true,
          reorderLevel: true
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
    stockItems,
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
 * Get stock for a specific product across all warehouses
 * @param {string} productId - Product ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} Stock levels by warehouse
 */
export const getProductStock = async (productId, companyId) => {
  // Verify product exists
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId }
  });

  if (!product) {
    throw ApiError.notFound('Product not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  const stockLevels = await prisma.stock.findMany({
    where: { productId, companyId },
    include: {
      warehouse: {
        select: {
          id: true,
          code: true,
          name: true,
          isActive: true
        }
      }
    },
    orderBy: {
      warehouse: { name: 'asc' }
    }
  });

  return stockLevels;
};

/**
 * Transfer stock between warehouses
 * @param {Object} transferData - Transfer details
 * @param {string} userId - ID of user performing transfer
 * @returns {Promise<Object>} Transfer result
 */
export const transferStock = async (transferData, userId) => {
  const { companyId, productId, fromWarehouseId, toWarehouseId, quantity, notes, reference } = transferData;

  if (fromWarehouseId === toWarehouseId) {
    throw ApiError.badRequest('Source and destination warehouses must be different');
  }

  if (quantity <= 0) {
    throw ApiError.badRequest('Transfer quantity must be positive');
  }

  return await prisma.$transaction(async (tx) => {
    // Verify product exists
    const product = await tx.product.findFirst({
      where: { id: productId, companyId }
    });

    if (!product) {
      throw ApiError.notFound('Product not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

    // Verify warehouses exist
    const [fromWarehouse, toWarehouse] = await Promise.all([
      tx.warehouse.findFirst({ where: { id: fromWarehouseId, companyId } }),
      tx.warehouse.findFirst({ where: { id: toWarehouseId, companyId } })
    ]);

    if (!fromWarehouse) {
      throw ApiError.notFound('Source warehouse not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

    if (!toWarehouse) {
      throw ApiError.notFound('Destination warehouse not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

    // Get source stock
    let fromStock = await tx.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId: fromWarehouseId
        }
      }
    });

    if (!fromStock || fromStock.availableQty < quantity) {
      throw ApiError.badRequest(
        `Insufficient available stock in ${fromWarehouse.name}. Available: ${fromStock?.availableQty || 0}`,
        ERROR_CODES.INSUFFICIENT_STOCK
      );
    }

    // Update source warehouse stock (decrease)
    const newFromQty = fromStock.quantity - quantity;
    fromStock = await tx.stock.update({
      where: { id: fromStock.id },
      data: {
        quantity: newFromQty,
        availableQty: newFromQty - fromStock.reservedQty,
        valueAmount: newFromQty * product.purchasePrice
      }
    });

    // Get or create destination stock
    let toStock = await tx.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId: toWarehouseId
        }
      }
    });

    if (!toStock) {
      toStock = await tx.stock.create({
        data: {
          companyId,
          productId,
          warehouseId: toWarehouseId,
          quantity: 0,
          reservedQty: 0,
          availableQty: 0,
          valueAmount: 0
        }
      });
    }

    // Update destination warehouse stock (increase)
    const newToQty = toStock.quantity + quantity;
    toStock = await tx.stock.update({
      where: { id: toStock.id },
      data: {
        quantity: newToQty,
        availableQty: newToQty - toStock.reservedQty,
        valueAmount: newToQty * product.purchasePrice
      }
    });

    // Create stock movement for source (OUT)
    await tx.stockMovement.create({
      data: {
        companyId,
        productId,
        warehouseId: fromWarehouseId,
        movementType: STOCK_MOVEMENT_TYPES.TRANSFER,
        referenceType: 'STOCK_TRANSFER',
        referenceNumber: reference || null,
        quantity: -quantity,
        unitPrice: product.purchasePrice,
        totalValue: -quantity * product.purchasePrice,
        balanceAfter: newFromQty,
        notes: notes || `Transfer to ${toWarehouse.name}`,
        createdBy: userId
      }
    });

    // Create stock movement for destination (IN)
    await tx.stockMovement.create({
      data: {
        companyId,
        productId,
        warehouseId: toWarehouseId,
        movementType: STOCK_MOVEMENT_TYPES.TRANSFER,
        referenceType: 'STOCK_TRANSFER',
        referenceNumber: reference || null,
        quantity: quantity,
        unitPrice: product.purchasePrice,
        totalValue: quantity * product.purchasePrice,
        balanceAfter: newToQty,
        notes: notes || `Transfer from ${fromWarehouse.name}`,
        createdBy: userId
      }
    });

    logger.info(`Stock transferred: Product ${productId}, ${fromWarehouse.name} -> ${toWarehouse.name}, Qty ${quantity}`);

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku
      },
      fromWarehouse: {
        id: fromWarehouse.id,
        name: fromWarehouse.name,
        newQuantity: newFromQty
      },
      toWarehouse: {
        id: toWarehouse.id,
        name: toWarehouse.name,
        newQuantity: newToQty
      },
      transferredQuantity: quantity
    };
  });
};

/**
 * Adjust stock levels
 * @param {Object} adjustmentData - Adjustment details
 * @param {string} userId - ID of user performing adjustment
 * @returns {Promise<Object>} Adjustment result
 */
export const adjustStock = async (adjustmentData, userId) => {
  const { companyId, productId, warehouseId, quantity, reason, reference } = adjustmentData;

  if (!reason || reason.trim().length < 10) {
    throw ApiError.badRequest('Adjustment reason must be at least 10 characters');
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
        `Stock cannot go negative. Current: ${stock.quantity}, Adjustment: ${quantity}`,
        ERROR_CODES.INSUFFICIENT_STOCK
      );
    }

    // Update stock
    const updatedStock = await tx.stock.update({
      where: { id: stock.id },
      data: {
        quantity: newQuantity,
        availableQty: newQuantity - stock.reservedQty,
        valueAmount: newQuantity * product.purchasePrice
      }
    });

    // Create stock movement
    await tx.stockMovement.create({
      data: {
        companyId,
        productId,
        warehouseId,
        movementType: STOCK_MOVEMENT_TYPES.ADJUSTMENT,
        referenceType: 'MANUAL_ADJUSTMENT',
        referenceNumber: reference || null,
        quantity,
        unitPrice: product.purchasePrice,
        totalValue: quantity * product.purchasePrice,
        balanceAfter: newQuantity,
        notes: reason,
        createdBy: userId
      }
    });

    logger.info(`Stock adjusted: Product ${productId}, Warehouse ${warehouseId}, Qty ${quantity}`);

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku
      },
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      previousQuantity: stock.quantity,
      adjustment: quantity,
      newQuantity: newQuantity,
      reason
    };
  });
};

/**
 * Get low stock products (below reorder level)
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} Low stock products
 */
export const getLowStockProducts = async (companyId) => {
  const products = await prisma.product.findMany({
    where: {
      companyId,
      isActive: true,
      trackInventory: true,
      reorderLevel: { gt: 0 }
    },
    include: {
      stock: {
        select: {
          quantity: true,
          availableQty: true,
          warehouse: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Filter products where total stock is below reorder level
  const lowStockProducts = products
    .map(product => {
      const totalStock = product.stock.reduce((sum, s) => sum + s.quantity, 0);
      const totalAvailable = product.stock.reduce((sum, s) => sum + s.availableQty, 0);

      return {
        ...product,
        totalStock,
        totalAvailable,
        shortfall: product.reorderLevel - totalStock
      };
    })
    .filter(product => product.totalStock < product.reorderLevel)
    .sort((a, b) => b.shortfall - a.shortfall);

  return lowStockProducts;
};

/**
 * Get out of stock products
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} Out of stock products
 */
export const getOutOfStockProducts = async (companyId) => {
  const products = await prisma.product.findMany({
    where: {
      companyId,
      isActive: true,
      trackInventory: true
    },
    include: {
      stock: {
        select: {
          quantity: true,
          availableQty: true,
          warehouse: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Filter products with zero or negative total stock
  const outOfStockProducts = products
    .map(product => {
      const totalStock = product.stock.reduce((sum, s) => sum + s.quantity, 0);
      const totalAvailable = product.stock.reduce((sum, s) => sum + s.availableQty, 0);

      return {
        ...product,
        totalStock,
        totalAvailable
      };
    })
    .filter(product => product.totalStock <= 0);

  return outOfStockProducts;
};

/**
 * Get stock valuation
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Stock valuation data
 */
export const getStockValuation = async (companyId, filters = {}) => {
  const { warehouseId, categoryId } = filters;

  const where = { companyId, quantity: { gt: 0 } };

  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  if (categoryId) {
    where.product = {
      categoryId
    };
  }

  const stockItems = await prisma.stock.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
          purchasePrice: true,
          sellingPrice: true,
          category: {
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
          name: true
        }
      }
    }
  });

  let totalCostValue = 0;
  let totalSellingValue = 0;
  const items = stockItems.map(item => {
    const costValue = item.quantity * item.product.purchasePrice;
    const sellingValue = item.quantity * item.product.sellingPrice;
    totalCostValue += parseFloat(costValue);
    totalSellingValue += parseFloat(sellingValue);

    return {
      ...item,
      costValue,
      sellingValue,
      potentialProfit: sellingValue - costValue
    };
  });

  return {
    items,
    summary: {
      totalItems: items.length,
      totalCostValue,
      totalSellingValue,
      potentialProfit: totalSellingValue - totalCostValue,
      profitMargin: totalCostValue > 0 ? ((totalSellingValue - totalCostValue) / totalCostValue * 100).toFixed(2) : 0
    }
  };
};

/**
 * Get stock aging report
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Stock aging data
 */
export const getStockAging = async (companyId, filters = {}) => {
  const { warehouseId } = filters;

  // Get latest stock movements for each product-warehouse combination
  const stockMovements = await prisma.stockMovement.findMany({
    where: {
      companyId,
      movementType: {
        in: [STOCK_MOVEMENT_TYPES.PURCHASE, STOCK_MOVEMENT_TYPES.OPENING_STOCK]
      },
      ...(warehouseId && { warehouseId })
    },
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
          purchasePrice: true
        }
      },
      warehouse: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      movementDate: 'desc'
    }
  });

  // Calculate aging for each item
  const now = new Date();
  const agingData = stockMovements.map(movement => {
    const ageInDays = Math.floor((now - new Date(movement.movementDate)) / (1000 * 60 * 60 * 24));

    let agingCategory = '';
    if (ageInDays <= 30) agingCategory = '0-30 days';
    else if (ageInDays <= 60) agingCategory = '31-60 days';
    else if (ageInDays <= 90) agingCategory = '61-90 days';
    else if (ageInDays <= 180) agingCategory = '91-180 days';
    else agingCategory = '180+ days';

    return {
      ...movement,
      ageInDays,
      agingCategory
    };
  });

  return agingData;
};

export default {
  getAllStock,
  getProductStock,
  transferStock,
  adjustStock,
  getLowStockProducts,
  getOutOfStockProducts,
  getStockValuation,
  getStockAging
};
