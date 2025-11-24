/**
 * Account Service
 * Business logic for chart of accounts management
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES, ACCOUNT_TYPES, TRANSACTION_TYPES } from '../config/constants.js';
import logger from '../config/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Generate next account number based on account type
 * @param {string} companyId - Company ID
 * @param {string} accountType - Account type
 * @returns {Promise<string>} Next account number
 */
const generateAccountNumber = async (companyId, accountType) => {
  // Default ranges by account type
  const typeRanges = {
    ASSET: { start: 1000, end: 1999 },
    LIABILITY: { start: 2000, end: 2999 },
    EQUITY: { start: 3000, end: 3999 },
    REVENUE: { start: 4000, end: 4999 },
    EXPENSE: { start: 5000, end: 5999 }
  };

  const range = typeRanges[accountType];
  if (!range) {
    throw new ApiError(400, 'Invalid account type', ERROR_CODES.VALIDATION_ERROR);
  }

  // Find last account number in range
  const lastAccount = await prisma.account.findFirst({
    where: {
      companyId,
      accountType,
      accountNumber: {
        gte: range.start.toString(),
        lte: range.end.toString()
      }
    },
    orderBy: { accountNumber: 'desc' }
  });

  if (!lastAccount) {
    return range.start.toString();
  }

  const lastNumber = parseInt(lastAccount.accountNumber);
  if (lastNumber >= range.end) {
    throw new ApiError(400, `Account number range exhausted for ${accountType}`, ERROR_CODES.VALIDATION_ERROR);
  }

  return (lastNumber + 1).toString();
};

/**
 * Check for circular reference in account hierarchy
 * @param {string} accountId - Account ID to check
 * @param {string} parentId - Proposed parent ID
 * @returns {Promise<boolean>} True if circular reference exists
 */
const hasCircularReference = async (accountId, parentId) => {
  if (!parentId) return false;
  if (accountId === parentId) return true;

  let currentId = parentId;
  const visited = new Set();

  while (currentId) {
    if (visited.has(currentId) || currentId === accountId) {
      return true;
    }

    visited.add(currentId);

    const parent = await prisma.account.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    });

    if (!parent) break;
    currentId = parent.parentId;
  }

  return false;
};

/**
 * Calculate account balance from journal entries
 * @param {string} accountId - Account ID
 * @param {string} accountType - Account type
 * @param {Decimal} openingBalance - Opening balance
 * @returns {Promise<Decimal>} Current balance
 */
const calculateAccountBalance = async (accountId, accountType, openingBalance) => {
  // Get all posted journal lines for this account
  const journalLines = await prisma.journalLine.findMany({
    where: {
      accountId,
      entry: {
        isPosted: true
      }
    },
    include: {
      entry: {
        select: {
          isPosted: true
        }
      }
    }
  });

  let totalDebits = new Decimal(0);
  let totalCredits = new Decimal(0);

  journalLines.forEach(line => {
    if (line.transactionType === TRANSACTION_TYPES.DEBIT) {
      totalDebits = totalDebits.plus(line.amount);
    } else {
      totalCredits = totalCredits.plus(line.amount);
    }
  });

  // Calculate balance based on account type
  let balance = new Decimal(openingBalance);

  if (accountType === ACCOUNT_TYPES.ASSET || accountType === ACCOUNT_TYPES.EXPENSE) {
    // Debit increases balance, credit decreases
    balance = balance.plus(totalDebits).minus(totalCredits);
  } else {
    // Credit increases balance, debit decreases (LIABILITY, EQUITY, REVENUE)
    balance = balance.plus(totalCredits).minus(totalDebits);
  }

  return balance;
};

/**
 * Create a new account
 * @param {Object} accountData - Account data
 * @param {string} userId - User ID creating the account
 * @returns {Promise<Object>} Created account
 */
export const createAccount = async (accountData, userId) => {
  const { companyId, accountName, accountType, parentId, description, currency, accountNumber, openingBalance, openingBalanceType } = accountData;

  try {
    // Validate account type
    if (!Object.values(ACCOUNT_TYPES).includes(accountType)) {
      throw new ApiError(400, 'Invalid account type', ERROR_CODES.VALIDATION_ERROR);
    }

    // Check if parent exists and validate hierarchy
    if (parentId) {
      const parent = await prisma.account.findUnique({
        where: { id: parentId }
      });

      if (!parent) {
        throw new ApiError(404, 'Parent account not found', ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      // Ensure parent belongs to same company
      if (parent.companyId !== companyId) {
        throw new ApiError(400, 'Parent account must belong to the same company', ERROR_CODES.VALIDATION_ERROR);
      }

      // Ensure parent has same account type
      if (parent.accountType !== accountType) {
        throw new ApiError(400, 'Child account must have the same type as parent', ERROR_CODES.VALIDATION_ERROR);
      }
    }

    // Generate account number if not provided
    let finalAccountNumber = accountNumber;
    if (!finalAccountNumber) {
      finalAccountNumber = await generateAccountNumber(companyId, accountType);
    } else {
      // Validate uniqueness if provided
      const existing = await prisma.account.findUnique({
        where: {
          companyId_accountNumber: {
            companyId,
            accountNumber: finalAccountNumber
          }
        }
      });

      if (existing) {
        throw new ApiError(400, 'Account number already exists', ERROR_CODES.DUPLICATE_RESOURCE);
      }
    }

    // Auto-detect opening balance type based on account type if not provided or incorrect
    const validDebitTypes = [ACCOUNT_TYPES.ASSET, ACCOUNT_TYPES.EXPENSE];
    const validCreditTypes = [ACCOUNT_TYPES.LIABILITY, ACCOUNT_TYPES.EQUITY, ACCOUNT_TYPES.REVENUE];

    // Auto-correct opening balance type based on account type
    let finalOpeningBalanceType = openingBalanceType;
    if (validCreditTypes.includes(accountType)) {
      finalOpeningBalanceType = TRANSACTION_TYPES.CREDIT;
    } else if (validDebitTypes.includes(accountType)) {
      finalOpeningBalanceType = TRANSACTION_TYPES.DEBIT;
    }

    // Create account
    const account = await prisma.account.create({
      data: {
        companyId,
        accountNumber: finalAccountNumber,
        accountName,
        accountType,
        parentId: parentId || null,
        description: description || null,
        currency: currency || 'INR',
        openingBalance: new Decimal(openingBalance || 0),
        currentBalance: new Decimal(openingBalance || 0),
        isActive: true,
        createdBy: userId
      },
      include: {
        parent: {
          select: {
            id: true,
            accountNumber: true,
            accountName: true
          }
        }
      }
    });

    logger.info(`Account created: ${account.accountNumber} - ${account.accountName}`);
    return account;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error creating account:', error);
    throw new ApiError(500, 'Failed to create account', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get all accounts with optional filters
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of accounts
 */
export const getAccounts = async (companyId, filters = {}) => {
  const { accountType, isActive, parentId, search } = filters;

  try {
    const where = { companyId };

    if (accountType) {
      where.accountType = accountType;
    }

    if (typeof isActive !== 'undefined') {
      where.isActive = isActive === 'true' || isActive === true;
    }

    if (parentId) {
      where.parentId = parentId;
    }

    if (search) {
      where.OR = [
        { accountName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const accounts = await prisma.account.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            accountNumber: true,
            accountName: true
          }
        },
        children: {
          select: {
            id: true,
            accountNumber: true,
            accountName: true,
            accountType: true
          }
        }
      },
      orderBy: { accountNumber: 'asc' }
    });

    return accounts;

  } catch (error) {
    logger.error('Error fetching accounts:', error);
    throw new ApiError(500, 'Failed to fetch accounts', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get account by ID with balance
 * @param {string} accountId - Account ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Account details
 */
export const getAccountById = async (accountId, companyId) => {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        companyId
      },
      include: {
        parent: {
          select: {
            id: true,
            accountNumber: true,
            accountName: true
          }
        },
        children: {
          select: {
            id: true,
            accountNumber: true,
            accountName: true,
            accountType: true,
            currentBalance: true
          }
        },
        journalLines: {
          where: {
            entry: {
              isPosted: true
            }
          },
          include: {
            entry: {
              select: {
                entryNumber: true,
                entryDate: true,
                description: true
              }
            }
          },
          orderBy: {
            entry: {
              entryDate: 'desc'
            }
          },
          take: 10
        }
      }
    });

    if (!account) {
      throw new ApiError(404, 'Account not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Recalculate current balance
    const currentBalance = await calculateAccountBalance(
      account.id,
      account.accountType,
      account.openingBalance
    );

    // Update balance if different
    if (!currentBalance.equals(account.currentBalance)) {
      await prisma.account.update({
        where: { id: accountId },
        data: { currentBalance }
      });
      account.currentBalance = currentBalance;
    }

    return account;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching account:', error);
    throw new ApiError(500, 'Failed to fetch account', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Update account
 * @param {string} accountId - Account ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated account
 */
export const updateAccount = async (accountId, companyId, updateData) => {
  const { accountName, description, parentId, isActive } = updateData;

  try {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        companyId
      }
    });

    if (!account) {
      throw new ApiError(404, 'Account not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Check circular reference if parent is being updated
    if (parentId && parentId !== account.parentId) {
      const hasCircular = await hasCircularReference(accountId, parentId);
      if (hasCircular) {
        throw new ApiError(400, 'Circular reference detected in account hierarchy', ERROR_CODES.VALIDATION_ERROR);
      }

      // Validate parent exists and is same type
      const parent = await prisma.account.findUnique({
        where: { id: parentId }
      });

      if (!parent) {
        throw new ApiError(404, 'Parent account not found', ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      if (parent.accountType !== account.accountType) {
        throw new ApiError(400, 'Parent must have same account type', ERROR_CODES.VALIDATION_ERROR);
      }
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: {
        ...(accountName && { accountName }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId }),
        ...(typeof isActive !== 'undefined' && { isActive })
      },
      include: {
        parent: {
          select: {
            id: true,
            accountNumber: true,
            accountName: true
          }
        }
      }
    });

    logger.info(`Account updated: ${updated.accountNumber} - ${updated.accountName}`);
    return updated;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating account:', error);
    throw new ApiError(500, 'Failed to update account', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Delete account
 * @param {string} accountId - Account ID
 * @param {string} companyId - Company ID
 * @returns {Promise<void>}
 */
export const deleteAccount = async (accountId, companyId) => {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        companyId
      },
      include: {
        journalLines: true,
        children: true
      }
    });

    if (!account) {
      throw new ApiError(404, 'Account not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Check if account has transactions
    if (account.journalLines && account.journalLines.length > 0) {
      throw new ApiError(400, 'Cannot delete account with existing transactions', ERROR_CODES.VALIDATION_ERROR);
    }

    // Check if account has children
    if (account.children && account.children.length > 0) {
      throw new ApiError(400, 'Cannot delete account with child accounts', ERROR_CODES.VALIDATION_ERROR);
    }

    await prisma.account.delete({
      where: { id: accountId }
    });

    logger.info(`Account deleted: ${account.accountNumber} - ${account.accountName}`);

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting account:', error);
    throw new ApiError(500, 'Failed to delete account', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get account hierarchy tree
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} Account tree
 */
export const getAccountTree = async (companyId) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { companyId },
      orderBy: { accountNumber: 'asc' }
    });

    // Build tree structure
    const accountMap = new Map();
    const tree = [];

    // First pass: create map
    accounts.forEach(account => {
      accountMap.set(account.id, {
        ...account,
        children: []
      });
    });

    // Second pass: build tree
    accounts.forEach(account => {
      const node = accountMap.get(account.id);
      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          tree.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;

  } catch (error) {
    logger.error('Error fetching account tree:', error);
    throw new ApiError(500, 'Failed to fetch account tree', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Activate/deactivate account
 * @param {string} accountId - Account ID
 * @param {string} companyId - Company ID
 * @param {boolean} isActive - Active status
 * @returns {Promise<Object>} Updated account
 */
export const toggleAccountStatus = async (accountId, companyId, isActive) => {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        companyId
      }
    });

    if (!account) {
      throw new ApiError(404, 'Account not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: { isActive }
    });

    logger.info(`Account ${isActive ? 'activated' : 'deactivated'}: ${updated.accountNumber}`);
    return updated;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error toggling account status:', error);
    throw new ApiError(500, 'Failed to update account status', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get all account types
 * @returns {Object} Account types
 */
export const getAccountTypes = () => {
  return {
    types: Object.values(ACCOUNT_TYPES),
    ranges: {
      ASSET: '1000-1999',
      LIABILITY: '2000-2999',
      EQUITY: '3000-3999',
      REVENUE: '4000-4999',
      EXPENSE: '5000-5999'
    },
    descriptions: {
      ASSET: 'Resources owned by the company (Cash, Bank, Inventory, Receivables)',
      LIABILITY: 'Obligations owed by the company (Payables, Loans)',
      EQUITY: 'Owner\'s stake in the company (Capital, Retained Earnings)',
      REVENUE: 'Income generated from business operations (Sales, Service Income)',
      EXPENSE: 'Costs incurred in business operations (Purchases, Salaries, Rent)'
    }
  };
};
