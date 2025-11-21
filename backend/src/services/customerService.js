/**
 * Customer Service
 * Business logic for customer management operations
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Generate next customer number
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Next customer number
 */
const generateCustomerNumber = async (companyId) => {
  const lastCustomer = await prisma.customer.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastCustomer || !lastCustomer.customerNumber) {
    return 'CUST-0001';
  }

  const lastNumber = parseInt(lastCustomer.customerNumber.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `CUST-${nextNumber.toString().padStart(4, '0')}`;
};

/**
 * Create a new customer
 * @param {Object} customerData - Customer data
 * @param {string} userId - ID of user creating the customer
 * @returns {Promise<Object>} Created customer
 */
export const createCustomer = async (customerData, userId) => {
  const { companyId, name, email, phone, address, city, state, country, postalCode, taxNumber, creditLimit, creditDays, openingBalance, notes } = customerData;

  // Check if customer email already exists for this company (if email provided)
  if (email) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        companyId,
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    });

    if (existingCustomer) {
      throw ApiError.conflict('Customer with this email already exists', ERROR_CODES.DB_DUPLICATE_ENTRY);
    }
  }

  // Generate customer number
  const customerNumber = await generateCustomerNumber(companyId);

  // Create customer
  const customer = await prisma.customer.create({
    data: {
      companyId,
      customerNumber,
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || 'India',
      postalCode: postalCode || null,
      taxNumber: taxNumber || null,
      creditLimit: creditLimit || 0,
      creditDays: creditDays || 30,
      openingBalance: openingBalance || 0,
      currentBalance: openingBalance || 0,
      notes: notes || null,
      createdBy: userId
    }
  });

  logger.info(`Customer created: ${customer.name} (${customer.customerNumber}) by ${userId}`);

  return customer;
};

/**
 * Get all customers for a company
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of customers
 */
export const getCustomers = async (companyId, filters = {}) => {
  const { isActive, search, page = 1, limit = 50 } = filters;

  const where = { companyId };

  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { customerNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      include: {
        _count: {
          select: {
            salesOrders: true,
            invoices: true,
            receipts: true
          }
        }
      }
    }),
    prisma.customer.count({ where })
  ]);

  return {
    customers,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * Get customer by ID
 * @param {string} customerId - Customer ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Customer details
 */
export const getCustomerById = async (customerId, companyId) => {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId },
    include: {
      _count: {
        select: {
          salesQuotations: true,
          salesOrders: true,
          deliveryChallans: true,
          invoices: true,
          salesReturns: true,
          receipts: true
        }
      }
    }
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return customer;
};

/**
 * Update customer
 * @param {string} customerId - Customer ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated customer
 */
export const updateCustomer = async (customerId, companyId, updateData, userId) => {
  // Check if customer exists
  const existingCustomer = await prisma.customer.findFirst({
    where: { id: customerId, companyId }
  });

  if (!existingCustomer) {
    throw ApiError.notFound('Customer not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // If email is being updated, check for duplicates
  if (updateData.email && updateData.email !== existingCustomer.email) {
    const emailExists = await prisma.customer.findFirst({
      where: {
        companyId,
        email: {
          equals: updateData.email,
          mode: 'insensitive'
        },
        id: { not: customerId }
      }
    });

    if (emailExists) {
      throw ApiError.conflict('Customer with this email already exists', ERROR_CODES.DB_DUPLICATE_ENTRY);
    }
  }

  // Don't allow updating customer number or balance
  delete updateData.customerNumber;
  delete updateData.currentBalance;
  delete updateData.companyId;

  // Update customer
  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: updateData
  });

  logger.info(`Customer updated: ${customerId} by ${userId}`);

  return customer;
};

/**
 * Delete customer
 * @param {string} customerId - Customer ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deleteCustomer = async (customerId, companyId, userId) => {
  // Check if customer exists
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId },
    include: {
      _count: {
        select: {
          salesOrders: true,
          invoices: true,
          receipts: true
        }
      }
    }
  });

  if (!customer) {
    throw ApiError.notFound('Customer not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Check if customer has transactions
  const transactionCount = customer._count.salesOrders + customer._count.invoices + customer._count.receipts;

  if (transactionCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete customer. It has ${transactionCount} transaction(s). Please deactivate the customer instead.`
    );
  }

  // Delete customer
  await prisma.customer.delete({
    where: { id: customerId }
  });

  logger.info(`Customer deleted: ${customerId} by ${userId}`);
};

export default {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
};
