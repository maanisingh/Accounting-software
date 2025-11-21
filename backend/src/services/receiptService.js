/**
 * Receipt Service
 * Business logic for customer receipt processing
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, PAYMENT_STATUS, TRANSACTION_TYPES, PAYMENT_METHODS } from '../config/constants.js';
import logger from '../config/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Generate next receipt number
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Next receipt number
 */
const generateReceiptNumber = async (companyId) => {
  const lastReceipt = await prisma.receipt.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastReceipt) {
    return 'REC-0001';
  }

  const lastNumber = parseInt(lastReceipt.receiptNumber.split('-')[1]);
  return `REC-${String(lastNumber + 1).padStart(4, '0')}`;
};

/**
 * Create journal entry for receipt
 * @param {Object} receipt - Receipt data
 * @param {Object} customer - Customer data
 * @param {string} accountId - Receipt account ID (bank/cash)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created journal entry
 */
const createReceiptJournalEntry = async (receipt, customer, accountId, userId) => {
  // Get or create Accounts Receivable account
  let arAccount = await prisma.account.findFirst({
    where: {
      companyId: receipt.companyId,
      accountType: 'ASSET',
      accountName: { contains: 'Accounts Receivable', mode: 'insensitive' }
    }
  });

  if (!arAccount) {
    // Create default Accounts Receivable account
    arAccount = await prisma.account.create({
      data: {
        companyId: receipt.companyId,
        accountNumber: '1200',
        accountName: 'Accounts Receivable',
        accountType: 'ASSET',
        openingBalance: 0,
        currentBalance: 0,
        isActive: true,
        createdBy: userId
      }
    });
  }

  // Get receipt account (bank/cash)
  const receiptAccount = await prisma.account.findUnique({
    where: { id: accountId }
  });

  if (!receiptAccount) {
    throw new ApiError(404, 'Receipt account not found', ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  // Generate entry number
  const lastEntry = await prisma.journalEntry.findFirst({
    where: { companyId: receipt.companyId },
    orderBy: { createdAt: 'desc' }
  });

  const entryNumber = lastEntry
    ? `JE-${String(parseInt(lastEntry.entryNumber.split('-')[1]) + 1).padStart(4, '0')}`
    : 'JE-0001';

  // Create journal entry
  const journalEntry = await prisma.journalEntry.create({
    data: {
      companyId: receipt.companyId,
      entryNumber,
      entryDate: receipt.receiptDate,
      entryType: 'RECEIPT',
      referenceType: 'RECEIPT',
      referenceId: receipt.id,
      referenceNumber: receipt.receiptNumber,
      description: `Receipt from ${customer.name} - ${receipt.receiptNumber}`,
      totalDebit: receipt.amount,
      totalCredit: receipt.amount,
      isPosted: true,
      postedAt: new Date(),
      createdBy: userId,
      lines: {
        create: [
          {
            accountId: receiptAccount.id,
            description: `Receipt via ${receipt.paymentMethod}`,
            transactionType: TRANSACTION_TYPES.DEBIT,
            amount: receipt.amount
          },
          {
            accountId: arAccount.id,
            description: `Receipt from ${customer.name}`,
            transactionType: TRANSACTION_TYPES.CREDIT,
            amount: receipt.amount
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
    where: { id: receiptAccount.id },
    data: {
      currentBalance: {
        increment: receipt.amount // Increase cash/bank
      }
    }
  });

  await prisma.account.update({
    where: { id: arAccount.id },
    data: {
      currentBalance: {
        decrement: receipt.amount // Decrease receivable
      }
    }
  });

  return journalEntry;
};

/**
 * Record receipt from customer
 * @param {Object} receiptData - Receipt data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created receipt
 */
export const createReceipt = async (receiptData, userId) => {
  const { companyId, customerId, invoiceId, receiptDate, paymentMethod, amount, accountId, referenceNo, bankName, chequeNo, chequeDate, upiId, notes, invoices } = receiptData;

  try {
    // Verify customer exists
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId
      }
    });

    if (!customer) {
      throw new ApiError(404, 'Customer not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // If invoiceId is provided, verify invoice
    let invoice = null;
    if (invoiceId) {
      invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          companyId,
          customerId
        }
      });

      if (!invoice) {
        throw new ApiError(404, 'Invoice not found', ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      // Check remaining amount
      const remaining = new Decimal(invoice.total).minus(invoice.paidAmount);
      if (new Decimal(amount).gt(remaining)) {
        throw new ApiError(400, `Receipt amount exceeds invoice balance of ${remaining}`, ERROR_CODES.VALIDATION_ERROR);
      }
    }

    // If invoices array is provided, validate each
    if (invoices && invoices.length > 0) {
      let totalAllocated = new Decimal(0);

      for (const invoiceAllocation of invoices) {
        const inv = await prisma.invoice.findFirst({
          where: {
            id: invoiceAllocation.invoiceId,
            companyId,
            customerId
          }
        });

        if (!inv) {
          throw new ApiError(404, `Invoice not found: ${invoiceAllocation.invoiceId}`, ERROR_CODES.RESOURCE_NOT_FOUND);
        }

        const remaining = new Decimal(inv.total).minus(inv.paidAmount);
        if (new Decimal(invoiceAllocation.amount).gt(remaining)) {
          throw new ApiError(400, `Allocation for invoice ${inv.invoiceNumber} exceeds remaining balance`, ERROR_CODES.VALIDATION_ERROR);
        }

        totalAllocated = totalAllocated.plus(invoiceAllocation.amount);
      }

      if (!totalAllocated.equals(amount)) {
        throw new ApiError(400, 'Sum of invoice allocations must equal receipt amount', ERROR_CODES.VALIDATION_ERROR);
      }
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(companyId);

    // Create receipt and update invoices in transaction
    const receipt = await prisma.$transaction(async (tx) => {
      // Create receipt
      const newReceipt = await tx.receipt.create({
        data: {
          companyId,
          customerId,
          invoiceId: invoiceId || null,
          receiptNumber,
          receiptDate: new Date(receiptDate),
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

      // Update invoice if applicable
      if (invoiceId) {
        const newPaidAmount = new Decimal(invoice.paidAmount).plus(amount);
        const newBalance = new Decimal(invoice.total).minus(newPaidAmount);

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
            paymentStatus: newBalance.equals(0)
              ? PAYMENT_STATUS.PAID
              : newBalance.lt(invoice.total)
              ? PAYMENT_STATUS.PARTIAL
              : PAYMENT_STATUS.PENDING
          }
        });
      }

      // Update multiple invoices if provided
      if (invoices && invoices.length > 0) {
        for (const invoiceAllocation of invoices) {
          const inv = await tx.invoice.findUnique({
            where: { id: invoiceAllocation.invoiceId }
          });

          const newPaidAmount = new Decimal(inv.paidAmount).plus(invoiceAllocation.amount);
          const newBalance = new Decimal(inv.total).minus(newPaidAmount);

          await tx.invoice.update({
            where: { id: invoiceAllocation.invoiceId },
            data: {
              paidAmount: newPaidAmount,
              balanceAmount: newBalance,
              paymentStatus: newBalance.equals(0)
                ? PAYMENT_STATUS.PAID
                : newBalance.lt(inv.total)
                ? PAYMENT_STATUS.PARTIAL
                : PAYMENT_STATUS.PENDING
            }
          });
        }
      }

      // Update customer balance
      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentBalance: {
            decrement: amount
          }
        }
      });

      return newReceipt;
    });

    // Create journal entry
    await createReceiptJournalEntry(receipt, customer, accountId, userId);

    logger.info(`Receipt created: ${receipt.receiptNumber} from customer ${customer.name}`);

    // Fetch and return complete receipt
    const completeReceipt = await prisma.receipt.findUnique({
      where: { id: receipt.id },
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            name: true,
            currentBalance: true
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            paidAmount: true,
            balanceAmount: true
          }
        }
      }
    });

    return completeReceipt;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error creating receipt:', error);
    throw new ApiError(500, 'Failed to create receipt', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get all receipts with filters
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of receipts
 */
export const getReceipts = async (companyId, filters = {}) => {
  const { customerId, startDate, endDate, paymentMethod, search } = filters;

  try {
    const where = { companyId };

    if (customerId) {
      where.customerId = customerId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.receiptDate = {};
      if (startDate) where.receiptDate.gte = new Date(startDate);
      if (endDate) where.receiptDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { referenceNo: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            name: true
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true
          }
        }
      },
      orderBy: { receiptDate: 'desc' }
    });

    return receipts;

  } catch (error) {
    logger.error('Error fetching receipts:', error);
    throw new ApiError(500, 'Failed to fetch receipts', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get receipt by ID
 * @param {string} receiptId - Receipt ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Receipt details
 */
export const getReceiptById = async (receiptId, companyId) => {
  try {
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        companyId
      },
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            name: true,
            email: true,
            phone: true,
            currentBalance: true
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            total: true,
            paidAmount: true,
            balanceAmount: true,
            paymentStatus: true
          }
        }
      }
    });

    if (!receipt) {
      throw new ApiError(404, 'Receipt not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return receipt;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching receipt:', error);
    throw new ApiError(500, 'Failed to fetch receipt', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Delete receipt (reverse journal entry)
 * @param {string} receiptId - Receipt ID
 * @param {string} companyId - Company ID
 * @returns {Promise<void>}
 */
export const deleteReceipt = async (receiptId, companyId) => {
  try {
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        companyId
      },
      include: {
        invoice: true,
        customer: true
      }
    });

    if (!receipt) {
      throw new ApiError(404, 'Receipt not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Delete receipt and reverse effects in transaction
    await prisma.$transaction(async (tx) => {
      // Update invoice if associated
      if (receipt.invoiceId) {
        const invoice = receipt.invoice;
        const newPaidAmount = new Decimal(invoice.paidAmount).minus(receipt.amount);
        const newBalance = new Decimal(invoice.total).minus(newPaidAmount);

        await tx.invoice.update({
          where: { id: receipt.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
            paymentStatus: newPaidAmount.equals(0)
              ? PAYMENT_STATUS.PENDING
              : newPaidAmount.lt(invoice.total)
              ? PAYMENT_STATUS.PARTIAL
              : PAYMENT_STATUS.PAID
          }
        });
      }

      // Update customer balance
      await tx.customer.update({
        where: { id: receipt.customerId },
        data: {
          currentBalance: {
            increment: receipt.amount
          }
        }
      });

      // Find and delete associated journal entry
      const journalEntry = await tx.journalEntry.findFirst({
        where: {
          companyId,
          referenceType: 'RECEIPT',
          referenceId: receiptId
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

      // Delete receipt
      await tx.receipt.delete({
        where: { id: receiptId }
      });
    });

    logger.info(`Receipt deleted and reversed: ${receipt.receiptNumber}`);

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting receipt:', error);
    throw new ApiError(500, 'Failed to delete receipt', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get receipts by customer
 * @param {string} customerId - Customer ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} Customer receipts
 */
export const getReceiptsByCustomer = async (customerId, companyId) => {
  try {
    // Verify customer exists
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId
      }
    });

    if (!customer) {
      throw new ApiError(404, 'Customer not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const receipts = await prisma.receipt.findMany({
      where: {
        customerId,
        companyId
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true
          }
        }
      },
      orderBy: { receiptDate: 'desc' }
    });

    return receipts;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching customer receipts:', error);
    throw new ApiError(500, 'Failed to fetch customer receipts', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get invoices pending payment
 * @param {string} companyId - Company ID
 * @param {string} customerId - Optional customer ID filter
 * @returns {Promise<Array>} Pending invoices
 */
export const getPendingInvoices = async (companyId, customerId = null) => {
  try {
    const where = {
      companyId,
      status: {
        in: ['SENT', 'APPROVED', 'COMPLETED']
      },
      paymentStatus: {
        in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PARTIAL]
      }
    };

    if (customerId) {
      where.customerId = customerId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            name: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    return invoices;

  } catch (error) {
    logger.error('Error fetching pending invoices:', error);
    throw new ApiError(500, 'Failed to fetch pending invoices', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};
