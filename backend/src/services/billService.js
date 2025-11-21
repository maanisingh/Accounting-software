/**
 * Bill Service
 * Business logic for bill management and payment tracking
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, PAGINATION, DOCUMENT_STATUS, PAYMENT_STATUS, TRANSACTION_TYPES } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Generate next bill number
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Next bill number
 */
const generateBillNumber = async (companyId) => {
  const lastBill = await prisma.bill.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastBill) {
    return 'BILL-0001';
  }

  const lastNumber = parseInt(lastBill.billNumber.split('-')[1]);
  return `BILL-${String(lastNumber + 1).padStart(4, '0')}`;
};

/**
 * Calculate bill totals
 * @param {Array} items - Bill items
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
 * Calculate due date based on payment terms
 * @param {Date} billDate - Bill date
 * @param {number} paymentTerms - Payment terms in days
 * @returns {Date} Due date
 */
const calculateDueDate = (billDate, paymentTerms) => {
  const dueDate = new Date(billDate);
  dueDate.setDate(dueDate.getDate() + paymentTerms);
  return dueDate;
};

/**
 * Determine payment status
 * @param {number} total - Bill total
 * @param {number} paidAmount - Paid amount
 * @param {Date} dueDate - Due date
 * @returns {string} Payment status
 */
const determinePaymentStatus = (total, paidAmount, dueDate) => {
  if (paidAmount === 0) {
    if (new Date() > new Date(dueDate)) {
      return PAYMENT_STATUS.OVERDUE;
    }
    return PAYMENT_STATUS.PENDING;
  }

  if (paidAmount >= total) {
    return PAYMENT_STATUS.PAID;
  }

  return PAYMENT_STATUS.PARTIAL;
};

/**
 * Create journal entry for bill
 * @param {Object} bill - Bill data
 * @param {Object} tx - Prisma transaction
 * @param {string} userId - User ID
 */
const createJournalEntry = async (bill, tx, userId) => {
  // Generate entry number
  const lastEntry = await tx.journalEntry.findFirst({
    where: { companyId: bill.companyId },
    orderBy: { createdAt: 'desc' }
  });

  const entryNumber = lastEntry
    ? `JE-${String(parseInt(lastEntry.entryNumber.split('-')[1]) + 1).padStart(4, '0')}`
    : 'JE-0001';

  // Get default accounts (in real implementation, these should come from settings)
  // For now, we'll create the entry structure
  const journalEntry = await tx.journalEntry.create({
    data: {
      companyId: bill.companyId,
      entryNumber,
      entryDate: bill.billDate,
      entryType: 'SYSTEM',
      referenceType: 'BILL',
      referenceId: bill.id,
      referenceNumber: bill.billNumber,
      description: `Bill from vendor - ${bill.billNumber}`,
      totalDebit: bill.total,
      totalCredit: bill.total,
      isPosted: true,
      postedAt: new Date(),
      createdBy: userId
    }
  });

  // Note: In production, you would fetch actual account IDs from company settings
  // For now, we're creating the structure without actual account linking
  // This would require:
  // 1. Debit: Purchases/Expense Account (bill.total)
  // 2. Credit: Accounts Payable (bill.total)

  logger.info(`Journal entry created for bill: ${bill.billNumber}`);

  return journalEntry;
};

/**
 * Create a new bill
 * @param {Object} billData - Bill data
 * @param {string} userId - ID of user creating the bill
 * @returns {Promise<Object>} Created bill
 */
export const createBill = async (billData, userId) => {
  const { companyId, vendorId, billDate, purchaseOrderId, items, notes, terms } = billData;

  // Verify vendor exists
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId }
  });

  if (!vendor) {
    throw ApiError.notFound('Vendor not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Verify purchase order if provided
  if (purchaseOrderId) {
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, companyId }
    });

    if (!purchaseOrder) {
      throw ApiError.notFound('Purchase order not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
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

  // Generate bill number
  const billNumber = await generateBillNumber(companyId);

  // Calculate totals
  const totals = calculateTotals(items);

  // Calculate due date
  const dueDate = calculateDueDate(billDate || new Date(), vendor.paymentTerms);

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
      unitPrice: parseFloat(item.unitPrice),
      taxRate: parseFloat(item.taxRate) || 0,
      discountAmount: itemDiscount,
      amount
    };
  });

  // Create bill with items
  const bill = await prisma.bill.create({
    data: {
      companyId,
      vendorId,
      billNumber,
      billDate: billDate ? new Date(billDate) : new Date(),
      dueDate,
      purchaseOrderId: purchaseOrderId || null,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: totals.discountAmount,
      total: totals.total,
      paidAmount: 0,
      balanceAmount: totals.total,
      paymentStatus: PAYMENT_STATUS.PENDING,
      status: DOCUMENT_STATUS.DRAFT,
      notes: notes || null,
      terms: terms || null,
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
          phone: true,
          paymentTerms: true
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

  logger.info(`Bill created: ${billNumber} by ${userId}`);

  return bill;
};

/**
 * Get bill by ID
 * @param {string} billId - Bill ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Bill details
 */
export const getBillById = async (billId, companyId) => {
  const bill = await prisma.bill.findFirst({
    where: { id: billId, companyId },
    include: {
      vendor: true,
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
      },
      payments: {
        orderBy: {
          paymentDate: 'desc'
        }
      }
    }
  });

  if (!bill) {
    throw ApiError.notFound('Bill not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return bill;
};

/**
 * Get bills list with filters and pagination
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Bills list with pagination
 */
export const getBills = async (filters) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search,
    vendorId,
    status,
    paymentStatus,
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

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (startDate || endDate) {
    where.billDate = {};
    if (startDate) {
      where.billDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.billDate.lte = new Date(endDate);
    }
  }

  if (search) {
    where.OR = [
      { billNumber: { contains: search, mode: 'insensitive' } },
      { vendor: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = Math.min(limit, PAGINATION.MAX_LIMIT);

  // Get total count
  const total = await prisma.bill.count({ where });

  // Get bills
  const bills = await prisma.bill.findMany({
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
  const billsWithCount = bills.map(bill => ({
    ...bill,
    itemCount: bill.items.length,
    items: undefined
  }));

  return {
    bills: billsWithCount,
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
 * Update bill
 * @param {string} billId - Bill ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated bill
 */
export const updateBill = async (billId, companyId, updateData, userId) => {
  const existingBill = await prisma.bill.findFirst({
    where: { id: billId, companyId },
    include: {
      vendor: true
    }
  });

  if (!existingBill) {
    throw ApiError.notFound('Bill not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot update if approved
  if (existingBill.status === DOCUMENT_STATUS.APPROVED) {
    throw ApiError.badRequest('Cannot update approved bill', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  const { billDate, items, notes, terms } = updateData;

  return await prisma.$transaction(async (tx) => {
    let totals = null;
    let itemsWithAmounts = null;
    let dueDate = existingBill.dueDate;

    // If items are being updated, recalculate totals
    if (items) {
      // Verify all products exist
      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, companyId }
        });

        if (!product) {
          throw ApiError.notFound(`Product ${item.productId} not found`, ERROR_CODES.DB_RECORD_NOT_FOUND);
        }
      }

      // Calculate totals
      totals = calculateTotals(items);

      // Calculate item amounts
      itemsWithAmounts = items.map(item => {
        const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
        const itemDiscount = parseFloat(item.discountAmount) || 0;
        const itemTaxableAmount = itemSubtotal - itemDiscount;
        const itemTax = (itemTaxableAmount * parseFloat(item.taxRate)) / 100;
        const amount = itemTaxableAmount + itemTax;

        return {
          productId: item.productId,
          description: item.description || null,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          taxRate: parseFloat(item.taxRate) || 0,
          discountAmount: itemDiscount,
          amount
        };
      });

      // Delete existing items
      await tx.billItem.deleteMany({
        where: { billId }
      });
    }

    // Recalculate due date if bill date changed
    if (billDate) {
      dueDate = calculateDueDate(new Date(billDate), existingBill.vendor.paymentTerms);
    }

    // Update bill
    const bill = await tx.bill.update({
      where: { id: billId },
      data: {
        ...(billDate && { billDate: new Date(billDate), dueDate }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(terms !== undefined && { terms: terms || null }),
        ...(totals && {
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          total: totals.total,
          balanceAmount: totals.total - existingBill.paidAmount
        }),
        ...(itemsWithAmounts && {
          items: {
            create: itemsWithAmounts
          }
        })
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

    logger.info(`Bill updated: ${billId} by ${userId}`);

    return bill;
  });
};

/**
 * Delete bill
 * @param {string} billId - Bill ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deleteBill = async (billId, companyId, userId) => {
  const bill = await prisma.bill.findFirst({
    where: { id: billId, companyId },
    include: {
      payments: true
    }
  });

  if (!bill) {
    throw ApiError.notFound('Bill not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Cannot delete if has payments
  if (bill.payments.length > 0) {
    throw ApiError.badRequest('Cannot delete bill with payments', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Cannot delete if approved
  if (bill.status === DOCUMENT_STATUS.APPROVED) {
    throw ApiError.badRequest('Cannot delete approved bill', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  // Soft delete by setting status to CANCELLED
  await prisma.bill.update({
    where: { id: billId },
    data: { status: DOCUMENT_STATUS.CANCELLED }
  });

  logger.info(`Bill deleted: ${billId} by ${userId}`);
};

/**
 * Approve bill and create journal entry
 * @param {string} billId - Bill ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing approval
 * @returns {Promise<Object>} Approved bill
 */
export const approveBill = async (billId, companyId, userId) => {
  const bill = await prisma.bill.findFirst({
    where: { id: billId, companyId }
  });

  if (!bill) {
    throw ApiError.notFound('Bill not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  if (bill.status !== DOCUMENT_STATUS.DRAFT) {
    throw ApiError.badRequest('Only draft bills can be approved', ERROR_CODES.INVALID_STATUS_TRANSITION);
  }

  return await prisma.$transaction(async (tx) => {
    // Update bill status
    const approvedBill = await tx.bill.update({
      where: { id: billId },
      data: {
        status: DOCUMENT_STATUS.APPROVED
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

    // Create journal entry
    await createJournalEntry(approvedBill, tx, userId);

    // Update vendor balance
    await tx.vendor.update({
      where: { id: bill.vendorId },
      data: {
        currentBalance: {
          increment: bill.total
        }
      }
    });

    logger.info(`Bill approved: ${billId} by ${userId}`);

    return approvedBill;
  });
};

/**
 * Record payment for bill
 * @param {string} billId - Bill ID
 * @param {string} companyId - Company ID
 * @param {Object} paymentData - Payment data
 * @param {string} userId - ID of user recording payment
 * @returns {Promise<Object>} Updated bill
 */
export const recordPayment = async (billId, companyId, paymentData, userId) => {
  const { amount, paymentMethod, paymentDate, referenceNo, bankName, chequeNo, chequeDate, upiId, notes } = paymentData;

  const bill = await prisma.bill.findFirst({
    where: { id: billId, companyId },
    include: {
      vendor: true
    }
  });

  if (!bill) {
    throw ApiError.notFound('Bill not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Verify payment amount
  if (amount <= 0) {
    throw ApiError.badRequest('Payment amount must be positive', ERROR_CODES.VALIDATION_ERROR);
  }

  if (amount > bill.balanceAmount) {
    throw ApiError.badRequest('Payment amount exceeds balance', ERROR_CODES.VALIDATION_ERROR);
  }

  return await prisma.$transaction(async (tx) => {
    // Generate payment number
    const lastPayment = await tx.payment.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    const paymentNumber = lastPayment
      ? `PAY-${String(parseInt(lastPayment.paymentNumber.split('-')[1]) + 1).padStart(4, '0')}`
      : 'PAY-0001';

    // Create payment
    await tx.payment.create({
      data: {
        companyId,
        vendorId: bill.vendorId,
        billId,
        paymentNumber,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod,
        amount,
        referenceNo: referenceNo || null,
        bankName: bankName || null,
        chequeNo: chequeNo || null,
        chequeDate: chequeDate ? new Date(chequeDate) : null,
        upiId: upiId || null,
        notes: notes || null,
        status: PAYMENT_STATUS.PAID,
        createdBy: userId
      }
    });

    // Update bill
    const newPaidAmount = parseFloat(bill.paidAmount) + parseFloat(amount);
    const newBalanceAmount = parseFloat(bill.total) - newPaidAmount;
    const newPaymentStatus = determinePaymentStatus(bill.total, newPaidAmount, bill.dueDate);

    const updatedBill = await tx.bill.update({
      where: { id: billId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paymentStatus: newPaymentStatus
      },
      include: {
        vendor: true,
        items: {
          include: {
            product: true
          }
        },
        payments: true
      }
    });

    // Update vendor balance
    await tx.vendor.update({
      where: { id: bill.vendorId },
      data: {
        currentBalance: {
          decrement: amount
        }
      }
    });

    logger.info(`Payment recorded for bill ${billId}: ${amount} by ${userId}`);

    return updatedBill;
  });
};

/**
 * Get pending (unpaid) bills
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Pending bills
 */
export const getPendingBills = async (companyId, filters = {}) => {
  const { vendorId } = filters;

  const where = {
    companyId,
    status: DOCUMENT_STATUS.APPROVED,
    paymentStatus: {
      in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PARTIAL, PAYMENT_STATUS.OVERDUE]
    }
  };

  if (vendorId) {
    where.vendorId = vendorId;
  }

  const bills = await prisma.bill.findMany({
    where,
    include: {
      vendor: {
        select: {
          id: true,
          vendorNumber: true,
          name: true
        }
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  });

  return bills;
};

/**
 * Get bills by vendor
 * @param {string} vendorId - Vendor ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} Vendor bills
 */
export const getBillsByVendor = async (vendorId, companyId) => {
  const bills = await prisma.bill.findMany({
    where: {
      vendorId,
      companyId
    },
    include: {
      items: {
        select: {
          id: true
        }
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paymentDate: true
        }
      }
    },
    orderBy: {
      billDate: 'desc'
    }
  });

  return bills.map(bill => ({
    ...bill,
    itemCount: bill.items.length,
    paymentCount: bill.payments.length,
    items: undefined
  }));
};

export default {
  createBill,
  getBillById,
  getBills,
  updateBill,
  deleteBill,
  approveBill,
  recordPayment,
  getPendingBills,
  getBillsByVendor
};
