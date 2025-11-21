/**
 * Payment Service
 * Business logic for vendor payment processing
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, PAYMENT_STATUS, TRANSACTION_TYPES, PAYMENT_METHODS } from '../config/constants.js';
import logger from '../config/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Generate next payment number
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Next payment number
 */
const generatePaymentNumber = async (companyId) => {
  const lastPayment = await prisma.payment.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastPayment) {
    return 'PAY-0001';
  }

  const lastNumber = parseInt(lastPayment.paymentNumber.split('-')[1]);
  return `PAY-${String(lastNumber + 1).padStart(4, '0')}`;
};

/**
 * Create journal entry for payment
 * @param {Object} payment - Payment data
 * @param {Object} vendor - Vendor data
 * @param {string} accountId - Payment account ID (bank/cash)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created journal entry
 */
const createPaymentJournalEntry = async (payment, vendor, accountId, userId) => {
  // Get or create Accounts Payable account for vendor
  let apAccount = await prisma.account.findFirst({
    where: {
      companyId: payment.companyId,
      accountType: 'LIABILITY',
      accountName: { contains: 'Accounts Payable', mode: 'insensitive' }
    }
  });

  if (!apAccount) {
    // Create default Accounts Payable account
    apAccount = await prisma.account.create({
      data: {
        companyId: payment.companyId,
        accountNumber: '2000',
        accountName: 'Accounts Payable',
        accountType: 'LIABILITY',
        openingBalance: 0,
        currentBalance: 0,
        isActive: true,
        createdBy: userId
      }
    });
  }

  // Get payment account (bank/cash)
  const paymentAccount = await prisma.account.findUnique({
    where: { id: accountId }
  });

  if (!paymentAccount) {
    throw new ApiError(404, 'Payment account not found', ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  // Generate entry number
  const lastEntry = await prisma.journalEntry.findFirst({
    where: { companyId: payment.companyId },
    orderBy: { createdAt: 'desc' }
  });

  const entryNumber = lastEntry
    ? `JE-${String(parseInt(lastEntry.entryNumber.split('-')[1]) + 1).padStart(4, '0')}`
    : 'JE-0001';

  // Create journal entry
  const journalEntry = await prisma.journalEntry.create({
    data: {
      companyId: payment.companyId,
      entryNumber,
      entryDate: payment.paymentDate,
      entryType: 'PAYMENT',
      referenceType: 'PAYMENT',
      referenceId: payment.id,
      referenceNumber: payment.paymentNumber,
      description: `Payment to ${vendor.name} - ${payment.paymentNumber}`,
      totalDebit: payment.amount,
      totalCredit: payment.amount,
      isPosted: true,
      postedAt: new Date(),
      createdBy: userId,
      lines: {
        create: [
          {
            accountId: apAccount.id,
            description: `Payment to ${vendor.name}`,
            transactionType: TRANSACTION_TYPES.DEBIT,
            amount: payment.amount
          },
          {
            accountId: paymentAccount.id,
            description: `Payment via ${payment.paymentMethod}`,
            transactionType: TRANSACTION_TYPES.CREDIT,
            amount: payment.amount
          }
        ]
      }
    },
    include: {
      lines: true
    }
  });

  // Update account balances
  await prisma.account.update({
    where: { id: apAccount.id },
    data: {
      currentBalance: {
        decrement: payment.amount // Decrease liability
      }
    }
  });

  await prisma.account.update({
    where: { id: paymentAccount.id },
    data: {
      currentBalance: {
        decrement: payment.amount // Decrease cash/bank
      }
    }
  });

  return journalEntry;
};

/**
 * Record payment to vendor
 * @param {Object} paymentData - Payment data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created payment
 */
export const createPayment = async (paymentData, userId) => {
  const { companyId, vendorId, billId, paymentDate, paymentMethod, amount, accountId, referenceNo, bankName, chequeNo, chequeDate, upiId, notes, bills } = paymentData;

  try {
    // Verify vendor exists
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        companyId
      }
    });

    if (!vendor) {
      throw new ApiError(404, 'Vendor not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // If billId is provided, verify bill
    let bill = null;
    if (billId) {
      bill = await prisma.bill.findFirst({
        where: {
          id: billId,
          companyId,
          vendorId
        }
      });

      if (!bill) {
        throw new ApiError(404, 'Bill not found', ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      // Check remaining amount
      const remaining = new Decimal(bill.total).minus(bill.paidAmount);
      if (new Decimal(amount).gt(remaining)) {
        throw new ApiError(400, `Payment amount exceeds bill balance of ${remaining}`, ERROR_CODES.VALIDATION_ERROR);
      }
    }

    // If bills array is provided, validate each
    if (bills && bills.length > 0) {
      let totalAllocated = new Decimal(0);

      for (const billAllocation of bills) {
        const b = await prisma.bill.findFirst({
          where: {
            id: billAllocation.billId,
            companyId,
            vendorId
          }
        });

        if (!b) {
          throw new ApiError(404, `Bill not found: ${billAllocation.billId}`, ERROR_CODES.RESOURCE_NOT_FOUND);
        }

        const remaining = new Decimal(b.total).minus(b.paidAmount);
        if (new Decimal(billAllocation.amount).gt(remaining)) {
          throw new ApiError(400, `Allocation for bill ${b.billNumber} exceeds remaining balance`, ERROR_CODES.VALIDATION_ERROR);
        }

        totalAllocated = totalAllocated.plus(billAllocation.amount);
      }

      if (!totalAllocated.equals(amount)) {
        throw new ApiError(400, 'Sum of bill allocations must equal payment amount', ERROR_CODES.VALIDATION_ERROR);
      }
    }

    // Generate payment number
    const paymentNumber = await generatePaymentNumber(companyId);

    // Create payment and update bills in transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment
      const newPayment = await tx.payment.create({
        data: {
          companyId,
          vendorId,
          billId: billId || null,
          paymentNumber,
          paymentDate: new Date(paymentDate),
          paymentMethod,
          amount: new Decimal(amount),
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

      // Update bill(s) if applicable
      if (billId) {
        const newPaidAmount = new Decimal(bill.paidAmount).plus(amount);
        const newBalance = new Decimal(bill.total).minus(newPaidAmount);

        await tx.bill.update({
          where: { id: billId },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
            paymentStatus: newBalance.equals(0)
              ? PAYMENT_STATUS.PAID
              : newBalance.lt(bill.total)
              ? PAYMENT_STATUS.PARTIAL
              : PAYMENT_STATUS.PENDING
          }
        });
      }

      // Update multiple bills if provided
      if (bills && bills.length > 0) {
        for (const billAllocation of bills) {
          const b = await tx.bill.findUnique({
            where: { id: billAllocation.billId }
          });

          const newPaidAmount = new Decimal(b.paidAmount).plus(billAllocation.amount);
          const newBalance = new Decimal(b.total).minus(newPaidAmount);

          await tx.bill.update({
            where: { id: billAllocation.billId },
            data: {
              paidAmount: newPaidAmount,
              balanceAmount: newBalance,
              paymentStatus: newBalance.equals(0)
                ? PAYMENT_STATUS.PAID
                : newBalance.lt(b.total)
                ? PAYMENT_STATUS.PARTIAL
                : PAYMENT_STATUS.PENDING
            }
          });
        }
      }

      // Update vendor balance
      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          currentBalance: {
            decrement: amount
          }
        }
      });

      return newPayment;
    });

    // Create journal entry
    await createPaymentJournalEntry(payment, vendor, accountId, userId);

    logger.info(`Payment created: ${payment.paymentNumber} for vendor ${vendor.name}`);

    // Fetch and return complete payment
    const completePayment = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: {
        vendor: {
          select: {
            id: true,
            vendorNumber: true,
            name: true,
            currentBalance: true
          }
        },
        bill: {
          select: {
            id: true,
            billNumber: true,
            total: true,
            paidAmount: true,
            balanceAmount: true
          }
        }
      }
    });

    return completePayment;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error creating payment:', error);
    throw new ApiError(500, 'Failed to create payment', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get all payments with filters
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of payments
 */
export const getPayments = async (companyId, filters = {}) => {
  const { vendorId, startDate, endDate, paymentMethod, search } = filters;

  try {
    const where = { companyId };

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { referenceNo: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            vendorNumber: true,
            name: true
          }
        },
        bill: {
          select: {
            id: true,
            billNumber: true,
            total: true
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    return payments;

  } catch (error) {
    logger.error('Error fetching payments:', error);
    throw new ApiError(500, 'Failed to fetch payments', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get payment by ID
 * @param {string} paymentId - Payment ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Payment details
 */
export const getPaymentById = async (paymentId, companyId) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        companyId
      },
      include: {
        vendor: {
          select: {
            id: true,
            vendorNumber: true,
            name: true,
            email: true,
            phone: true,
            currentBalance: true
          }
        },
        bill: {
          select: {
            id: true,
            billNumber: true,
            billDate: true,
            total: true,
            paidAmount: true,
            balanceAmount: true,
            paymentStatus: true
          }
        }
      }
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return payment;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching payment:', error);
    throw new ApiError(500, 'Failed to fetch payment', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Delete payment (reverse journal entry)
 * @param {string} paymentId - Payment ID
 * @param {string} companyId - Company ID
 * @returns {Promise<void>}
 */
export const deletePayment = async (paymentId, companyId) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        companyId
      },
      include: {
        bill: true,
        vendor: true
      }
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Delete payment and reverse effects in transaction
    await prisma.$transaction(async (tx) => {
      // Update bill if associated
      if (payment.billId) {
        const bill = payment.bill;
        const newPaidAmount = new Decimal(bill.paidAmount).minus(payment.amount);
        const newBalance = new Decimal(bill.total).minus(newPaidAmount);

        await tx.bill.update({
          where: { id: payment.billId },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
            paymentStatus: newPaidAmount.equals(0)
              ? PAYMENT_STATUS.PENDING
              : newPaidAmount.lt(bill.total)
              ? PAYMENT_STATUS.PARTIAL
              : PAYMENT_STATUS.PAID
          }
        });
      }

      // Update vendor balance
      await tx.vendor.update({
        where: { id: payment.vendorId },
        data: {
          currentBalance: {
            increment: payment.amount
          }
        }
      });

      // Find and delete associated journal entry
      const journalEntry = await tx.journalEntry.findFirst({
        where: {
          companyId,
          referenceType: 'PAYMENT',
          referenceId: paymentId
        },
        include: {
          lines: true
        }
      });

      if (journalEntry) {
        // Reverse account balances
        for (const line of journalEntry.lines) {
          const account = await tx.account.findUnique({
            where: { id: line.accountId }
          });

          if (!account) continue;

          const isDebitIncreaseType = ['ASSET', 'EXPENSE'].includes(account.accountType);
          let balanceChange = new Decimal(0);

          // Reverse the journal entry effect
          if (line.transactionType === TRANSACTION_TYPES.DEBIT) {
            balanceChange = isDebitIncreaseType ? new Decimal(line.amount).negated() : line.amount;
          } else {
            balanceChange = isDebitIncreaseType ? line.amount : new Decimal(line.amount).negated();
          }

          await tx.account.update({
            where: { id: line.accountId },
            data: {
              currentBalance: {
                increment: balanceChange
              }
            }
          });
        }

        // Delete journal entry
        await tx.journalEntry.delete({
          where: { id: journalEntry.id }
        });
      }

      // Delete payment
      await tx.payment.delete({
        where: { id: paymentId }
      });
    });

    logger.info(`Payment deleted and reversed: ${payment.paymentNumber}`);

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting payment:', error);
    throw new ApiError(500, 'Failed to delete payment', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get payments by vendor
 * @param {string} vendorId - Vendor ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} Vendor payments
 */
export const getPaymentsByVendor = async (vendorId, companyId) => {
  try {
    // Verify vendor exists
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        companyId
      }
    });

    if (!vendor) {
      throw new ApiError(404, 'Vendor not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const payments = await prisma.payment.findMany({
      where: {
        vendorId,
        companyId
      },
      include: {
        bill: {
          select: {
            id: true,
            billNumber: true,
            total: true
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    return payments;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching vendor payments:', error);
    throw new ApiError(500, 'Failed to fetch vendor payments', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get bills pending payment
 * @param {string} companyId - Company ID
 * @param {string} vendorId - Optional vendor ID filter
 * @returns {Promise<Array>} Pending bills
 */
export const getPendingBills = async (companyId, vendorId = null) => {
  try {
    const where = {
      companyId,
      status: 'APPROVED',
      paymentStatus: {
        in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PARTIAL]
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
      orderBy: { dueDate: 'asc' }
    });

    return bills;

  } catch (error) {
    logger.error('Error fetching pending bills:', error);
    throw new ApiError(500, 'Failed to fetch pending bills', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};
