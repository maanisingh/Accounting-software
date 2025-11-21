/**
 * Brand Service
 * Business logic for brand management operations
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Create a new brand
 * @param {Object} brandData - Brand data
 * @param {string} userId - ID of user creating the brand
 * @returns {Promise<Object>} Created brand
 */
export const createBrand = async (brandData, userId) => {
  const { companyId, name, description, logo } = brandData;

  // Check if brand name already exists for this company
  const existingBrand = await prisma.brand.findFirst({
    where: {
      companyId,
      name: {
        equals: name,
        mode: 'insensitive'
      }
    }
  });

  if (existingBrand) {
    throw ApiError.conflict('Brand with this name already exists', ERROR_CODES.DB_DUPLICATE_ENTRY);
  }

  // Create brand
  const brand = await prisma.brand.create({
    data: {
      companyId,
      name,
      description: description || null,
      logo: logo || null
    }
  });

  logger.info(`Brand created: ${brand.name} by ${userId}`);

  return brand;
};

/**
 * Get all brands for a company
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of brands
 */
export const getBrands = async (companyId, filters = {}) => {
  const { isActive, search } = filters;

  const where = { companyId };

  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const brands = await prisma.brand.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  return brands;
};

/**
 * Get brand by ID
 * @param {string} brandId - Brand ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Brand details
 */
export const getBrandById = async (brandId, companyId) => {
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, companyId },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  if (!brand) {
    throw ApiError.notFound('Brand not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return brand;
};

/**
 * Update brand
 * @param {string} brandId - Brand ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated brand
 */
export const updateBrand = async (brandId, companyId, updateData, userId) => {
  // Check if brand exists
  const existingBrand = await prisma.brand.findFirst({
    where: { id: brandId, companyId }
  });

  if (!existingBrand) {
    throw ApiError.notFound('Brand not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // If name is being updated, check for duplicates
  if (updateData.name && updateData.name !== existingBrand.name) {
    const nameExists = await prisma.brand.findFirst({
      where: {
        companyId,
        name: {
          equals: updateData.name,
          mode: 'insensitive'
        },
        id: { not: brandId }
      }
    });

    if (nameExists) {
      throw ApiError.conflict('Brand with this name already exists', ERROR_CODES.DB_DUPLICATE_ENTRY);
    }
  }

  // Update brand
  const brand = await prisma.brand.update({
    where: { id: brandId },
    data: updateData
  });

  logger.info(`Brand updated: ${brandId} by ${userId}`);

  return brand;
};

/**
 * Delete brand
 * @param {string} brandId - Brand ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deleteBrand = async (brandId, companyId, userId) => {
  // Check if brand exists
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, companyId },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  if (!brand) {
    throw ApiError.notFound('Brand not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Check if brand is used in any products
  if (brand._count.products > 0) {
    throw ApiError.badRequest(
      `Cannot delete brand. It is used in ${brand._count.products} product(s). Please remove the brand from all products first or deactivate the brand.`
    );
  }

  // Delete brand
  await prisma.brand.delete({
    where: { id: brandId }
  });

  logger.info(`Brand deleted: ${brandId} by ${userId}`);
};

export default {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand
};
