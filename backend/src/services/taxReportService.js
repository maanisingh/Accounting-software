/**
 * Tax Report Service
 * Business logic for tax reports - GST, VAT, Input/Output tax
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
 * Get Tax Summary
 */
export const getTaxSummary = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    // Get sales tax (output tax)
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        invoiceDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED', 'VOID'] }
      },
      select: {
        taxAmount: true,
        subtotal: true
      }
    });

    const outputTax = invoices.reduce((sum, inv) => sum + parseFloat(inv.taxAmount), 0);
    const salesAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.subtotal), 0);

    // Get purchase tax (input tax)
    const bills = await prisma.bill.findMany({
      where: {
        companyId,
        billDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED', 'VOID'] }
      },
      select: {
        taxAmount: true,
        subtotal: true
      }
    });

    const inputTax = bills.reduce((sum, bill) => sum + parseFloat(bill.taxAmount), 0);
    const purchaseAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.subtotal), 0);

    const netTax = outputTax - inputTax;

    return {
      report: 'Tax Summary',
      period: { startDate, endDate },
      generated: new Date(),
      data: {
        sales: {
          amount: salesAmount,
          taxAmount: outputTax,
          transactionCount: invoices.length
        },
        purchases: {
          amount: purchaseAmount,
          taxAmount: inputTax,
          transactionCount: bills.length
        },
        netTax: {
          amount: netTax,
          status: netTax > 0 ? 'PAYABLE' : 'REFUNDABLE'
        }
      },
      summary: {
        outputTax,
        inputTax,
        netTaxLiability: netTax,
        effectiveTaxRate: salesAmount > 0 ? (outputTax / salesAmount * 100) : 0
      }
    };
  } catch (error) {
    logger.error('Error generating tax summary:', error);
    throw new ApiError(500, 'Failed to generate tax summary', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get GST Report
 */
export const getGSTReport = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    // Output GST (Sales)
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        invoiceDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED', 'VOID'] }
      },
      include: {
        items: true,
        customer: {
          select: {
            name: true,
            taxNumber: true
          }
        }
      }
    });

    // Input GST (Purchases)
    const bills = await prisma.bill.findMany({
      where: {
        companyId,
        billDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED', 'VOID'] }
      },
      include: {
        items: true,
        vendor: {
          select: {
            name: true,
            taxNumber: true
          }
        }
      }
    });

    // Categorize by GST rate
    const gstBreakdown = {
      '0': { rate: 0, taxableValue: 0, igst: 0, cgst: 0, sgst: 0 },
      '5': { rate: 5, taxableValue: 0, igst: 0, cgst: 0, sgst: 0 },
      '12': { rate: 12, taxableValue: 0, igst: 0, cgst: 0, sgst: 0 },
      '18': { rate: 18, taxableValue: 0, igst: 0, cgst: 0, sgst: 0 },
      '28': { rate: 28, taxableValue: 0, igst: 0, cgst: 0, sgst: 0 }
    };

    // Process invoices (output GST)
    const outputGST = { total: 0, cgst: 0, sgst: 0, igst: 0 };
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const taxRate = parseFloat(item.taxRate);
        const amount = parseFloat(item.amount);
        const taxAmount = amount * (taxRate / 100);

        const rateKey = Math.round(taxRate).toString();
        if (gstBreakdown[rateKey]) {
          gstBreakdown[rateKey].taxableValue += amount;
          // Assuming CGST/SGST for intra-state, IGST for inter-state
          // For simplicity, splitting equally as CGST and SGST
          gstBreakdown[rateKey].cgst += taxAmount / 2;
          gstBreakdown[rateKey].sgst += taxAmount / 2;
        }

        outputGST.total += taxAmount;
        outputGST.cgst += taxAmount / 2;
        outputGST.sgst += taxAmount / 2;
      });
    });

    // Process bills (input GST)
    const inputGST = { total: 0, cgst: 0, sgst: 0, igst: 0 };
    bills.forEach(bill => {
      bill.items.forEach(item => {
        const taxRate = parseFloat(item.taxRate);
        const amount = parseFloat(item.amount);
        const taxAmount = amount * (taxRate / 100);

        inputGST.total += taxAmount;
        inputGST.cgst += taxAmount / 2;
        inputGST.sgst += taxAmount / 2;
      });
    });

    const netGST = outputGST.total - inputGST.total;

    return {
      report: 'GST Report',
      period: { startDate, endDate },
      generated: new Date(),
      data: {
        output: {
          invoices: invoices.map(inv => ({
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.invoiceDate,
            customer: inv.customer.name,
            gstin: inv.customer.taxNumber,
            taxableValue: parseFloat(inv.subtotal),
            taxAmount: parseFloat(inv.taxAmount)
          })),
          summary: outputGST
        },
        input: {
          bills: bills.map(bill => ({
            billNumber: bill.billNumber,
            billDate: bill.billDate,
            vendor: bill.vendor.name,
            gstin: bill.vendor.taxNumber,
            taxableValue: parseFloat(bill.subtotal),
            taxAmount: parseFloat(bill.taxAmount)
          })),
          summary: inputGST
        },
        gstBreakdown: Object.values(gstBreakdown)
      },
      summary: {
        outputGST: outputGST.total,
        inputGST: inputGST.total,
        netGST,
        status: netGST > 0 ? 'PAYABLE' : 'REFUNDABLE'
      }
    };
  } catch (error) {
    logger.error('Error generating GST report:', error);
    throw new ApiError(500, 'Failed to generate GST report', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get VAT Report
 */
export const getVATReport = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    // Output VAT (Sales)
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        invoiceDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED', 'VOID'] }
      },
      include: {
        items: true,
        customer: {
          select: {
            name: true,
            taxNumber: true
          }
        }
      }
    });

    // Input VAT (Purchases)
    const bills = await prisma.bill.findMany({
      where: {
        companyId,
        billDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED', 'VOID'] }
      },
      include: {
        items: true,
        vendor: {
          select: {
            name: true,
            taxNumber: true
          }
        }
      }
    });

    // Categorize by VAT rate
    const vatBreakdown = {};

    // Process invoices (output VAT)
    let outputVAT = 0;
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const taxRate = parseFloat(item.taxRate);
        const amount = parseFloat(item.amount);
        const taxAmount = amount * (taxRate / 100);

        const rateKey = taxRate.toString();
        if (!vatBreakdown[rateKey]) {
          vatBreakdown[rateKey] = {
            rate: taxRate,
            taxableValue: 0,
            vatAmount: 0
          };
        }

        vatBreakdown[rateKey].taxableValue += amount;
        vatBreakdown[rateKey].vatAmount += taxAmount;
        outputVAT += taxAmount;
      });
    });

    // Process bills (input VAT)
    let inputVAT = 0;
    bills.forEach(bill => {
      bill.items.forEach(item => {
        const taxRate = parseFloat(item.taxRate);
        const amount = parseFloat(item.amount);
        const taxAmount = amount * (taxRate / 100);

        inputVAT += taxAmount;
      });
    });

    const netVAT = outputVAT - inputVAT;

    return {
      report: 'VAT Report',
      period: { startDate, endDate },
      generated: new Date(),
      data: {
        output: {
          invoices: invoices.map(inv => ({
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.invoiceDate,
            customer: inv.customer.name,
            vatNumber: inv.customer.taxNumber,
            taxableValue: parseFloat(inv.subtotal),
            vatAmount: parseFloat(inv.taxAmount)
          })),
          total: outputVAT
        },
        input: {
          bills: bills.map(bill => ({
            billNumber: bill.billNumber,
            billDate: bill.billDate,
            vendor: bill.vendor.name,
            vatNumber: bill.vendor.taxNumber,
            taxableValue: parseFloat(bill.subtotal),
            vatAmount: parseFloat(bill.taxAmount)
          })),
          total: inputVAT
        },
        vatBreakdown: Object.values(vatBreakdown)
      },
      summary: {
        outputVAT,
        inputVAT,
        netVAT,
        status: netVAT > 0 ? 'PAYABLE' : 'REFUNDABLE'
      }
    };
  } catch (error) {
    logger.error('Error generating VAT report:', error);
    throw new ApiError(500, 'Failed to generate VAT report', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Input Tax Credit Report
 */
export const getInputTaxCredit = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const bills = await prisma.bill.findMany({
      where: {
        companyId,
        billDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED', 'VOID'] }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        },
        vendor: {
          select: {
            name: true,
            taxNumber: true
          }
        }
      },
      orderBy: { billDate: 'desc' }
    });

    // Calculate ITC by category
    const itcByCategory = {
      capital_goods: { amount: 0, tax: 0 },
      raw_materials: { amount: 0, tax: 0 },
      services: { amount: 0, tax: 0 },
      other: { amount: 0, tax: 0 }
    };

    const transactions = bills.map(bill => {
      const taxAmount = parseFloat(bill.taxAmount);
      const subtotal = parseFloat(bill.subtotal);

      // Categorize based on product type (simplified)
      // In real scenario, this would be based on HSN/SAC codes
      bill.items.forEach(item => {
        itcByCategory.other.amount += parseFloat(item.amount);
        itcByCategory.other.tax += parseFloat(item.amount) * (parseFloat(item.taxRate) / 100);
      });

      return {
        billNumber: bill.billNumber,
        billDate: bill.billDate,
        vendor: {
          name: bill.vendor.name,
          taxNumber: bill.vendor.taxNumber
        },
        taxableValue: subtotal,
        taxAmount,
        itcEligible: taxAmount, // Assuming all is eligible
        itcClaimed: taxAmount
      };
    });

    const totalITC = transactions.reduce((sum, t) => sum + t.itcClaimed, 0);

    return {
      report: 'Input Tax Credit',
      period: { startDate, endDate },
      generated: new Date(),
      data: {
        transactions,
        byCategory: itcByCategory
      },
      summary: {
        totalPurchases: bills.length,
        totalTaxableValue: transactions.reduce((sum, t) => sum + t.taxableValue, 0),
        totalITCEligible: totalITC,
        totalITCClaimed: totalITC,
        itcUtilized: 0 // Would need to track against output tax
      }
    };
  } catch (error) {
    logger.error('Error generating input tax credit report:', error);
    throw new ApiError(500, 'Failed to generate input tax credit report', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Output Tax Liability Report
 */
export const getOutputTaxLiability = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        invoiceDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED', 'VOID'] }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        },
        customer: {
          select: {
            name: true,
            taxNumber: true
          }
        }
      },
      orderBy: { invoiceDate: 'desc' }
    });

    // Calculate tax by rate
    const taxByRate = {};

    const transactions = invoices.map(invoice => {
      const taxAmount = parseFloat(invoice.taxAmount);
      const subtotal = parseFloat(invoice.subtotal);

      invoice.items.forEach(item => {
        const rate = parseFloat(item.taxRate);
        const itemTax = parseFloat(item.amount) * (rate / 100);

        if (!taxByRate[rate]) {
          taxByRate[rate] = {
            rate,
            taxableValue: 0,
            taxAmount: 0,
            transactionCount: 0
          };
        }

        taxByRate[rate].taxableValue += parseFloat(item.amount);
        taxByRate[rate].taxAmount += itemTax;
        taxByRate[rate].transactionCount++;
      });

      return {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        customer: {
          name: invoice.customer.name,
          taxNumber: invoice.customer.taxNumber
        },
        taxableValue: subtotal,
        taxAmount,
        paymentStatus: invoice.paymentStatus
      };
    });

    const totalTax = transactions.reduce((sum, t) => sum + t.taxAmount, 0);

    // Get already paid tax (from receipts)
    const receipts = await prisma.receipt.findMany({
      where: {
        companyId,
        receiptDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED'] }
      }
    });

    // Calculate tax on paid invoices
    const paidInvoices = transactions.filter(t => t.paymentStatus === 'PAID');
    const taxCollected = paidInvoices.reduce((sum, t) => sum + t.taxAmount, 0);

    return {
      report: 'Output Tax Liability',
      period: { startDate, endDate },
      generated: new Date(),
      data: {
        transactions,
        byRate: Object.values(taxByRate)
      },
      summary: {
        totalInvoices: invoices.length,
        totalTaxableValue: transactions.reduce((sum, t) => sum + t.taxableValue, 0),
        totalTaxLiability: totalTax,
        taxCollected,
        taxPending: totalTax - taxCollected
      }
    };
  } catch (error) {
    logger.error('Error generating output tax liability report:', error);
    throw new ApiError(500, 'Failed to generate output tax liability report', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Tax Filing Ready Data
 */
export const getTaxFilingData = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    // Get all tax data in one comprehensive report
    const [taxSummary, gstReport, inputTax, outputTax] = await Promise.all([
      getTaxSummary(companyId, filters),
      getGSTReport(companyId, filters),
      getInputTaxCredit(companyId, filters),
      getOutputTaxLiability(companyId, filters)
    ]);

    // Compile filing data
    const filingData = {
      period: { startDate, endDate },
      generatedOn: new Date(),

      // GSTR-1 Data (Outward Supplies)
      gstr1: {
        b2b: gstReport.data.output.invoices.filter(inv => inv.gstin),
        b2c: gstReport.data.output.invoices.filter(inv => !inv.gstin),
        totalTaxableValue: outputTax.summary.totalTaxableValue,
        totalTax: outputTax.summary.totalTaxLiability
      },

      // GSTR-2 Data (Inward Supplies)
      gstr2: {
        b2b: gstReport.data.input.bills.filter(bill => bill.gstin),
        totalTaxableValue: inputTax.summary.totalTaxableValue,
        totalITC: inputTax.summary.totalITCClaimed
      },

      // GSTR-3B Summary
      gstr3b: {
        outwardTaxable: outputTax.summary.totalTaxableValue,
        outwardTax: {
          igst: gstReport.data.output.summary.igst,
          cgst: gstReport.data.output.summary.cgst,
          sgst: gstReport.data.output.summary.sgst,
          total: gstReport.data.output.summary.total
        },
        inwardTax: {
          igst: gstReport.data.input.summary.igst,
          cgst: gstReport.data.input.summary.cgst,
          sgst: gstReport.data.input.summary.sgst,
          total: gstReport.data.input.summary.total
        },
        netTax: {
          igst: gstReport.data.output.summary.igst - gstReport.data.input.summary.igst,
          cgst: gstReport.data.output.summary.cgst - gstReport.data.input.summary.cgst,
          sgst: gstReport.data.output.summary.sgst - gstReport.data.input.summary.sgst,
          total: gstReport.summary.netGST
        }
      }
    };

    return {
      report: 'Tax Filing Ready Data',
      period: { startDate, endDate },
      generated: new Date(),
      data: filingData,
      summary: {
        status: 'READY_FOR_FILING',
        netTaxLiability: gstReport.summary.netGST,
        dueDate: new Date(endDate.getFullYear(), endDate.getMonth() + 1, 20),
        filingPeriod: `${startDate.toISOString().slice(0, 7)} to ${endDate.toISOString().slice(0, 7)}`
      }
    };
  } catch (error) {
    logger.error('Error generating tax filing data:', error);
    throw new ApiError(500, 'Failed to generate tax filing data', ERROR_CODES.INTERNAL_ERROR);
  }
};
