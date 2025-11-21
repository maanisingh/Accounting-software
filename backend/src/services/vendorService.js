/**
 * Vendor Service
 * Business logic for vendor management operations
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Generate next vendor number
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Next vendor number
 */
const generateVendorNumber = async (companyId) => {
  const lastVendor = await prisma.vendor.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastVendor || !lastVendor.vendorNumber) {
    return 'VEND-0001';
  }

  const lastNumber = parseInt(lastVendor.vendorNumber.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `VEND-${nextNumber.toString().padStart(4, '0')}`;
};

/**
 * Create a new vendor
 * @param {Object} vendorData - Vendor data
 * @param {string} userId - ID of user creating the vendor
 * @returns {Promise<Object>} Created vendor
 */
export const createVendor = async (vendorData, userId) => {
  const { companyId, name, email, phone, address, city, state, country, postalCode, taxNumber, paymentTerms, openingBalance, notes } = vendorData;

  // Check if vendor email already exists for this company (if email provided)
  if (email) {
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        companyId,
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    });

    if (existingVendor) {
      throw ApiError.conflict('Vendor with this email already exists', ERROR_CODES.DB_DUPLICATE_ENTRY);
    }
  }

  // Generate vendor number
  const vendorNumber = await generateVendorNumber(companyId);

  // Create vendor
  const vendor = await prisma.vendor.create({
    data: {
      companyId,
      vendorNumber,
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || 'India',
      postalCode: postalCode || null,
      taxNumber: taxNumber || null,
      paymentTerms: paymentTerms || 30,
      openingBalance: openingBalance || 0,
      currentBalance: openingBalance || 0,
      notes: notes || null,
      createdBy: userId
    }
  });

  logger.info(`Vendor created: ${vendor.name} (${vendor.vendorNumber}) by ${userId}`);

  return vendor;
};

/**
 * Get all vendors for a company
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of vendors
 */
export const getVendors = async (companyId, filters = {}) => {
  const { isActive, search, page = 1, limit = 50 } = filters;

  const where = { companyId };

  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { vendorNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            bills: true,
            payments: true
          }
        }
      }
    }),
    prisma.vendor.count({ where })
  ]);

  return {
    vendors,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * Get vendor by ID
 * @param {string} vendorId - Vendor ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Vendor details
 */
export const getVendorById = async (vendorId, companyId) => {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId },
    include: {
      _count: {
        select: {
          purchaseQuotations: true,
          purchaseOrders: true,
          goodsReceipts: true,
          bills: true,
          purchaseReturns: true,
          payments: true
        }
      }
    }
  });

  if (!vendor) {
    throw ApiError.notFound('Vendor not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return vendor;
};

/**
 * Update vendor
 * @param {string} vendorId - Vendor ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated vendor
 */
export const updateVendor = async (vendorId, companyId, updateData, userId) => {
  // Check if vendor exists
  const existingVendor = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId }
  });

  if (!existingVendor) {
    throw ApiError.notFound('Vendor not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // If email is being updated, check for duplicates
  if (updateData.email && updateData.email !== existingVendor.email) {
    const emailExists = await prisma.vendor.findFirst({
      where: {
        companyId,
        email: {
          equals: updateData.email,
          mode: 'insensitive'
        },
        id: { not: vendorId }
      }
    });

    if (emailExists) {
      throw ApiError.conflict('Vendor with this email already exists', ERROR_CODES.DB_DUPLICATE_ENTRY);
    }
  }

  // Don't allow updating vendor number or balance
  delete updateData.vendorNumber;
  delete updateData.currentBalance;
  delete updateData.companyId;

  // Update vendor
  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: updateData
  });

  logger.info(`Vendor updated: ${vendorId} by ${userId}`);

  return vendor;
};

/**
 * Delete vendor
 * @param {string} vendorId - Vendor ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deleteVendor = async (vendorId, companyId, userId) => {
  // Check if vendor exists
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId },
    include: {
      _count: {
        select: {
          purchaseOrders: true,
          bills: true,
          payments: true
        }
      }
    }
  });

  if (!vendor) {
    throw ApiError.notFound('Vendor not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Check if vendor has transactions
  const transactionCount = vendor._count.purchaseOrders + vendor._count.bills + vendor._count.payments;

  if (transactionCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete vendor. It has ${transactionCount} transaction(s). Please deactivate the vendor instead.`
    );
  }

  // Delete vendor
  await prisma.vendor.delete({
    where: { id: vendorId }
  });

  logger.info(`Vendor deleted: ${vendorId} by ${userId}`);
};

export default {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor
};
