/**
 * Journal Entry Service
 * Business logic for journal entry creation and posting
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, TRANSACTION_TYPES, ACCOUNT_TYPES, PAGINATION } from '../config/constants.js';
import logger from '../config/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Generate next journal entry number
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Next entry number
 */
const generateEntryNumber = async (companyId) => {
  const lastEntry = await prisma.journalEntry.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' }
  });

  if (!lastEntry) {
    return 'JE-0001';
  }

  const lastNumber = parseInt(lastEntry.entryNumber.split('-')[1]);
  return `JE-${String(lastNumber + 1).padStart(4, '0')}`;
};

/**
 * Validate journal entry lines balance
 * @param {Array} lines - Journal entry lines
 * @returns {Object} Validation result
 */
const validateEntryBalance = (lines) => {
  let totalDebits = new Decimal(0);
  let totalCredits = new Decimal(0);

  lines.forEach(line => {
    if (line.transactionType === TRANSACTION_TYPES.DEBIT) {
      totalDebits = totalDebits.plus(line.amount);
    } else if (line.transactionType === TRANSACTION_TYPES.CREDIT) {
      totalCredits = totalCredits.plus(line.amount);
    }
  });

  const isBalanced = totalDebits.equals(totalCredits);

  return {
    isBalanced,
    totalDebits,
    totalCredits,
    difference: totalDebits.minus(totalCredits)
  };
};

/**
 * Update account balances after posting
 * @param {Array} lines - Journal entry lines
 * @returns {Promise<void>}
 */
const updateAccountBalances = async (lines) => {
  const accountUpdates = new Map();

  // Collect all account updates
  for (const line of lines) {
    const account = await prisma.account.findUnique({
      where: { id: line.accountId },
      select: {
        id: true,
        accountType: true,
        currentBalance: true,
        openingBalance: true
      }
    });

    if (!account) continue;

    let balanceChange = new Decimal(0);
    const isDebitIncreaseType = [ACCOUNT_TYPES.ASSET, ACCOUNT_TYPES.EXPENSE].includes(account.accountType);

    if (line.transactionType === TRANSACTION_TYPES.DEBIT) {
      balanceChange = isDebitIncreaseType ? line.amount : new Decimal(line.amount).negated();
    } else {
      balanceChange = isDebitIncreaseType ? new Decimal(line.amount).negated() : line.amount;
    }

    if (!accountUpdates.has(account.id)) {
      accountUpdates.set(account.id, {
        currentBalance: new Decimal(account.currentBalance),
        change: new Decimal(0)
      });
    }

    const update = accountUpdates.get(account.id);
    update.change = update.change.plus(balanceChange);
  }

  // Apply updates
  for (const [accountId, update] of accountUpdates.entries()) {
    await prisma.account.update({
      where: { id: accountId },
      data: {
        currentBalance: update.currentBalance.plus(update.change)
      }
    });
  }
};

/**
 * Reverse account balances (for deletion/reversal)
 * @param {Array} lines - Journal entry lines
 * @returns {Promise<void>}
 */
const reverseAccountBalances = async (lines) => {
  const accountUpdates = new Map();

  for (const line of lines) {
    const account = await prisma.account.findUnique({
      where: { id: line.accountId },
      select: {
        id: true,
        accountType: true,
        currentBalance: true
      }
    });

    if (!account) continue;

    let balanceChange = new Decimal(0);
    const isDebitIncreaseType = [ACCOUNT_TYPES.ASSET, ACCOUNT_TYPES.EXPENSE].includes(account.accountType);

    // Reverse the effect
    if (line.transactionType === TRANSACTION_TYPES.DEBIT) {
      balanceChange = isDebitIncreaseType ? new Decimal(line.amount).negated() : line.amount;
    } else {
      balanceChange = isDebitIncreaseType ? line.amount : new Decimal(line.amount).negated();
    }

    if (!accountUpdates.has(account.id)) {
      accountUpdates.set(account.id, {
        currentBalance: new Decimal(account.currentBalance),
        change: new Decimal(0)
      });
    }

    const update = accountUpdates.get(account.id);
    update.change = update.change.plus(balanceChange);
  }

  // Apply updates
  for (const [accountId, update] of accountUpdates.entries()) {
    await prisma.account.update({
      where: { id: accountId },
      data: {
        currentBalance: update.currentBalance.plus(update.change)
      }
    });
  }
};

/**
 * Create journal entry
 * @param {Object} entryData - Entry data
 * @param {string} userId - User ID creating the entry
 * @returns {Promise<Object>} Created journal entry
 */
export const createJournalEntry = async (entryData, userId) => {
  const { companyId, entryDate, description, lines, entryType, referenceType, referenceId, referenceNumber } = entryData;

  try {
    // Validate minimum lines
    if (!lines || lines.length < 2) {
      throw new ApiError(400, 'Journal entry must have at least 2 lines', ERROR_CODES.VALIDATION_ERROR);
    }

    // Validate all accounts exist
    for (const line of lines) {
      const account = await prisma.account.findFirst({
        where: {
          id: line.accountId,
          companyId
        }
      });

      if (!account) {
        throw new ApiError(404, `Account not found: ${line.accountId}`, ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      if (!account.isActive) {
        throw new ApiError(400, `Account is inactive: ${account.accountName}`, ERROR_CODES.VALIDATION_ERROR);
      }
    }

    // Validate entry balance
    const validation = validateEntryBalance(lines);
    if (!validation.isBalanced) {
      throw new ApiError(
        400,
        `Journal entry is not balanced. Debits: ${validation.totalDebits}, Credits: ${validation.totalCredits}`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Generate entry number
    const entryNumber = await generateEntryNumber(companyId);

    // Create entry with lines in transaction
    const entry = await prisma.$transaction(async (tx) => {
      const journalEntry = await tx.journalEntry.create({
        data: {
          companyId,
          entryNumber,
          entryDate: new Date(entryDate),
          entryType: entryType || 'MANUAL',
          referenceType: referenceType || null,
          referenceId: referenceId || null,
          referenceNumber: referenceNumber || null,
          description: description || null,
          totalDebit: validation.totalDebits,
          totalCredit: validation.totalCredits,
          isPosted: false,
          createdBy: userId
        }
      });

      // Create journal lines
      const createdLines = await Promise.all(
        lines.map(line =>
          tx.journalLine.create({
            data: {
              entryId: journalEntry.id,
              accountId: line.accountId,
              description: line.description || null,
              transactionType: line.transactionType,
              amount: new Decimal(line.amount)
            }
          })
        )
      );

      return { ...journalEntry, lines: createdLines };
    });

    logger.info(`Journal entry created: ${entry.entryNumber}`);
    return entry;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error creating journal entry:', error);
    throw new ApiError(500, 'Failed to create journal entry', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get journal entries with pagination and filters
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Paginated journal entries
 */
export const getJournalEntries = async (companyId, filters = {}) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    isPosted,
    entryType,
    startDate,
    endDate,
    search
  } = filters;

  try {
    const where = { companyId };

    if (typeof isPosted !== 'undefined') {
      where.isPosted = isPosted === 'true' || isPosted === true;
    }

    if (entryType) {
      where.entryType = entryType;
    }

    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { entryNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: {
              account: {
                select: {
                  accountNumber: true,
                  accountName: true,
                  accountType: true
                }
              }
            }
          }
        },
        orderBy: { entryDate: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.journalEntry.count({ where })
    ]);

    return {
      entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };

  } catch (error) {
    logger.error('Error fetching journal entries:', error);
    throw new ApiError(500, 'Failed to fetch journal entries', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get journal entry by ID
 * @param {string} entryId - Entry ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Journal entry
 */
export const getJournalEntryById = async (entryId, companyId) => {
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id: entryId,
        companyId
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                accountNumber: true,
                accountName: true,
                accountType: true
              }
            }
          }
        }
      }
    });

    if (!entry) {
      throw new ApiError(404, 'Journal entry not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return entry;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching journal entry:', error);
    throw new ApiError(500, 'Failed to fetch journal entry', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Update journal entry (only if not posted)
 * @param {string} entryId - Entry ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated journal entry
 */
export const updateJournalEntry = async (entryId, companyId, updateData) => {
  const { entryDate, description, lines } = updateData;

  try {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id: entryId,
        companyId
      },
      include: {
        lines: true
      }
    });

    if (!entry) {
      throw new ApiError(404, 'Journal entry not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (entry.isPosted) {
      throw new ApiError(400, 'Cannot update posted journal entry', ERROR_CODES.VALIDATION_ERROR);
    }

    // If lines are being updated, validate them
    if (lines) {
      if (lines.length < 2) {
        throw new ApiError(400, 'Journal entry must have at least 2 lines', ERROR_CODES.VALIDATION_ERROR);
      }

      // Validate accounts
      for (const line of lines) {
        const account = await prisma.account.findFirst({
          where: {
            id: line.accountId,
            companyId
          }
        });

        if (!account) {
          throw new ApiError(404, `Account not found: ${line.accountId}`, ERROR_CODES.RESOURCE_NOT_FOUND);
        }
      }

      // Validate balance
      const validation = validateEntryBalance(lines);
      if (!validation.isBalanced) {
        throw new ApiError(
          400,
          `Journal entry is not balanced. Debits: ${validation.totalDebits}, Credits: ${validation.totalCredits}`,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      // Update in transaction
      const updated = await prisma.$transaction(async (tx) => {
        // Delete old lines
        await tx.journalLine.deleteMany({
          where: { entryId }
        });

        // Update entry
        const updatedEntry = await tx.journalEntry.update({
          where: { id: entryId },
          data: {
            ...(entryDate && { entryDate: new Date(entryDate) }),
            ...(description !== undefined && { description }),
            totalDebit: validation.totalDebits,
            totalCredit: validation.totalCredits
          }
        });

        // Create new lines
        const createdLines = await Promise.all(
          lines.map(line =>
            tx.journalLine.create({
              data: {
                entryId,
                accountId: line.accountId,
                description: line.description || null,
                transactionType: line.transactionType,
                amount: new Decimal(line.amount)
              }
            })
          )
        );

        return { ...updatedEntry, lines: createdLines };
      });

      return updated;
    } else {
      // Update only entry fields
      const updated = await prisma.journalEntry.update({
        where: { id: entryId },
        data: {
          ...(entryDate && { entryDate: new Date(entryDate) }),
          ...(description !== undefined && { description })
        },
        include: {
          lines: {
            include: {
              account: {
                select: {
                  accountNumber: true,
                  accountName: true
                }
              }
            }
          }
        }
      });

      return updated;
    }

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating journal entry:', error);
    throw new ApiError(500, 'Failed to update journal entry', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Delete journal entry (only if not posted)
 * @param {string} entryId - Entry ID
 * @param {string} companyId - Company ID
 * @returns {Promise<void>}
 */
export const deleteJournalEntry = async (entryId, companyId) => {
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id: entryId,
        companyId
      }
    });

    if (!entry) {
      throw new ApiError(404, 'Journal entry not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (entry.isPosted) {
      throw new ApiError(400, 'Cannot delete posted journal entry. Create a reversing entry instead.', ERROR_CODES.VALIDATION_ERROR);
    }

    await prisma.journalEntry.delete({
      where: { id: entryId }
    });

    logger.info(`Journal entry deleted: ${entry.entryNumber}`);

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting journal entry:', error);
    throw new ApiError(500, 'Failed to delete journal entry', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Post journal entry (finalize and update balances)
 * @param {string} entryId - Entry ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Posted journal entry
 */
export const postJournalEntry = async (entryId, companyId) => {
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id: entryId,
        companyId
      },
      include: {
        lines: true
      }
    });

    if (!entry) {
      throw new ApiError(404, 'Journal entry not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (entry.isPosted) {
      throw new ApiError(400, 'Journal entry is already posted', ERROR_CODES.VALIDATION_ERROR);
    }

    // Validate balance one more time
    const validation = validateEntryBalance(entry.lines);
    if (!validation.isBalanced) {
      throw new ApiError(400, 'Journal entry is not balanced', ERROR_CODES.VALIDATION_ERROR);
    }

    // Post entry and update balances in transaction
    const posted = await prisma.$transaction(async (tx) => {
      // Update entry status
      const updatedEntry = await tx.journalEntry.update({
        where: { id: entryId },
        data: {
          isPosted: true,
          postedAt: new Date()
        }
      });

      // Update account balances
      await updateAccountBalances(entry.lines);

      return updatedEntry;
    });

    logger.info(`Journal entry posted: ${posted.entryNumber}`);
    return posted;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error posting journal entry:', error);
    throw new ApiError(500, 'Failed to post journal entry', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get pending (unposted) journal entries
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} Pending entries
 */
export const getPendingEntries = async (companyId) => {
  try {
    const entries = await prisma.journalEntry.findMany({
      where: {
        companyId,
        isPosted: false
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                accountNumber: true,
                accountName: true
              }
            }
          }
        }
      },
      orderBy: { entryDate: 'desc' }
    });

    return entries;

  } catch (error) {
    logger.error('Error fetching pending entries:', error);
    throw new ApiError(500, 'Failed to fetch pending entries', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get journal entries for a specific account
 * @param {string} accountId - Account ID
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Journal entries
 */
export const getEntriesByAccount = async (accountId, companyId, filters = {}) => {
  const { startDate, endDate, isPosted } = filters;

  try {
    // Verify account exists
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        companyId
      }
    });

    if (!account) {
      throw new ApiError(404, 'Account not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const where = {
      companyId,
      lines: {
        some: {
          accountId
        }
      }
    };

    if (typeof isPosted !== 'undefined') {
      where.isPosted = isPosted === 'true' || isPosted === true;
    }

    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: {
              select: {
                accountNumber: true,
                accountName: true
              }
            }
          }
        }
      },
      orderBy: { entryDate: 'desc' }
    });

    return entries;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching entries by account:', error);
    throw new ApiError(500, 'Failed to fetch entries by account', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};
