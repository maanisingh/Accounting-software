/**
 * Financial Report Service
 * Business logic for financial reports - Balance Sheet, P&L, Cash Flow, Ledgers, etc.
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import logger from '../config/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Helper function to parse period to date range
 */
const parsePeriod = (period, startDate, endDate) => {
  const now = new Date();
  let start, end;

  if (period) {
    switch (period) {
      case 'TODAY':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'THIS_WEEK':
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        start.setHours(0, 0, 0, 0);
        end = new Date();
        break;
      case 'THIS_MONTH':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'THIS_QUARTER':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
        break;
      case 'THIS_YEAR':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
        end = endDate ? new Date(endDate) : new Date();
    }
  } else {
    start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
    end = endDate ? new Date(endDate) : new Date();
  }

  return { startDate: start, endDate: end };
};

/**
 * Get Balance Sheet
 * Assets = Liabilities + Equity
 */
export const getBalanceSheet = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    // Get all accounts with their balances
    const accounts = await prisma.account.findMany({
      where: { companyId },
      include: {
        journalLines: {
          where: {
            entry: {
              entryDate: { lte: endDate }
            }
          },
          select: {
            transactionType: true,
            amount: true
          }
        }
      }
    });

    // Calculate balances and categorize
    const assets = { current: [], fixed: [], total: new Decimal(0) };
    const liabilities = { current: [], longTerm: [], total: new Decimal(0) };
    const equity = { items: [], total: new Decimal(0) };

    accounts.forEach(account => {
      const debitTotal = account.journalLines
        .filter(line => line.transactionType === 'DEBIT')
        .reduce((sum, line) => sum.add(new Decimal(line.amount)), new Decimal(0));

      const creditTotal = account.journalLines
        .filter(line => line.transactionType === 'CREDIT')
        .reduce((sum, line) => sum.add(new Decimal(line.amount)), new Decimal(0));

      let balance;
      if (account.accountType === 'ASSET' || account.accountType === 'EXPENSE') {
        balance = debitTotal.minus(creditTotal);
      } else {
        balance = creditTotal.minus(debitTotal);
      }

      const accountData = {
        id: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        balance: balance.toNumber()
      };

      // Categorize based on account type and name
      if (account.accountType === 'ASSET') {
        // Classify as current or fixed based on account name/number
        if (account.accountName.toLowerCase().includes('current') ||
            account.accountName.toLowerCase().includes('cash') ||
            account.accountName.toLowerCase().includes('bank') ||
            account.accountName.toLowerCase().includes('receivable') ||
            account.accountName.toLowerCase().includes('inventory') ||
            parseInt(account.accountNumber) < 1500) {
          assets.current.push(accountData);
        } else {
          assets.fixed.push(accountData);
        }
        assets.total = assets.total.add(balance);
      } else if (account.accountType === 'LIABILITY') {
        if (account.accountName.toLowerCase().includes('current') ||
            account.accountName.toLowerCase().includes('payable') ||
            parseInt(account.accountNumber) < 2500) {
          liabilities.current.push(accountData);
        } else {
          liabilities.longTerm.push(accountData);
        }
        liabilities.total = liabilities.total.add(balance);
      } else if (account.accountType === 'EQUITY') {
        equity.items.push(accountData);
        equity.total = equity.total.add(balance);
      }
    });

    // Calculate retained earnings (P&L balance)
    const plBalance = await calculatePLBalance(companyId, endDate);
    equity.items.push({
      accountNumber: 'RE',
      accountName: 'Retained Earnings',
      balance: plBalance
    });
    equity.total = equity.total.add(new Decimal(plBalance));

    return {
      report: 'Balance Sheet',
      asOf: endDate,
      generated: new Date(),
      data: {
        assets: {
          current: assets.current,
          fixed: assets.fixed,
          totalCurrent: assets.current.reduce((sum, a) => sum + a.balance, 0),
          totalFixed: assets.fixed.reduce((sum, a) => sum + a.balance, 0),
          total: assets.total.toNumber()
        },
        liabilities: {
          current: liabilities.current,
          longTerm: liabilities.longTerm,
          totalCurrent: liabilities.current.reduce((sum, l) => sum + l.balance, 0),
          totalLongTerm: liabilities.longTerm.reduce((sum, l) => sum + l.balance, 0),
          total: liabilities.total.toNumber()
        },
        equity: {
          items: equity.items,
          total: equity.total.toNumber()
        }
      },
      totals: {
        totalAssets: assets.total.toNumber(),
        totalLiabilities: liabilities.total.toNumber(),
        totalEquity: equity.total.toNumber(),
        balanced: Math.abs(assets.total.minus(liabilities.total.add(equity.total)).toNumber()) < 0.01
      }
    };
  } catch (error) {
    logger.error('Error generating balance sheet:', error);
    throw new ApiError(500, 'Failed to generate balance sheet', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Helper to calculate P&L balance (retained earnings)
 */
const calculatePLBalance = async (companyId, endDate) => {
  const accounts = await prisma.account.findMany({
    where: {
      companyId,
      accountType: { in: ['REVENUE', 'EXPENSE'] }
    },
    include: {
      journalLines: {
        where: {
          entry: {
            entryDate: { lte: endDate }
          }
        },
        select: {
          transactionType: true,
          amount: true
        }
      }
    }
  });

  let totalRevenue = new Decimal(0);
  let totalExpense = new Decimal(0);

  accounts.forEach(account => {
    const debitTotal = account.journalLines
      .filter(line => line.transactionType === 'DEBIT')
      .reduce((sum, line) => sum.add(new Decimal(line.amount)), new Decimal(0));

    const creditTotal = account.journalLines
      .filter(line => line.transactionType === 'CREDIT')
      .reduce((sum, line) => sum.add(new Decimal(line.amount)), new Decimal(0));

    if (account.accountType === 'REVENUE') {
      totalRevenue = totalRevenue.add(creditTotal.minus(debitTotal));
    } else {
      totalExpense = totalExpense.add(debitTotal.minus(creditTotal));
    }
  });

  return totalRevenue.minus(totalExpense).toNumber();
};

/**
 * Get Profit & Loss Statement
 * Net Profit = Total Revenue - Total Expenses
 */
export const getProfitAndLoss = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    // Get revenue and expense accounts
    const accounts = await prisma.account.findMany({
      where: {
        companyId,
        accountType: { in: ['REVENUE', 'EXPENSE'] }
      },
      include: {
        journalLines: {
          where: {
            entry: {
              entryDate: {
                gte: startDate,
                lte: endDate
              }
            }
          },
          select: {
            transactionType: true,
            amount: true
          }
        }
      }
    });

    const revenue = { items: [], total: new Decimal(0) };
    const expenses = { operating: [], cogs: [], other: [], total: new Decimal(0) };

    accounts.forEach(account => {
      const debitTotal = account.journalLines
      .filter(line => line.transactionType === 'DEBIT')
      .reduce((sum, line) => sum.add(new Decimal(line.amount)), new Decimal(0));
      const creditTotal = account.journalLines
      .filter(line => line.transactionType === 'CREDIT')
      .reduce((sum, line) => sum.add(new Decimal(line.amount)), new Decimal(0));

      const accountData = {
        id: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        amount: 0
      };

      if (account.accountType === 'REVENUE') {
        accountData.amount = creditTotal.minus(debitTotal).toNumber();
        revenue.items.push(accountData);
        revenue.total = revenue.total.add(creditTotal.minus(debitTotal));
      } else if (account.accountType === 'EXPENSE') {
        accountData.amount = debitTotal.minus(creditTotal).toNumber();

        // Categorize expenses
        if (account.accountName.toLowerCase().includes('cogs') ||
            account.accountName.toLowerCase().includes('cost of goods')) {
          expenses.cogs.push(accountData);
        } else if (account.accountName.toLowerCase().includes('salary') ||
                   account.accountName.toLowerCase().includes('rent') ||
                   account.accountName.toLowerCase().includes('utilities')) {
          expenses.operating.push(accountData);
        } else {
          expenses.other.push(accountData);
        }
        expenses.total = expenses.total.add(debitTotal.minus(creditTotal));
      }
    });

    const grossProfit = revenue.total.minus(
      new Decimal(expenses.cogs.reduce((sum, e) => sum + e.amount, 0))
    );
    const netProfit = revenue.total.minus(expenses.total);

    return {
      report: 'Profit & Loss Statement',
      period: { startDate, endDate },
      generated: new Date(),
      data: {
        revenue: {
          items: revenue.items,
          total: revenue.total.toNumber()
        },
        expenses: {
          costOfGoodsSold: {
            items: expenses.cogs,
            total: expenses.cogs.reduce((sum, e) => sum + e.amount, 0)
          },
          operating: {
            items: expenses.operating,
            total: expenses.operating.reduce((sum, e) => sum + e.amount, 0)
          },
          other: {
            items: expenses.other,
            total: expenses.other.reduce((sum, e) => sum + e.amount, 0)
          },
          total: expenses.total.toNumber()
        }
      },
      totals: {
        totalRevenue: revenue.total.toNumber(),
        totalExpenses: expenses.total.toNumber(),
        grossProfit: grossProfit.toNumber(),
        netProfit: netProfit.toNumber(),
        profitMargin: revenue.total.toNumber() > 0
          ? (netProfit.div(revenue.total).mul(100).toNumber())
          : 0
      }
    };
  } catch (error) {
    logger.error('Error generating P&L statement:', error);
    throw new ApiError(500, 'Failed to generate P&L statement', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Cash Flow Statement
 */
export const getCashFlowStatement = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    // Get cash and bank accounts
    const cashAccounts = await prisma.account.findMany({
      where: {
        companyId,
        OR: [
          { accountName: { contains: 'Cash', mode: 'insensitive' } },
          { accountName: { contains: 'Bank', mode: 'insensitive' } }
        ]
      },
      include: {
        journalLines: {
          where: {
            entry: {
              entryDate: {
                gte: startDate,
                lte: endDate
              }
            }
          },
          include: {
            entry: {
              select: {
                entryNumber: true,
                entryDate: true,
                description: true,
                referenceType: true
              }
            }
          }
        }
      }
    });

    const operating = [];
    const investing = [];
    const financing = [];

    cashAccounts.forEach(account => {
      account.journalLines.forEach(line => {
        const amount = new Decimal(line.debit).minus(new Decimal(line.credit));
        const transaction = {
          date: line.journalEntry.entryDate,
          description: line.journalEntry.description,
          referenceType: line.journalEntry.referenceType,
          amount: amount.toNumber()
        };

        // Categorize based on reference type
        const refType = line.journalEntry.referenceType || '';
        if (refType.includes('INVOICE') || refType.includes('BILL') ||
            refType.includes('RECEIPT') || refType.includes('PAYMENT')) {
          operating.push(transaction);
        } else if (refType.includes('ASSET')) {
          investing.push(transaction);
        } else {
          financing.push(transaction);
        }
      });
    });

    const operatingTotal = operating.reduce((sum, t) => sum + t.amount, 0);
    const investingTotal = investing.reduce((sum, t) => sum + t.amount, 0);
    const financingTotal = financing.reduce((sum, t) => sum + t.amount, 0);

    return {
      report: 'Cash Flow Statement',
      period: { startDate, endDate },
      generated: new Date(),
      data: {
        operating: {
          items: operating,
          total: operatingTotal
        },
        investing: {
          items: investing,
          total: investingTotal
        },
        financing: {
          items: financing,
          total: financingTotal
        }
      },
      totals: {
        netCashFlow: operatingTotal + investingTotal + financingTotal,
        operatingCashFlow: operatingTotal,
        investingCashFlow: investingTotal,
        financingCashFlow: financingTotal
      }
    };
  } catch (error) {
    logger.error('Error generating cash flow statement:', error);
    throw new ApiError(500, 'Failed to generate cash flow statement', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Trial Balance
 * Total Debits = Total Credits
 */
export const getTrialBalance = async (companyId, filters = {}) => {
  try {
    const { endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const accounts = await prisma.account.findMany({
      where: { companyId },
      include: {
        journalLines: {
          where: {
            entry: {
              entryDate: { lte: endDate }
            }
          },
          select: {
            transactionType: true,
            amount: true
          }
        }
      },
      orderBy: { accountNumber: 'asc' }
    });

    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);

    const balances = accounts.map(account => {
      const debitTotal = account.journalLines
      .filter(line => line.transactionType === 'DEBIT')
      .reduce((sum, line) => sum.add(new Decimal(line.amount)), new Decimal(0));
      const creditTotal = account.journalLines
      .filter(line => line.transactionType === 'CREDIT')
      .reduce((sum, line) => sum.add(new Decimal(line.amount)), new Decimal(0));

      const netDebit = debitTotal.gt(creditTotal) ? debitTotal.minus(creditTotal) : new Decimal(0);
      const netCredit = creditTotal.gt(debitTotal) ? creditTotal.minus(debitTotal) : new Decimal(0);

      totalDebits = totalDebits.add(netDebit);
      totalCredits = totalCredits.add(netCredit);

      return {
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        accountType: account.accountType,
        debit: netDebit.toNumber(),
        credit: netCredit.toNumber()
      };
    });

    return {
      report: 'Trial Balance',
      asOf: endDate,
      generated: new Date(),
      data: balances,
      totals: {
        totalDebits: totalDebits.toNumber(),
        totalCredits: totalCredits.toNumber(),
        difference: totalDebits.minus(totalCredits).toNumber(),
        balanced: Math.abs(totalDebits.minus(totalCredits).toNumber()) < 0.01
      }
    };
  } catch (error) {
    logger.error('Error generating trial balance:', error);
    throw new ApiError(500, 'Failed to generate trial balance', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Account Ledger
 */
export const getAccountLedger = async (companyId, accountId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    // Get account details
    const account = await prisma.account.findFirst({
      where: { id: accountId, companyId }
    });

    if (!account) {
      throw new ApiError(404, 'Account not found', ERROR_CODES.NOT_FOUND);
    }

    // Calculate opening balance
    const openingLines = await prisma.journalLine.findMany({
      where: {
        accountId,
        entry: {
          entryDate: { lt: startDate }
        }
      },
      select: {
        transactionType: true,
        amount: true
      }
    });

    let openingBalance = new Decimal(account.openingBalance || 0);
    openingLines.forEach(line => {
      const debit = line.transactionType === 'DEBIT' ? new Decimal(line.amount) : new Decimal(0);
      const credit = line.transactionType === 'CREDIT' ? new Decimal(line.amount) : new Decimal(0);

      if (account.accountType === 'ASSET' || account.accountType === 'EXPENSE') {
        openingBalance = openingBalance.add(debit).minus(credit);
      } else {
        openingBalance = openingBalance.add(credit).minus(debit);
      }
    });

    // Get transactions for period
    const transactions = await prisma.journalLine.findMany({
      where: {
        accountId,
        entry: {
          entryDate: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        entry: {
          select: {
            entryNumber: true,
            entryDate: true,
            description: true,
            referenceType: true,
            referenceNumber: true
          }
        }
      },
      orderBy: {
        entry: { entryDate: 'asc' }
      }
    });

    // Calculate running balance
    let runningBalance = openingBalance;
    const ledger = transactions.map(line => {
      const debit = line.transactionType === 'DEBIT' ? new Decimal(line.amount) : new Decimal(0);
      const credit = line.transactionType === 'CREDIT' ? new Decimal(line.amount) : new Decimal(0);

      if (account.accountType === 'ASSET' || account.accountType === 'EXPENSE') {
        runningBalance = runningBalance.add(debit).minus(credit);
      } else {
        runningBalance = runningBalance.add(credit).minus(debit);
      }

      return {
        date: line.entry.entryDate,
        entryNumber: line.entry.entryNumber,
        description: line.entry.description,
        referenceType: line.entry.referenceType,
        referenceNumber: line.entry.referenceNumber,
        debit: debit.toNumber(),
        credit: credit.toNumber(),
        balance: runningBalance.toNumber()
      };
    });

    return {
      report: 'Account Ledger',
      account: {
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        accountType: account.accountType
      },
      period: { startDate, endDate },
      generated: new Date(),
      openingBalance: openingBalance.toNumber(),
      closingBalance: runningBalance.toNumber(),
      data: ledger
    };
  } catch (error) {
    logger.error('Error generating account ledger:', error);
    throw error;
  }
};

/**
 * Get General Ledger (all accounts)
 */
export const getGeneralLedger = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const accounts = await prisma.account.findMany({
      where: { companyId },
      orderBy: { accountNumber: 'asc' }
    });

    const ledgers = await Promise.all(
      accounts.map(async (account) => {
        const ledger = await getAccountLedger(companyId, account.id, filters);
        return {
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          accountType: account.accountType,
          openingBalance: ledger.openingBalance,
          closingBalance: ledger.closingBalance,
          transactionCount: ledger.data.length
        };
      })
    );

    return {
      report: 'General Ledger',
      period: { startDate, endDate },
      generated: new Date(),
      data: ledgers
    };
  } catch (error) {
    logger.error('Error generating general ledger:', error);
    throw new ApiError(500, 'Failed to generate general ledger', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Day Book
 */
export const getDayBook = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const entries = await prisma.journalEntry.findMany({
      where: {
        companyId,
        entryDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        journalLines: {
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

    const dayBook = entries.map(entry => ({
      date: entry.entryDate,
      entryNumber: entry.entryNumber,
      description: entry.description,
      referenceType: entry.referenceType,
      referenceNumber: entry.referenceNumber,
      lines: entry.journalLines.map(line => ({
        accountNumber: line.account.accountNumber,
        accountName: line.account.accountName,
        debit: new Decimal(line.debit).toNumber(),
        credit: new Decimal(line.credit).toNumber()
      })),
      totalDebit: entry.journalLines.reduce((sum, l) => sum + parseFloat(l.debit), 0),
      totalCredit: entry.journalLines.reduce((sum, l) => sum + parseFloat(l.credit), 0)
    }));

    return {
      report: 'Day Book',
      period: { startDate, endDate },
      generated: new Date(),
      data: dayBook,
      summary: {
        totalEntries: dayBook.length,
        totalDebits: dayBook.reduce((sum, e) => sum + e.totalDebit, 0),
        totalCredits: dayBook.reduce((sum, e) => sum + e.totalCredit, 0)
      }
    };
  } catch (error) {
    logger.error('Error generating day book:', error);
    throw new ApiError(500, 'Failed to generate day book', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Bank Book
 */
export const getBankBook = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const bankAccounts = await prisma.account.findMany({
      where: {
        companyId,
        accountName: { contains: 'Bank', mode: 'insensitive' }
      }
    });

    const bankTransactions = await Promise.all(
      bankAccounts.map(async (account) => {
        const ledger = await getAccountLedger(companyId, account.id, filters);
        return {
          account: {
            accountNumber: account.accountNumber,
            accountName: account.accountName
          },
          openingBalance: ledger.openingBalance,
          closingBalance: ledger.closingBalance,
          transactions: ledger.data
        };
      })
    );

    return {
      report: 'Bank Book',
      period: { startDate, endDate },
      generated: new Date(),
      data: bankTransactions
    };
  } catch (error) {
    logger.error('Error generating bank book:', error);
    throw new ApiError(500, 'Failed to generate bank book', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Cash Book
 */
export const getCashBook = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const cashAccounts = await prisma.account.findMany({
      where: {
        companyId,
        accountName: { contains: 'Cash', mode: 'insensitive' }
      }
    });

    const cashTransactions = await Promise.all(
      cashAccounts.map(async (account) => {
        const ledger = await getAccountLedger(companyId, account.id, filters);
        return {
          account: {
            accountNumber: account.accountNumber,
            accountName: account.accountName
          },
          openingBalance: ledger.openingBalance,
          closingBalance: ledger.closingBalance,
          transactions: ledger.data
        };
      })
    );

    return {
      report: 'Cash Book',
      period: { startDate, endDate },
      generated: new Date(),
      data: cashTransactions
    };
  } catch (error) {
    logger.error('Error generating cash book:', error);
    throw new ApiError(500, 'Failed to generate cash book', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Accounts Receivable
 */
export const getAccountsReceivable = async (companyId, filters = {}) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        paymentStatus: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
      },
      include: {
        customer: {
          select: {
            customerNumber: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { invoiceDate: 'asc' }
    });

    const receivables = invoices.map(invoice => {
      const daysOutstanding = Math.floor(
        (new Date() - new Date(invoice.invoiceDate)) / (1000 * 60 * 60 * 24)
      );

      return {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        customer: invoice.customer,
        totalAmount: new Decimal(invoice.total).toNumber(),
        paidAmount: new Decimal(invoice.paidAmount).toNumber(),
        balanceAmount: new Decimal(invoice.balanceAmount).toNumber(),
        daysOutstanding,
        status: invoice.paymentStatus
      };
    });

    const totalReceivable = receivables.reduce((sum, r) => sum + r.balanceAmount, 0);

    return {
      report: 'Accounts Receivable',
      asOf: new Date(),
      generated: new Date(),
      data: receivables,
      summary: {
        totalInvoices: receivables.length,
        totalReceivable,
        averageDaysOutstanding: receivables.length > 0
          ? receivables.reduce((sum, r) => sum + r.daysOutstanding, 0) / receivables.length
          : 0
      }
    };
  } catch (error) {
    logger.error('Error generating accounts receivable:', error);
    throw new ApiError(500, 'Failed to generate accounts receivable', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Accounts Payable
 */
export const getAccountsPayable = async (companyId, filters = {}) => {
  try {
    const bills = await prisma.bill.findMany({
      where: {
        companyId,
        paymentStatus: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
      },
      include: {
        vendor: {
          select: {
            vendorNumber: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { billDate: 'asc' }
    });

    const payables = bills.map(bill => {
      const daysOutstanding = Math.floor(
        (new Date() - new Date(bill.billDate)) / (1000 * 60 * 60 * 24)
      );

      return {
        billNumber: bill.billNumber,
        billDate: bill.billDate,
        dueDate: bill.dueDate,
        vendor: bill.vendor,
        totalAmount: new Decimal(bill.total).toNumber(),
        paidAmount: new Decimal(bill.paidAmount).toNumber(),
        balanceAmount: new Decimal(bill.balanceAmount).toNumber(),
        daysOutstanding,
        status: bill.paymentStatus
      };
    });

    const totalPayable = payables.reduce((sum, p) => sum + p.balanceAmount, 0);

    return {
      report: 'Accounts Payable',
      asOf: new Date(),
      generated: new Date(),
      data: payables,
      summary: {
        totalBills: payables.length,
        totalPayable,
        averageDaysOutstanding: payables.length > 0
          ? payables.reduce((sum, p) => sum + p.daysOutstanding, 0) / payables.length
          : 0
      }
    };
  } catch (error) {
    logger.error('Error generating accounts payable:', error);
    throw new ApiError(500, 'Failed to generate accounts payable', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Aging Receivables
 */
export const getAgingReceivables = async (companyId, filters = {}) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        paymentStatus: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
      },
      include: {
        customer: {
          select: {
            customerNumber: true,
            name: true
          }
        }
      }
    });

    const buckets = {
      current: { range: '0-30 days', items: [], total: 0 },
      thirtyDays: { range: '31-60 days', items: [], total: 0 },
      sixtyDays: { range: '61-90 days', items: [], total: 0 },
      ninetyDays: { range: '91-120 days', items: [], total: 0 },
      overOneTwenty: { range: 'Over 120 days', items: [], total: 0 }
    };

    invoices.forEach(invoice => {
      const daysOutstanding = Math.floor(
        (new Date() - new Date(invoice.invoiceDate)) / (1000 * 60 * 60 * 24)
      );
      const balanceAmount = new Decimal(invoice.balanceAmount).toNumber();

      const item = {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        customer: invoice.customer.name,
        amount: balanceAmount,
        daysOutstanding
      };

      if (daysOutstanding <= 30) {
        buckets.current.items.push(item);
        buckets.current.total += balanceAmount;
      } else if (daysOutstanding <= 60) {
        buckets.thirtyDays.items.push(item);
        buckets.thirtyDays.total += balanceAmount;
      } else if (daysOutstanding <= 90) {
        buckets.sixtyDays.items.push(item);
        buckets.sixtyDays.total += balanceAmount;
      } else if (daysOutstanding <= 120) {
        buckets.ninetyDays.items.push(item);
        buckets.ninetyDays.total += balanceAmount;
      } else {
        buckets.overOneTwenty.items.push(item);
        buckets.overOneTwenty.total += balanceAmount;
      }
    });

    const totalReceivable = Object.values(buckets).reduce((sum, b) => sum + b.total, 0);

    return {
      report: 'Aging Receivables',
      asOf: new Date(),
      generated: new Date(),
      data: buckets,
      summary: {
        totalReceivable,
        totalInvoices: invoices.length
      }
    };
  } catch (error) {
    logger.error('Error generating aging receivables:', error);
    throw new ApiError(500, 'Failed to generate aging receivables', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Aging Payables
 */
export const getAgingPayables = async (companyId, filters = {}) => {
  try {
    const bills = await prisma.bill.findMany({
      where: {
        companyId,
        paymentStatus: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
      },
      include: {
        vendor: {
          select: {
            vendorNumber: true,
            name: true
          }
        }
      }
    });

    const buckets = {
      current: { range: '0-30 days', items: [], total: 0 },
      thirtyDays: { range: '31-60 days', items: [], total: 0 },
      sixtyDays: { range: '61-90 days', items: [], total: 0 },
      ninetyDays: { range: '91-120 days', items: [], total: 0 },
      overOneTwenty: { range: 'Over 120 days', items: [], total: 0 }
    };

    bills.forEach(bill => {
      const daysOutstanding = Math.floor(
        (new Date() - new Date(bill.billDate)) / (1000 * 60 * 60 * 24)
      );
      const balanceAmount = new Decimal(bill.balanceAmount).toNumber();

      const item = {
        billNumber: bill.billNumber,
        billDate: bill.billDate,
        vendor: bill.vendor.name,
        amount: balanceAmount,
        daysOutstanding
      };

      if (daysOutstanding <= 30) {
        buckets.current.items.push(item);
        buckets.current.total += balanceAmount;
      } else if (daysOutstanding <= 60) {
        buckets.thirtyDays.items.push(item);
        buckets.thirtyDays.total += balanceAmount;
      } else if (daysOutstanding <= 90) {
        buckets.sixtyDays.items.push(item);
        buckets.sixtyDays.total += balanceAmount;
      } else if (daysOutstanding <= 120) {
        buckets.ninetyDays.items.push(item);
        buckets.ninetyDays.total += balanceAmount;
      } else {
        buckets.overOneTwenty.items.push(item);
        buckets.overOneTwenty.total += balanceAmount;
      }
    });

    const totalPayable = Object.values(buckets).reduce((sum, b) => sum + b.total, 0);

    return {
      report: 'Aging Payables',
      asOf: new Date(),
      generated: new Date(),
      data: buckets,
      summary: {
        totalPayable,
        totalBills: bills.length
      }
    };
  } catch (error) {
    logger.error('Error generating aging payables:', error);
    throw new ApiError(500, 'Failed to generate aging payables', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Journal Entries Report
 */
export const getJournalEntriesReport = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where: {
          companyId,
          entryDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          journalLines: {
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
        orderBy: { entryDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.journalEntry.count({
        where: {
          companyId,
          entryDate: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);

    return {
      report: 'Journal Entries',
      period: { startDate, endDate },
      generated: new Date(),
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error generating journal entries report:', error);
    throw new ApiError(500, 'Failed to generate journal entries report', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Audit Trail
 */
export const getAuditTrail = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where: {
          companyId,
          entryDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          journalLines: {
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.journalEntry.count({
        where: {
          companyId,
          entryDate: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);

    const audit = entries.map(entry => ({
      entryNumber: entry.entryNumber,
      entryDate: entry.entryDate,
      description: entry.description,
      referenceType: entry.referenceType,
      referenceNumber: entry.referenceNumber,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      createdBy: entry.createdBy,
      lines: entry.journalLines.length,
      totalDebit: entry.journalLines.reduce((sum, l) => sum + parseFloat(l.debit), 0),
      totalCredit: entry.journalLines.reduce((sum, l) => sum + parseFloat(l.credit), 0)
    }));

    return {
      report: 'Audit Trail',
      period: { startDate, endDate },
      generated: new Date(),
      data: audit,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error generating audit trail:', error);
    throw new ApiError(500, 'Failed to generate audit trail', ERROR_CODES.INTERNAL_ERROR);
  }
};
