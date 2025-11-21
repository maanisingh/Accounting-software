/**
 * Purchase Report Service
 * Business logic for purchase analytics and reports
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
 * Get Purchases Summary
 */
export const getPurchasesSummary = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    // Get bill summary
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
        id: true,
        billNumber: true,
        billDate: true,
        subtotal: true,
        taxAmount: true,
        discountAmount: true,
        total: true,
        paidAmount: true,
        balanceAmount: true,
        paymentStatus: true
      }
    });

    const totalPurchases = bills.reduce((sum, bill) => sum + parseFloat(bill.total), 0);
    const totalTax = bills.reduce((sum, bill) => sum + parseFloat(bill.taxAmount), 0);
    const totalDiscount = bills.reduce((sum, bill) => sum + parseFloat(bill.discountAmount), 0);
    const totalPaid = bills.reduce((sum, bill) => sum + parseFloat(bill.paidAmount), 0);
    const totalOutstanding = bills.reduce((sum, bill) => sum + parseFloat(bill.balanceAmount), 0);

    // Get bills by status
    const statusBreakdown = {
      paid: bills.filter(b => b.paymentStatus === 'PAID').length,
      partial: bills.filter(b => b.paymentStatus === 'PARTIAL').length,
      pending: bills.filter(b => b.paymentStatus === 'PENDING').length,
      overdue: bills.filter(b => b.paymentStatus === 'OVERDUE').length
    };

    return {
      report: 'Purchases Summary',
      period: { startDate, endDate },
      generated: new Date(),
      data: {
        totalBills: bills.length,
        totalPurchases,
        totalTax,
        totalDiscount,
        totalPaid,
        totalOutstanding,
        averageBillValue: bills.length > 0 ? totalPurchases / bills.length : 0
      },
      statusBreakdown
    };
  } catch (error) {
    logger.error('Error generating purchases summary:', error);
    throw new ApiError(500, 'Failed to generate purchases summary', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Detailed Purchases
 */
export const getDetailedPurchases = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where: {
          companyId,
          billDate: {
            gte: startDate,
            lte: endDate
          },
          status: { notIn: ['CANCELLED', 'VOID'] }
        },
        include: {
          vendor: {
            select: {
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
                  sku: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { billDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.bill.count({
        where: {
          companyId,
          billDate: {
            gte: startDate,
            lte: endDate
          },
          status: { notIn: ['CANCELLED', 'VOID'] }
        }
      })
    ]);

    return {
      report: 'Detailed Purchases',
      period: { startDate, endDate },
      generated: new Date(),
      data: bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error generating detailed purchases:', error);
    throw new ApiError(500, 'Failed to generate detailed purchases', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Purchases by Vendor
 */
export const getPurchasesByVendor = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const purchasesByVendor = await prisma.bill.groupBy({
      by: ['vendorId'],
      where: {
        companyId,
        billDate: {
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

    // Get vendor details
    const vendorIds = purchasesByVendor.map(p => p.vendorId);
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: {
        id: true,
        vendorNumber: true,
        name: true,
        email: true,
        phone: true
      }
    });

    const vendorMap = {};
    vendors.forEach(v => {
      vendorMap[v.id] = v;
    });

    const report = purchasesByVendor.map(purchase => ({
      vendor: vendorMap[purchase.vendorId],
      totalBills: purchase._count.id,
      totalPurchases: parseFloat(purchase._sum.total) || 0,
      totalTax: parseFloat(purchase._sum.taxAmount) || 0,
      totalPaid: parseFloat(purchase._sum.paidAmount) || 0,
      totalOutstanding: parseFloat(purchase._sum.balanceAmount) || 0,
      averageBillValue: purchase._count.id > 0 ? (parseFloat(purchase._sum.total) || 0) / purchase._count.id : 0
    }));

    // Sort by total purchases descending
    report.sort((a, b) => b.totalPurchases - a.totalPurchases);

    return {
      report: 'Purchases by Vendor',
      period: { startDate, endDate },
      generated: new Date(),
      data: report,
      summary: {
        totalVendors: report.length,
        totalPurchases: report.reduce((sum, r) => sum + r.totalPurchases, 0),
        totalBills: report.reduce((sum, r) => sum + r.totalBills, 0)
      }
    };
  } catch (error) {
    logger.error('Error generating purchases by vendor:', error);
    throw new ApiError(500, 'Failed to generate purchases by vendor', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Purchases by Product
 */
export const getPurchasesByProduct = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const purchasesByProduct = await prisma.billItem.groupBy({
      by: ['productId'],
      where: {
        bill: {
          companyId,
          billDate: {
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
    const productIds = purchasesByProduct.map(p => p.productId);
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

    const report = purchasesByProduct.map(purchase => ({
      product: productMap[purchase.productId],
      totalQuantity: parseFloat(purchase._sum.quantity) || 0,
      totalAmount: parseFloat(purchase._sum.amount) || 0,
      totalDiscount: parseFloat(purchase._sum.discountAmount) || 0,
      transactionCount: purchase._count.id,
      averagePrice: purchase._count.id > 0 ? (parseFloat(purchase._sum.amount) || 0) / (parseFloat(purchase._sum.quantity) || 1) : 0
    }));

    // Sort by total amount descending
    report.sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      report: 'Purchases by Product',
      period: { startDate, endDate },
      generated: new Date(),
      data: report,
      summary: {
        totalProducts: report.length,
        totalQuantityPurchased: report.reduce((sum, r) => sum + r.totalQuantity, 0),
        totalPurchases: report.reduce((sum, r) => sum + r.totalAmount, 0)
      }
    };
  } catch (error) {
    logger.error('Error generating purchases by product:', error);
    throw new ApiError(500, 'Failed to generate purchases by product', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Pending Purchase Orders
 */
export const getPendingPurchaseOrders = async (companyId, filters = {}) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        companyId,
        status: { in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT'] }
      },
      include: {
        vendor: {
          select: {
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
                sku: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { orderDate: 'desc' }
    });

    const totalPendingValue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

    return {
      report: 'Pending Purchase Orders',
      asOf: new Date(),
      generated: new Date(),
      data: orders,
      summary: {
        totalOrders: orders.length,
        totalPendingValue,
        statusBreakdown: {
          draft: orders.filter(o => o.status === 'DRAFT').length,
          pendingApproval: orders.filter(o => o.status === 'PENDING_APPROVAL').length,
          approved: orders.filter(o => o.status === 'APPROVED').length,
          sent: orders.filter(o => o.status === 'SENT').length
        }
      }
    };
  } catch (error) {
    logger.error('Error generating pending purchase orders:', error);
    throw new ApiError(500, 'Failed to generate pending purchase orders', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Purchase Returns Report
 */
export const getPurchaseReturns = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const returns = await prisma.purchaseReturn.findMany({
      where: {
        companyId,
        returnDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED'] }
      },
      include: {
        vendor: {
          select: {
            vendorNumber: true,
            name: true,
            email: true
          }
        },
        bill: {
          select: {
            billNumber: true,
            billDate: true
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
      report: 'Purchase Returns',
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
    logger.error('Error generating purchase returns:', error);
    throw new ApiError(500, 'Failed to generate purchase returns', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Purchase Tax Report
 */
export const getPurchaseTax = async (companyId, filters = {}) => {
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
    bills.forEach(bill => {
      bill.items.forEach(item => {
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
    const totalTaxPaid = taxSummary.reduce((sum, t) => sum + t.taxAmount, 0);
    const totalTaxableAmount = taxSummary.reduce((sum, t) => sum + t.taxableAmount, 0);

    return {
      report: 'Purchase Tax Report',
      period: { startDate, endDate },
      generated: new Date(),
      data: {
        taxBreakdown: taxSummary,
        bills: bills.map(bill => ({
          billNumber: bill.billNumber,
          billDate: bill.billDate,
          subtotal: parseFloat(bill.subtotal),
          taxAmount: parseFloat(bill.taxAmount),
          total: parseFloat(bill.total)
        }))
      },
      summary: {
        totalBills: bills.length,
        totalTaxableAmount,
        totalTaxPaid,
        effectiveTaxRate: totalTaxableAmount > 0 ? (totalTaxPaid / totalTaxableAmount * 100) : 0
      }
    };
  } catch (error) {
    logger.error('Error generating purchase tax report:', error);
    throw new ApiError(500, 'Failed to generate purchase tax report', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Get Vendor Payments History
 */
export const getVendorPayments = async (companyId, filters = {}) => {
  try {
    const { startDate, endDate } = parsePeriod(filters.period, filters.startDate, filters.endDate);

    const payments = await prisma.payment.findMany({
      where: {
        companyId,
        paymentDate: {
          gte: startDate,
          lte: endDate
        },
        status: { notIn: ['CANCELLED'] }
      },
      include: {
        vendor: {
          select: {
            vendorNumber: true,
            name: true,
            email: true
          }
        },
        bill: {
          select: {
            billNumber: true,
            billDate: true,
            total: true
          }
        },
        account: {
          select: {
            accountNumber: true,
            accountName: true
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    const totalPayments = payments.reduce((sum, pmt) => sum + parseFloat(pmt.amount), 0);

    // Group by payment method
    const methodBreakdown = {};
    payments.forEach(payment => {
      const method = payment.paymentMethod;
      if (!methodBreakdown[method]) {
        methodBreakdown[method] = {
          method,
          count: 0,
          totalAmount: 0
        };
      }
      methodBreakdown[method].count++;
      methodBreakdown[method].totalAmount += parseFloat(payment.amount);
    });

    return {
      report: 'Vendor Payments History',
      period: { startDate, endDate },
      generated: new Date(),
      data: payments,
      summary: {
        totalPayments: payments.length,
        totalAmount: totalPayments,
        averagePaymentAmount: payments.length > 0 ? totalPayments / payments.length : 0,
        methodBreakdown: Object.values(methodBreakdown)
      }
    };
  } catch (error) {
    logger.error('Error generating vendor payments history:', error);
    throw new ApiError(500, 'Failed to generate vendor payments history', ERROR_CODES.INTERNAL_ERROR);
  }
};
