const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get admin dashboard statistics
 * Aggregates data from multiple tables to show admin overview
 */
const getAdminDashboard = async (req, res) => {
  try {
    const userRole = req.user?.role;

    // Only SUPERADMIN can access admin dashboard
    if (userRole !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admins can access admin dashboard.'
      });
    }

    // Get total companies count
    const totalCompanies = await prisma.company.count({
      where: {
        deletedAt: null
      }
    });

    // Get total users/requests count (all users across all companies)
    const totalRequests = await prisma.user.count({
      where: {
        deletedAt: null
      }
    });

    // Get total revenue from invoices across all companies
    const invoiceRevenue = await prisma.invoice.aggregate({
      _sum: {
        totalAmount: true
      },
      where: {
        deletedAt: null,
        status: 'COMPLETED'
      }
    });

    const totalRevenue = invoiceRevenue._sum.totalAmount || 0;

    // Get new signups today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newSignups = await prisma.company.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        deletedAt: null
      }
    });

    // Get monthly growth data (companies created per month)
    const currentYear = new Date().getFullYear();
    const growthData = await prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM "createdAt")::integer as month,
        COUNT(*)::integer as count
      FROM "Company"
      WHERE EXTRACT(YEAR FROM "createdAt") = ${currentYear}
        AND "deletedAt" IS NULL
      GROUP BY EXTRACT(MONTH FROM "createdAt")
      ORDER BY month
    `;

    // Get signup companies per month (same as growth for now)
    const signupCompanies = growthData;

    // Get revenue trends per month (from invoices)
    const revenueTrends = await prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM "createdAt")::integer as month,
        SUM("totalAmount")::decimal as revenue
      FROM "Invoice"
      WHERE EXTRACT(YEAR FROM "createdAt") = ${currentYear}
        AND "deletedAt" IS NULL
        AND status = 'COMPLETED'
      GROUP BY EXTRACT(MONTH FROM "createdAt")
      ORDER BY month
    `;

    // Format response
    const dashboardData = {
      total_companies: totalCompanies,
      total_requests: totalRequests,
      total_revenue: parseFloat(totalRevenue),
      new_signups: newSignups,
      growth: growthData.map(item => ({
        month: item.month,
        count: item.count
      })),
      signupCompanies: signupCompanies.map(item => ({
        month: item.month,
        count: item.count
      })),
      revenueTrends: revenueTrends.map(item => ({
        month: item.month,
        revenue: parseFloat(item.revenue) || 0
      }))
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard data',
      error: error.message
    });
  }
};

/**
 * Get company-specific dashboard statistics
 * Shows data for a specific company
 */
const getCompanyDashboard = async (req, res) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID not found in user context'
      });
    }

    // Get total revenue from invoices
    const invoiceRevenue = await prisma.invoice.aggregate({
      _sum: {
        totalAmount: true
      },
      where: {
        companyId,
        deletedAt: null,
        status: 'COMPLETED'
      }
    });

    // Get total expenses from bills
    const billExpenses = await prisma.bill.aggregate({
      _sum: {
        totalAmount: true
      },
      where: {
        companyId,
        deletedAt: null,
        status: 'COMPLETED'
      }
    });

    // Get total customers
    const totalCustomers = await prisma.customer.count({
      where: {
        companyId,
        deletedAt: null
      }
    });

    // Get total vendors
    const totalVendors = await prisma.vendor.count({
      where: {
        companyId,
        deletedAt: null
      }
    });

    // Get total products
    const totalProducts = await prisma.product.count({
      where: {
        companyId,
        deletedAt: null
      }
    });

    // Get monthly revenue trends
    const currentYear = new Date().getFullYear();
    const revenueTrends = await prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM "createdAt")::integer as month,
        SUM("totalAmount")::decimal as revenue
      FROM "Invoice"
      WHERE EXTRACT(YEAR FROM "createdAt") = ${currentYear}
        AND "companyId" = ${companyId}
        AND "deletedAt" IS NULL
        AND status = 'COMPLETED'
      GROUP BY EXTRACT(MONTH FROM "createdAt")
      ORDER BY month
    `;

    // Get monthly expense trends
    const expenseTrends = await prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM "createdAt")::integer as month,
        SUM("totalAmount")::decimal as expense
      FROM "Bill"
      WHERE EXTRACT(YEAR FROM "createdAt") = ${currentYear}
        AND "companyId" = ${companyId}
        AND "deletedAt" IS NULL
        AND status = 'COMPLETED'
      GROUP BY EXTRACT(MONTH FROM "createdAt")
      ORDER BY month
    `;

    const dashboardData = {
      total_revenue: parseFloat(invoiceRevenue._sum.totalAmount || 0),
      total_expenses: parseFloat(billExpenses._sum.totalAmount || 0),
      net_profit: parseFloat(invoiceRevenue._sum.totalAmount || 0) - parseFloat(billExpenses._sum.totalAmount || 0),
      total_customers: totalCustomers,
      total_vendors: totalVendors,
      total_products: totalProducts,
      revenueTrends: revenueTrends.map(item => ({
        month: item.month,
        revenue: parseFloat(item.revenue) || 0
      })),
      expenseTrends: expenseTrends.map(item => ({
        month: item.month,
        expense: parseFloat(item.expense) || 0
      }))
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching company dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company dashboard data',
      error: error.message
    });
  }
};

module.exports = {
  getAdminDashboard,
  getCompanyDashboard
};
