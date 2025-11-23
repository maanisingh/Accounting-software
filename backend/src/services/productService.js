/**
 * Product Service
 * Business logic for product management operations
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, PAGINATION, PRODUCT_TYPES } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @param {string} userId - ID of user creating the product
 * @returns {Promise<Object>} Created product
 */
export const createProduct = async (productData, userId) => {
  const { companyId, sku, name, description, type, categoryId, brandId, barcode, unit, purchasePrice, sellingPrice, mrp, taxRate, hsnCode, sacCode, reorderLevel, minStockLevel, maxStockLevel } = productData;

  // Support both old and new field names for backward compatibility
  const actualMrp = mrp || sellingPrice || 0;
  const actualMinStockLevel = minStockLevel || reorderLevel || 0;

  // Check if SKU already exists for this company
  const existingSku = await prisma.product.findUnique({
    where: {
      companyId_sku: {
        companyId,
        sku
      }
    }
  });

  if (existingSku) {
    throw ApiError.conflict('Product with this SKU already exists', ERROR_CODES.DB_DUPLICATE_ENTRY);
  }

  // Verify category exists if provided
  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, companyId }
    });
    if (!category) {
      throw ApiError.notFound('Category not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }
  }

  // Verify brand exists if provided
  if (brandId) {
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, companyId }
    });
    if (!brand) {
      throw ApiError.notFound('Brand not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }
  }

  // Create product
  const product = await prisma.product.create({
    data: {
      companyId,
      sku,
      name,
      description: description || null,
      type: type || PRODUCT_TYPES.GOODS,
      categoryId: categoryId || null,
      brandId: brandId || null,
      barcode: barcode || null,
      unit: unit || 'PCS',
      purchasePrice: purchasePrice || 0,
      mrp: actualMrp,
      taxRate: taxRate || 0,
      hsnCode: hsnCode || null,
      sacCode: sacCode || null,
      minStockLevel: actualMinStockLevel,
      maxStockLevel: maxStockLevel || 0,
      createdBy: userId
    },
    include: {
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
  });

  logger.info(`Product created: ${product.name} (${product.sku}) by ${userId}`);

  return product;
};

/**
 * Get product by ID with stock levels
 * @param {string} productId - Product ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Product details with stock
 */
export const getProductById = async (productId, companyId) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId },
    include: {
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
      },
      stock: {
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      }
    }
  });

  if (!product) {
    throw ApiError.notFound('Product not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Calculate total stock
  const totalStock = product.stock.reduce((sum, s) => sum + s.quantity, 0);
  const totalReserved = product.stock.reduce((sum, s) => sum + s.reservedQty, 0);
  const totalAvailable = product.stock.reduce((sum, s) => sum + s.availableQty, 0);

  return {
    ...product,
    totalStock,
    totalReserved,
    totalAvailable
  };
};

/**
 * Get products list with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Products list with pagination
 */
export const getProducts = async (filters) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search,
    categoryId,
    brandId,
    type,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    companyId
  } = filters;

  // Build where clause
  const where = { companyId };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (brandId) {
    where.brandId = brandId;
  }

  if (type) {
    where.type = type;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Get total count
  const total = await prisma.product.count({ where });

  // Get products
  const products = await prisma.product.findMany({
    where,
    skip,
    take,
    orderBy: { [sortBy]: sortOrder },
    include: {
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
      },
      stock: {
        select: {
          quantity: true,
          reservedQty: true,
          availableQty: true
        }
      }
    }
  });

  // Add total stock to each product
  const productsWithStock = products.map(product => {
    const totalStock = product.stock.reduce((sum, s) => sum + s.quantity, 0);
    const totalReserved = product.stock.reduce((sum, s) => sum + s.reservedQty, 0);
    const totalAvailable = product.stock.reduce((sum, s) => sum + s.availableQty, 0);

    const { stock, ...productData } = product;
    return {
      ...productData,
      totalStock,
      totalReserved,
      totalAvailable
    };
  });

  return {
    products: productsWithStock,
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
 * Update product
 * @param {string} productId - Product ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated product
 */
export const updateProduct = async (productId, companyId, updateData, userId) => {
  // Check if product exists
  const existingProduct = await prisma.product.findFirst({
    where: { id: productId, companyId }
  });

  if (!existingProduct) {
    throw ApiError.notFound('Product not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // If SKU is being updated, check for duplicates
  if (updateData.sku && updateData.sku !== existingProduct.sku) {
    const skuExists = await prisma.product.findUnique({
      where: {
        companyId_sku: {
          companyId,
          sku: updateData.sku
        }
      }
    });

    if (skuExists) {
      throw ApiError.conflict('Product with this SKU already exists', ERROR_CODES.DB_DUPLICATE_ENTRY);
    }
  }

  // Verify category if being updated
  if (updateData.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: updateData.categoryId, companyId }
    });
    if (!category) {
      throw ApiError.notFound('Category not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }
  }

  // Verify brand if being updated
  if (updateData.brandId) {
    const brand = await prisma.brand.findFirst({
      where: { id: updateData.brandId, companyId }
    });
    if (!brand) {
      throw ApiError.notFound('Brand not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }
  }

  // Update product
  const product = await prisma.product.update({
    where: { id: productId },
    data: updateData,
    include: {
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
  });

  logger.info(`Product updated: ${productId} by ${userId}`);

  return product;
};

/**
 * Delete product (soft delete if has transactions)
 * @param {string} productId - Product ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deleteProduct = async (productId, companyId, userId) => {
  // Check if product exists
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId },
    include: {
      stock: true,
      stockMovements: true
    }
  });

  if (!product) {
    throw ApiError.notFound('Product not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Check if product has stock or movements
  const hasStock = product.stock.some(s => s.quantity > 0);
  const hasMovements = product.stockMovements.length > 0;

  if (hasStock || hasMovements) {
    // Soft delete - just deactivate
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false }
    });
    logger.info(`Product soft deleted (deactivated): ${productId} by ${userId}`);
  } else {
    // Hard delete - no stock or movements
    await prisma.product.delete({
      where: { id: productId }
    });
    logger.info(`Product hard deleted: ${productId} by ${userId}`);
  }
};

/**
 * Search products by name, SKU, or barcode
 * @param {string} query - Search query
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} Matching products
 */
export const searchProducts = async (query, companyId) => {
  const products = await prisma.product.findMany({
    where: {
      companyId,
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 50,
    include: {
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
      },
      stock: {
        select: {
          quantity: true,
          availableQty: true
        }
      }
    }
  });

  return products.map(product => {
    const totalStock = product.stock.reduce((sum, s) => sum + s.quantity, 0);
    const totalAvailable = product.stock.reduce((sum, s) => sum + s.availableQty, 0);
    const { stock, ...productData } = product;
    return { ...productData, totalStock, totalAvailable };
  });
};

/**
 * Bulk create products
 * @param {Array} productsData - Array of product data
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user creating products
 * @returns {Promise<Object>} Created products and errors
 */
export const bulkCreateProducts = async (productsData, companyId, userId) => {
  const created = [];
  const errors = [];

  for (const productData of productsData) {
    try {
      const product = await createProduct({ ...productData, companyId }, userId);
      created.push(product);
    } catch (error) {
      errors.push({
        sku: productData.sku,
        name: productData.name,
        error: error.message
      });
    }
  }

  logger.info(`Bulk product creation: ${created.length} succeeded, ${errors.length} failed`);

  return { created, errors };
};

/**
 * Get stock levels for a product across all warehouses
 * @param {string} productId - Product ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} Stock levels by warehouse
 */
export const getProductStock = async (productId, companyId) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId }
  });

  if (!product) {
    throw ApiError.notFound('Product not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  const stockLevels = await prisma.stock.findMany({
    where: { productId },
    include: {
      warehouse: {
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true
        }
      }
    }
  });

  return stockLevels;
};

/**
 * Adjust stock for a product
 * @param {string} productId - Product ID
 * @param {string} warehouseId - Warehouse ID
 * @param {number} quantity - Quantity to adjust (positive or negative)
 * @param {string} reason - Reason for adjustment
 * @param {string} reference - Reference document
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing adjustment
 * @returns {Promise<Object>} Updated stock
 */
export const adjustProductStock = async (productId, warehouseId, quantity, reason, reference, companyId, userId) => {
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
      throw ApiError.badRequest('Stock cannot go negative', ERROR_CODES.INSUFFICIENT_STOCK);
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
        movementType: 'ADJUSTMENT',
        referenceType: reference ? 'MANUAL_ADJUSTMENT' : null,
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

    return updatedStock;
  });
};

/**
 * Get stock movement history for a product
 * @param {string} productId - Product ID
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Movement history with pagination
 */
export const getProductMovements = async (productId, companyId, filters) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    warehouseId,
    movementType,
    startDate,
    endDate
  } = filters;

  // Verify product exists
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId }
  });

  if (!product) {
    throw ApiError.notFound('Product not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Build where clause
  const where = { productId, companyId };

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
      warehouse: {
        select: {
          id: true,
          name: true,
          code: true
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

export default {
  createProduct,
  getProductById,
  getProducts,
  updateProduct,
  deleteProduct,
  searchProducts,
  bulkCreateProducts,
  getProductStock,
  adjustProductStock,
  getProductMovements
};
