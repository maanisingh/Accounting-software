/**
 * Warehouse Service
 * Business logic for warehouse management operations
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Create a new warehouse
 * @param {Object} warehouseData - Warehouse data
 * @param {string} userId - ID of user creating the warehouse
 * @returns {Promise<Object>} Created warehouse
 */
export const createWarehouse = async (warehouseData, userId) => {
  const { companyId, code, name, address, city, state, country, postalCode, phone, email, isDefault } = warehouseData;

  // Check if warehouse code already exists for this company
  const existingCode = await prisma.warehouse.findUnique({
    where: {
      companyId_code: {
        companyId,
        code
      }
    }
  });

  if (existingCode) {
    throw ApiError.conflict('Warehouse with this code already exists', ERROR_CODES.DB_DUPLICATE_ENTRY);
  }

  // If this is set as default, unset other defaults
  if (isDefault) {
    await prisma.warehouse.updateMany({
      where: { companyId, isDefault: true },
      data: { isDefault: false }
    });
  }

  // If no warehouses exist for company, make this the default
  const warehouseCount = await prisma.warehouse.count({ where: { companyId } });
  const shouldBeDefault = warehouseCount === 0 || isDefault;

  // Create warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      companyId,
      code,
      name,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || 'India',
      postalCode: postalCode || null,
      phone: phone || null,
      email: email || null,
      isDefault: shouldBeDefault
    }
  });

  logger.info(`Warehouse created: ${warehouse.name} (${warehouse.code}) by ${userId}`);

  return warehouse;
};

/**
 * Get all warehouses for a company
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of warehouses
 */
export const getWarehouses = async (companyId, filters = {}) => {
  const { isActive, search } = filters;

  const where = { companyId };

  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } }
    ];
  }

  const warehouses = await prisma.warehouse.findMany({
    where,
    orderBy: [
      { isDefault: 'desc' },
      { name: 'asc' }
    ],
    include: {
      _count: {
        select: {
          stock: true
        }
      }
    }
  });

  return warehouses;
};

/**
 * Get warehouse by ID
 * @param {string} warehouseId - Warehouse ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Warehouse details
 */
export const getWarehouseById = async (warehouseId, companyId) => {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, companyId },
    include: {
      _count: {
        select: {
          stock: true,
          stockMovements: true
        }
      }
    }
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return warehouse;
};

/**
 * Update warehouse
 * @param {string} warehouseId - Warehouse ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated warehouse
 */
export const updateWarehouse = async (warehouseId, companyId, updateData, userId) => {
  // Check if warehouse exists
  const existingWarehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, companyId }
  });

  if (!existingWarehouse) {
    throw ApiError.notFound('Warehouse not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // If code is being updated, check for duplicates
  if (updateData.code && updateData.code !== existingWarehouse.code) {
    const codeExists = await prisma.warehouse.findUnique({
      where: {
        companyId_code: {
          companyId,
          code: updateData.code
        }
      }
    });

    if (codeExists) {
      throw ApiError.conflict('Warehouse with this code already exists', ERROR_CODES.DB_DUPLICATE_ENTRY);
    }
  }

  // If setting as default, unset other defaults
  if (updateData.isDefault === true) {
    await prisma.warehouse.updateMany({
      where: {
        companyId,
        isDefault: true,
        id: { not: warehouseId }
      },
      data: { isDefault: false }
    });
  }

  // Prevent unsetting default if this is the only warehouse
  if (updateData.isDefault === false && existingWarehouse.isDefault) {
    const warehouseCount = await prisma.warehouse.count({
      where: { companyId, isActive: true }
    });

    if (warehouseCount === 1) {
      throw ApiError.badRequest('Cannot unset default warehouse when it is the only active warehouse');
    }
  }

  // Update warehouse
  const warehouse = await prisma.warehouse.update({
    where: { id: warehouseId },
    data: updateData
  });

  logger.info(`Warehouse updated: ${warehouseId} by ${userId}`);

  return warehouse;
};

/**
 * Delete warehouse
 * @param {string} warehouseId - Warehouse ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deleteWarehouse = async (warehouseId, companyId, userId) => {
  // Check if warehouse exists
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, companyId },
    include: {
      stock: {
        where: {
          quantity: { gt: 0 }
        }
      }
    }
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Check if warehouse has stock
  if (warehouse.stock.length > 0) {
    throw ApiError.badRequest(
      `Cannot delete warehouse. It has stock for ${warehouse.stock.length} product(s). Please transfer all stock to another warehouse first.`
    );
  }

  // Prevent deletion of default warehouse if it's the only one
  if (warehouse.isDefault) {
    const warehouseCount = await prisma.warehouse.count({ where: { companyId } });
    if (warehouseCount === 1) {
      throw ApiError.badRequest('Cannot delete the only warehouse');
    }
  }

  // Delete warehouse
  await prisma.warehouse.delete({
    where: { id: warehouseId }
  });

  // If deleted warehouse was default, set another as default
  if (warehouse.isDefault) {
    const nextWarehouse = await prisma.warehouse.findFirst({
      where: { companyId, isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    if (nextWarehouse) {
      await prisma.warehouse.update({
        where: { id: nextWarehouse.id },
        data: { isDefault: true }
      });
    }
  }

  logger.info(`Warehouse deleted: ${warehouseId} by ${userId}`);
};

/**
 * Get all stock in a warehouse
 * @param {string} warehouseId - Warehouse ID
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Stock items in warehouse
 */
export const getWarehouseStock = async (warehouseId, companyId, filters = {}) => {
  // Verify warehouse exists
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, companyId }
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  const { showZero = false, search } = filters;

  const where = { warehouseId, companyId };

  // By default, hide zero stock items
  if (showZero !== 'true' && showZero !== true) {
    where.quantity = { gt: 0 };
  }

  // Apply search filter on product if provided
  if (search) {
    where.product = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    };
  }

  const stockItems = await prisma.stock.findMany({
    where,
    orderBy: [
      { quantity: 'desc' },
      { product: { name: 'asc' } }
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
          reorderLevel: true,
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
      }
    }
  });

  return stockItems;
};

export default {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseStock
};
