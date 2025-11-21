/**
 * Sales Report Service
 * Business logic for sales analytics and reports
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
 * Get Sales Summary
 */
export const getSalesSummary = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    // Get invoice summary
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
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        subtotal: true,
        taxAmount: true,
        discountAmount: true,
        total: true,
        paidAmount: true,
        balanceAmount: true,
        paymentStatus: true
      }
    });

    const totalSales = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const totalTax = invoices.reduce((sum, inv) => sum + parseFloat(inv.taxAmount), 0);
    const totalDiscount = invoices.reduce((sum, inv) => sum + parseFloat(inv.discountAmount), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + parseFloat(inv.balanceAmount), 0);

    // Get sales by status
    const statusBreakdown = {
      paid: invoices.filter(i => i.paymentStatus === 'PAID').length,
      partial: invoices.filter(i => i.paymentStatus === 'PARTIAL').length,
      pending: invoices.filter(i => i.paymentStatus === 'PENDING').length,
      overdue: invoices.filter(i => i.paymentStatus === 'OVERDUE').length
    };

    return {
      report: 'Sales Summary',
      period: { startDate, endDate },
      generated: new Date(),
      data: {
        totalInvoices: invoices.length,
        totalSales,
        totalTax,
        totalDiscount,
        totalPaid,
        totalOutstanding,
        averageInvoiceValue: invoices.length > 0 ? totalSales / invoices.length : 0
      },
      statusBreakdown
    };
  } catch (error) {
    logger.error('Error generating sales summary:', error);
    throw new ApiError(500, 'Failed to generate sales summary', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Detailed Sales
 */
export const getDetailedSales = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          companyId,
          invoiceDate: {
            gte: startDate,
            lte: endDate
          },
          status: { notIn: ['CANCELLED', 'VOID'] }
        },
        include: {
          customer: {
            select: {
              customerNumber: true,
              name: true,
              email: true,
              phone: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  sku: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.invoice.count({
        where: {
          companyId,
          invoiceDate: {
            gte: startDate,
            lte: endDate
          },
          status: { notIn: ['CANCELLED', 'VOID'] }
        }
      })
    ]);

    return {
      report: 'Detailed Sales',
      period: { startDate, endDate },
      generated: new Date(),
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error generating detailed sales:', error);
    throw new ApiError(500, 'Failed to generate detailed sales', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Sales by Customer
 */
export const getSalesByCustomer = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const salesByCustomer = await prisma.invoice.groupBy({
      by: ['customerId'],
      where: {
        companyId,
        invoiceDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED', 'VOID'] }
      },
      _sum: {
        total: true,
        taxAmount: true,
        paidAmount: true,
        balanceAmount: true
      },
      _count: {
        id: true
      }
    });

    // Get customer details
    const customerIds = salesByCustomer.map(s => s.customerId);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: {
        id: true,
        customerNumber: true,
        name: true,
        email: true,
        phone: true
      }
    });

    const customerMap = {};
    customers.forEach(c => {
      customerMap[c.id] = c;
    });

    const report = salesByCustomer.map(sale => ({
      customer: customerMap[sale.customerId],
      totalInvoices: sale._count.id,
      totalSales: parseFloat(sale._sum.total) || 0,
      totalTax: parseFloat(sale._sum.taxAmount) || 0,
      totalPaid: parseFloat(sale._sum.paidAmount) || 0,
      totalOutstanding: parseFloat(sale._sum.balanceAmount) || 0,
      averageInvoiceValue: sale._count.id > 0 ? (parseFloat(sale._sum.total) || 0) / sale._count.id : 0
    }));

    // Sort by total sales descending
    report.sort((a, b) => b.totalSales - a.totalSales);

    return {
      report: 'Sales by Customer',
      period: { startDate, endDate },
      generated: new Date(),
      data: report,
      summary: {
        totalCustomers: report.length,
        totalSales: report.reduce((sum, r) => sum + r.totalSales, 0),
        totalInvoices: report.reduce((sum, r) => sum + r.totalInvoices, 0)
      }
    };
  } catch (error) {
    logger.error('Error generating sales by customer:', error);
    throw new ApiError(500, 'Failed to generate sales by customer', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Sales by Product
 */
export const getSalesByProduct = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const salesByProduct = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      where: {
        invoice: {
          companyId,
          invoiceDate: {
            gte: startDate,
            lte: endDate
          },
          status: { notIn: ['CANCELLED', 'VOID'] }
        }
      },
      _sum: {
        quantity: true,
        amount: true,
        discountAmount: true
      },
      _count: {
        id: true
      }
    });

    // Get product details
    const productIds = salesByProduct.map(s => s.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        sku: true,
        name: true,
        category: {
          select: { name: true }
        },
        brand: {
          select: { name: true }
        }
      }
    });

    const productMap = {};
    products.forEach(p => {
      productMap[p.id] = p;
    });

    const report = salesByProduct.map(sale => ({
      product: productMap[sale.productId],
      totalQuantity: parseFloat(sale._sum.quantity) || 0,
      totalAmount: parseFloat(sale._sum.amount) || 0,
      totalDiscount: parseFloat(sale._sum.discountAmount) || 0,
      transactionCount: sale._count.id,
      averagePrice: sale._count.id > 0 ? (parseFloat(sale._sum.amount) || 0) / (parseFloat(sale._sum.quantity) || 1) : 0
    }));

    // Sort by total amount descending
    report.sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      report: 'Sales by Product',
      period: { startDate, endDate },
      generated: new Date(),
      data: report,
      summary: {
        totalProducts: report.length,
        totalQuantitySold: report.reduce((sum, r) => sum + r.totalQuantity, 0),
        totalSales: report.reduce((sum, r) => sum + r.totalAmount, 0)
      }
    };
  } catch (error) {
    logger.error('Error generating sales by product:', error);
    throw new ApiError(500, 'Failed to generate sales by product', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Sales by Date
 */
export const getSalesByDate = async (companyId, filters = {}) => {
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
      select: {
        invoiceDate: true,
        total: true,
        taxAmount: true,
        paidAmount: true
      },
      orderBy: { invoiceDate: 'asc' }
    });

    // Group by date
    const salesByDate = {};
    invoices.forEach(invoice => {
      const date = invoice.invoiceDate.toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          totalInvoices: 0,
          totalSales: 0,
          totalTax: 0,
          totalPaid: 0
        };
      }
      salesByDate[date].totalInvoices++;
      salesByDate[date].totalSales += parseFloat(invoice.total);
      salesByDate[date].totalTax += parseFloat(invoice.taxAmount);
      salesByDate[date].totalPaid += parseFloat(invoice.paidAmount);
    });

    const report = Object.values(salesByDate);

    return {
      report: 'Sales by Date',
      period: { startDate, endDate },
      generated: new Date(),
      data: report,
      summary: {
        totalDays: report.length,
        totalSales: report.reduce((sum, r) => sum + r.totalSales, 0),
        averageDailySales: report.length > 0 ? report.reduce((sum, r) => sum + r.totalSales, 0) / report.length : 0
      }
    };
  } catch (error) {
    logger.error('Error generating sales by date:', error);
    throw new ApiError(500, 'Failed to generate sales by date', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Sales Trends
 */
export const getSalesTrends = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);
    const groupBy = filters.groupBy || 'MONTH'; // DAY, WEEK, MONTH, QUARTER, YEAR

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
        invoiceDate: true,
        total: true,
        taxAmount: true
      },
      orderBy: { invoiceDate: 'asc' }
    });

    // Group by period
    const trends = {};
    invoices.forEach(invoice => {
      let period;
      const date = new Date(invoice.invoiceDate);

      switch (groupBy) {
        case 'DAY':
          period = date.toISOString().split('T')[0];
          break;
        case 'WEEK':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = weekStart.toISOString().split('T')[0];
          break;
        case 'MONTH':
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'QUARTER':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          period = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'YEAR':
          period = date.getFullYear().toString();
          break;
        default:
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!trends[period]) {
        trends[period] = {
          period,
          totalInvoices: 0,
          totalSales: 0,
          totalTax: 0
        };
      }

      trends[period].totalInvoices++;
      trends[period].totalSales += parseFloat(invoice.total);
      trends[period].totalTax += parseFloat(invoice.taxAmount);
    });

    const trendData = Object.values(trends);

    // Calculate growth rates
    for (let i = 1; i < trendData.length; i++) {
      const current = trendData[i].totalSales;
      const previous = trendData[i - 1].totalSales;
      trendData[i].growthRate = previous > 0 ? ((current - previous) / previous * 100) : 0;
    }

    return {
      report: 'Sales Trends',
      period: { startDate, endDate },
      groupBy,
      generated: new Date(),
      data: trendData,
      summary: {
        totalPeriods: trendData.length,
        totalSales: trendData.reduce((sum, t) => sum + t.totalSales, 0),
        averageSalesPerPeriod: trendData.length > 0 ? trendData.reduce((sum, t) => sum + t.totalSales, 0) / trendData.length : 0,
        highestPeriod: trendData.length > 0 ? trendData.reduce((max, t) => t.totalSales > max.totalSales ? t : max, trendData[0]) : null
      }
    };
  } catch (error) {
    logger.error('Error generating sales trends:', error);
    throw new ApiError(500, 'Failed to generate sales trends', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Sales Returns Report
 */
export const getSalesReturns = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const returns = await prisma.salesReturn.findMany({
      where: {
        companyId,
        returnDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED'] }
      },
      include: {
        customer: {
          select: {
            customerNumber: true,
            name: true,
            email: true
          }
        },
        invoice: {
          select: {
            invoiceNumber: true,
            invoiceDate: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                sku: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { returnDate: 'desc' }
    });

    const totalReturns = returns.reduce((sum, ret) => sum + parseFloat(ret.total), 0);
    const totalQuantity = returns.reduce((sum, ret) => {
      return sum + ret.items.reduce((itemSum, item) => itemSum + parseFloat(item.quantity), 0);
    }, 0);

    return {
      report: 'Sales Returns',
      period: { startDate, endDate },
      generated: new Date(),
      data: returns,
      summary: {
        totalReturns: returns.length,
        totalReturnValue: totalReturns,
        totalQuantityReturned: totalQuantity,
        averageReturnValue: returns.length > 0 ? totalReturns / returns.length : 0
      }
    };
  } catch (error) {
    logger.error('Error generating sales returns:', error);
    throw new ApiError(500, 'Failed to generate sales returns', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Sales Tax Report
 */
export const getSalesTax = async (companyId, filters = {}) => {
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
                sku: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Group by tax rate
    const taxBreakdown = {};
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const taxRate = parseFloat(item.taxRate);
        const taxAmount = parseFloat(item.amount) * (taxRate / 100);

        if (!taxBreakdown[taxRate]) {
          taxBreakdown[taxRate] = {
            taxRate,
            taxableAmount: 0,
            taxAmount: 0,
            transactionCount: 0
          };
        }

        taxBreakdown[taxRate].taxableAmount += parseFloat(item.amount);
        taxBreakdown[taxRate].taxAmount += taxAmount;
        taxBreakdown[taxRate].transactionCount++;
      });
    });

    const taxSummary = Object.values(taxBreakdown);
    const totalTaxCollected = taxSummary.reduce((sum, t) => sum + t.taxAmount, 0);
    const totalTaxableAmount = taxSummary.reduce((sum, t) => sum + t.taxableAmount, 0);

    return {
      report: 'Sales Tax Report',
      period: { startDate, endDate },
      generated: new Date(),
      data: {
        taxBreakdown: taxSummary,
        invoices: invoices.map(inv => ({
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          subtotal: parseFloat(inv.subtotal),
          taxAmount: parseFloat(inv.taxAmount),
          total: parseFloat(inv.total)
        }))
      },
      summary: {
        totalInvoices: invoices.length,
        totalTaxableAmount,
        totalTaxCollected,
        effectiveTaxRate: totalTaxableAmount > 0 ? (totalTaxCollected / totalTaxableAmount * 100) : 0
      }
    };
  } catch (error) {
    logger.error('Error generating sales tax report:', error);
    throw new ApiError(500, 'Failed to generate sales tax report', ERROR_CODES.INTERNAL_ERROR);
  }
};
