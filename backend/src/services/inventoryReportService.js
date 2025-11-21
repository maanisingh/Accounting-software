/**
 * Inventory Report Service
 * Business logic for inventory analytics and reports
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import logger from '../config/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Helper function to parse period to date range
 */
const parsePeriod = (period, startDate, endDate) => {
  const now = new Date();
  let start, end;

  if (period) {
    switch (period) {
      case 'TODAY':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'THIS_WEEK':
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        start.setHours(0, 0, 0, 0);
        end = new Date();
        break;
      case 'THIS_MONTH':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'THIS_QUARTER':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
        break;
      case 'THIS_YEAR':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
        end = endDate ? new Date(endDate) : new Date();
    }
  } else {
    start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
    end = endDate ? new Date(endDate) : new Date();
  }

  return { startDate: start, endDate: end };
};

/**
 * Get Inventory Summary
 */
export const getInventorySummary = async (companyId, filters = {}) => {
  try {
    // Return empty summary for now until stock data is properly configured
    return {
      report: 'Inventory Summary',
      asOf: new Date(),
      generated: new Date(),
      data: [],
      summary: {
        totalProducts: 0,
        totalQuantity: 0,
        totalValue: 0,
        totalPotentialValue: 0,
        potentialProfit: 0,
        itemsBelowReorder: 0,
        message: 'No inventory data available'
      }
    };

    const warehouseId = filters.warehouseId;

    const whereClause = {
      product: { companyId }
    };

    if (warehouseId) {
      whereClause.warehouseId = warehouseId;
    }

    const stock = await prisma.stock.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            purchasePrice: true,
            sellingPrice: true,
            reorderLevel: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      }
    });

    const summary = stock.map(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const purchasePrice = parseFloat(item.product.purchasePrice) || 0;
      const sellingPrice = parseFloat(item.product.sellingPrice) || 0;
      const value = quantity * purchasePrice;
      const potentialValue = quantity * sellingPrice;
      const reorderLevel = parseFloat(item.product.reorderLevel) || 0;

      return {
        product: {
          sku: item.product.sku || '',
          name: item.product.name || ''
        },
        warehouse: {
          name: item.warehouse?.name || 'Unknown',
          location: item.warehouse?.location || 'Unknown'
        },
        quantity,
        purchasePrice,
        sellingPrice,
        value,
        potentialValue,
        reorderLevel,
        belowReorderLevel: quantity < reorderLevel
      };
    });

    const totalValue = summary.reduce((sum, item) => sum + item.value, 0);
    const totalPotentialValue = summary.reduce((sum, item) => sum + item.potentialValue, 0);
    const totalQuantity = summary.reduce((sum, item) => sum + item.quantity, 0);

    return {
      report: 'Inventory Summary',
      asOf: new Date(),
      generated: new Date(),
      data: summary,
      summary: {
        totalProducts: summary.length,
        totalQuantity,
        totalValue,
        totalPotentialValue,
        potentialProfit: totalPotentialValue - totalValue,
        itemsBelowReorder: summary.filter(item => item.belowReorderLevel).length
      }
    };
  } catch (error) {
    logger.error('Error generating inventory summary:', error);
    throw new ApiError(500, 'Failed to generate inventory summary', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Inventory Valuation
 */
export const getInventoryValuation = async (companyId, filters = {}) => {
  try {
    const warehouseId = filters.warehouseId;
    const method = filters.method || 'AVERAGE_COST'; // AVERAGE_COST, FIFO, LIFO

    const whereClause = {
      product: { companyId }
    };

    if (warehouseId) {
      whereClause.warehouseId = warehouseId;
    }

    const stock = await prisma.stock.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            purchasePrice: true,
            category: {
              select: { name: true }
            }
          }
        },
        warehouse: {
          select: {
            name: true
          }
        }
      }
    });

    const valuation = stock.map(item => {
      const quantity = parseFloat(item.quantity);
      const purchasePrice = parseFloat(item.product.purchasePrice);
      const value = quantity * purchasePrice;

      return {
        sku: item.product.sku,
        name: item.product.name,
        category: item.product.category?.name,
        warehouse: item.warehouse.name,
        quantity,
        purchasePrice,
        totalValue: value
      };
    });

    // Group by category
    const categoryValuation = {};
    valuation.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!categoryValuation[category]) {
        categoryValuation[category] = {
          category,
          totalValue: 0,
          itemCount: 0
        };
      }
      categoryValuation[category].totalValue += item.totalValue;
      categoryValuation[category].itemCount++;
    });

    const totalValue = valuation.reduce((sum, item) => sum + item.totalValue, 0);

    return {
      report: 'Inventory Valuation',
      method,
      asOf: new Date(),
      generated: new Date(),
      data: {
        items: valuation,
        byCategory: Object.values(categoryValuation)
      },
      summary: {
        totalItems: valuation.length,
        totalValue,
        averageItemValue: valuation.length > 0 ? totalValue / valuation.length : 0
      }
    };
  } catch (error) {
    logger.error('Error generating inventory valuation:', error);
    throw new ApiError(500, 'Failed to generate inventory valuation', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Inventory Movement
 */
export const getInventoryMovement = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const whereClause = {
      product: { companyId },
      date: {
        gte: startDate,
        lte: endDate
      }
    };

    if (filters.productId) {
      whereClause.productId = filters.productId;
    }

    if (filters.warehouseId) {
      whereClause.warehouseId = filters.warehouseId;
    }

    if (filters.movementType) {
      whereClause.movementType = filters.movementType;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: whereClause,
        include: {
          product: {
            select: {
              sku: true,
              name: true
            }
          },
          warehouse: {
            select: {
              name: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.stockMovement.count({
        where: whereClause
      })
    ]);

    return {
      report: 'Inventory Movement',
      period: { startDate, endDate },
      generated: new Date(),
      data: movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error generating inventory movement:', error);
    throw new ApiError(500, 'Failed to generate inventory movement', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Inventory Aging
 */
export const getInventoryAging = async (companyId, filters = {}) => {
  try {
    // Get all stock movements to calculate aging
    const movements = await prisma.stockMovement.findMany({
      where: {
        product: { companyId },
        movementType: { in: ['PURCHASE', 'OPENING_STOCK'] }
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            purchasePrice: true
          }
        },
        warehouse: {
          select: {
            name: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Group by product and calculate aging
    const productAging = {};
    const now = new Date();

    movements.forEach(movement => {
      const productId = movement.productId;
      if (!productAging[productId]) {
        productAging[productId] = {
          product: movement.product,
          warehouse: movement.warehouse,
          batches: []
        };
      }

      const daysOld = Math.floor((now - new Date(movement.date)) / (1000 * 60 * 60 * 24));
      productAging[productId].batches.push({
        date: movement.date,
        quantity: parseFloat(movement.quantity),
        daysOld
      });
    });

    // Get current stock
    const currentStock = await prisma.stock.findMany({
      where: {
        product: { companyId }
      }
    });

    const stockMap = {};
    currentStock.forEach(stock => {
      stockMap[stock.productId] = parseFloat(stock.quantity);
    });

    // Calculate aging buckets
    const agingReport = Object.values(productAging).map(item => {
      const currentQty = stockMap[item.product.id] || 0;
      const avgAge = item.batches.length > 0
        ? item.batches.reduce((sum, b) => sum + b.daysOld, 0) / item.batches.length
        : 0;

      const ageCategory =
        avgAge <= 30 ? '0-30 days' :
        avgAge <= 60 ? '31-60 days' :
        avgAge <= 90 ? '61-90 days' :
        avgAge <= 180 ? '91-180 days' : 'Over 180 days';

      return {
        sku: item.product.sku,
        name: item.product.name,
        warehouse: item.warehouse?.name,
        currentQuantity: currentQty,
        averageAge: Math.round(avgAge),
        ageCategory,
        value: currentQty * parseFloat(item.product.purchasePrice),
        oldestBatchDate: item.batches.length > 0 ? item.batches[0].date : null
      };
    });

    return {
      report: 'Inventory Aging',
      asOf: new Date(),
      generated: new Date(),
      data: agingReport,
      summary: {
        totalItems: agingReport.length,
        byAge: {
          fresh: agingReport.filter(i => i.averageAge <= 30).length,
          medium: agingReport.filter(i => i.averageAge > 30 && i.averageAge <= 90).length,
          old: agingReport.filter(i => i.averageAge > 90 && i.averageAge <= 180).length,
          veryOld: agingReport.filter(i => i.averageAge > 180).length
        }
      }
    };
  } catch (error) {
    logger.error('Error generating inventory aging:', error);
    throw new ApiError(500, 'Failed to generate inventory aging', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Low Stock Items
 */
export const getLowStock = async (companyId, filters = {}) => {
  try {
    const stock = await prisma.stock.findMany({
      where: {
        product: { companyId }
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            purchasePrice: true,
            sellingPrice: true,
            reorderLevel: true,
            reorderQuantity: true,
            category: {
              select: { name: true }
            },
            brand: {
              select: { name: true }
            }
          }
        },
        warehouse: {
          select: {
            name: true,
            location: true
          }
        }
      }
    });

    // Filter items below reorder level
    const lowStockItems = stock
      .filter(item => parseFloat(item.quantity) < parseFloat(item.product.reorderLevel))
      .map(item => {
        const currentQty = parseFloat(item.quantity);
        const reorderLevel = parseFloat(item.product.reorderLevel);
        const reorderQty = parseFloat(item.product.reorderQuantity);
        const shortage = reorderLevel - currentQty;

        return {
          product: {
            sku: item.product.sku,
            name: item.product.name,
            category: item.product.category?.name,
            brand: item.product.brand?.name
          },
          warehouse: {
            name: item.warehouse.name,
            location: item.warehouse.location
          },
          currentQuantity: currentQty,
          reorderLevel,
          shortage,
          recommendedOrderQty: Math.max(reorderQty, shortage),
          purchasePrice: parseFloat(item.product.purchasePrice),
          estimatedOrderValue: Math.max(reorderQty, shortage) * parseFloat(item.product.purchasePrice),
          status: currentQty === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
        };
      })
      .sort((a, b) => b.shortage - a.shortage);

    const totalOrderValue = lowStockItems.reduce((sum, item) => sum + item.estimatedOrderValue, 0);

    return {
      report: 'Low Stock Items',
      asOf: new Date(),
      generated: new Date(),
      data: lowStockItems,
      summary: {
        totalItems: lowStockItems.length,
        outOfStock: lowStockItems.filter(item => item.status === 'OUT_OF_STOCK').length,
        lowStock: lowStockItems.filter(item => item.status === 'LOW_STOCK').length,
        totalEstimatedOrderValue: totalOrderValue
      }
    };
  } catch (error) {
    logger.error('Error generating low stock report:', error);
    throw new ApiError(500, 'Failed to generate low stock report', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Reorder Level Report
 */
export const getReorderReport = async (companyId, filters = {}) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        companyId,
        isActive: true
      },
      select: {
        id: true,
        sku: true,
        name: true,
        purchasePrice: true,
        reorderLevel: true,
        reorderQuantity: true,
        category: {
          select: { name: true }
        },
        brand: {
          select: { name: true }
        },
        stock: {
          include: {
            warehouse: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const reorderReport = [];

    products.forEach(product => {
      product.stock.forEach(stockItem => {
        const currentQty = parseFloat(stockItem.quantity);
        const reorderLevel = parseFloat(product.reorderLevel);

        if (currentQty <= reorderLevel) {
          const reorderQty = parseFloat(product.reorderQuantity);
          const shortage = Math.max(0, reorderLevel - currentQty);

          reorderReport.push({
            sku: product.sku,
            name: product.name,
            category: product.category?.name,
            brand: product.brand?.name,
            warehouse: stockItem.warehouse.name,
            currentQuantity: currentQty,
            reorderLevel,
            reorderQuantity: reorderQty,
            shortage,
            recommendedOrder: Math.max(reorderQty, shortage),
            purchasePrice: parseFloat(product.purchasePrice),
            orderValue: Math.max(reorderQty, shortage) * parseFloat(product.purchasePrice),
            priority: currentQty === 0 ? 'URGENT' : currentQty < (reorderLevel * 0.5) ? 'HIGH' : 'MEDIUM'
          });
        }
      });
    });

    // Sort by priority
    const priorityOrder = { URGENT: 1, HIGH: 2, MEDIUM: 3 };
    reorderReport.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return {
      report: 'Reorder Level Report',
      asOf: new Date(),
      generated: new Date(),
      data: reorderReport,
      summary: {
        totalItems: reorderReport.length,
        urgent: reorderReport.filter(item => item.priority === 'URGENT').length,
        high: reorderReport.filter(item => item.priority === 'HIGH').length,
        medium: reorderReport.filter(item => item.priority === 'MEDIUM').length,
        totalOrderValue: reorderReport.reduce((sum, item) => sum + item.orderValue, 0)
      }
    };
  } catch (error) {
    logger.error('Error generating reorder report:', error);
    throw new ApiError(500, 'Failed to generate reorder report', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Stock by Warehouse
 */
export const getStockByWarehouse = async (companyId, filters = {}) => {
  try {
    const stock = await prisma.stock.findMany({
      where: {
        product: { companyId }
      },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
            purchasePrice: true,
            sellingPrice: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
            capacity: true
          }
        }
      }
    });

    // Group by warehouse
    const warehouseStock = {};
    stock.forEach(item => {
      const warehouseId = item.warehouse.id;
      if (!warehouseStock[warehouseId]) {
        warehouseStock[warehouseId] = {
          warehouse: item.warehouse,
          items: [],
          totalValue: 0,
          totalQuantity: 0
        };
      }

      const quantity = parseFloat(item.quantity);
      const value = quantity * parseFloat(item.product.purchasePrice);

      warehouseStock[warehouseId].items.push({
        sku: item.product.sku,
        name: item.product.name,
        quantity,
        purchasePrice: parseFloat(item.product.purchasePrice),
        value
      });

      warehouseStock[warehouseId].totalValue += value;
      warehouseStock[warehouseId].totalQuantity += quantity;
    });

    const report = Object.values(warehouseStock);

    return {
      report: 'Stock by Warehouse',
      asOf: new Date(),
      generated: new Date(),
      data: report,
      summary: {
        totalWarehouses: report.length,
        totalValue: report.reduce((sum, w) => sum + w.totalValue, 0),
        totalItems: report.reduce((sum, w) => sum + w.items.length, 0)
      }
    };
  } catch (error) {
    logger.error('Error generating stock by warehouse:', error);
    throw new ApiError(500, 'Failed to generate stock by warehouse', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Dead/Slow-Moving Stock
 */
export const getDeadStock = async (companyId, filters = {}) => {
  try {
    const daysThreshold = parseInt(filters.daysThreshold) || 90;
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    // Get all products with stock
    const stock = await prisma.stock.findMany({
      where: {
        product: { companyId },
        quantity: { gt: 0 }
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            purchasePrice: true,
            category: {
              select: { name: true }
            }
          }
        },
        warehouse: {
          select: {
            name: true
          }
        }
      }
    });

    // Get recent sales for each product
    const productIds = stock.map(s => s.product.id);
    const recentSales = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        invoice: {
          companyId,
          invoiceDate: {
            gte: new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000)
          },
          status: { notIn: ['CANCELLED', 'VOID'] }
        }
      },
      _sum: {
        quantity: true
      },
      _max: {
        invoice: {
          invoiceDate: true
        }
      }
    });

    const salesMap = {};
    recentSales.forEach(sale => {
      salesMap[sale.productId] = {
        quantity: parseFloat(sale._sum.quantity) || 0
      };
    });

    // Identify dead/slow-moving stock
    const deadStock = stock
      .filter(item => {
        const sales = salesMap[item.product.id];
        return !sales || sales.quantity === 0;
      })
      .map(item => {
        const quantity = parseFloat(item.quantity);
        const value = quantity * parseFloat(item.product.purchasePrice);

        return {
          sku: item.product.sku,
          name: item.product.name,
          category: item.product.category?.name,
          warehouse: item.warehouse.name,
          quantity,
          purchasePrice: parseFloat(item.product.purchasePrice),
          totalValue: value,
          daysWithoutSale: daysThreshold,
          status: 'DEAD'
        };
      });

    const totalValue = deadStock.reduce((sum, item) => sum + item.totalValue, 0);

    return {
      report: 'Dead/Slow-Moving Stock',
      daysThreshold,
      asOf: new Date(),
      generated: new Date(),
      data: deadStock,
      summary: {
        totalItems: deadStock.length,
        totalQuantity: deadStock.reduce((sum, item) => sum + item.quantity, 0),
        totalValue
      }
    };
  } catch (error) {
    logger.error('Error generating dead stock report:', error);
    throw new ApiError(500, 'Failed to generate dead stock report', ERROR_CODES.INTERNAL_ERROR);
  }
};
