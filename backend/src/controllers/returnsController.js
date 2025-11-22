// Returns Controller
// Manages combined view of sales and purchase returns

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get all returns (sales + purchase) for a company
export const getReturns = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const { startDate, endDate, type, page = 1, limit = 50 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.returnDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch sales returns and purchase returns in parallel
    const [salesReturns, purchaseReturns, salesCount, purchaseCount] = await Promise.all([
      type === 'PURCHASE' ? Promise.resolve([]) : prisma.salesReturn.findMany({
        where: {
          companyId,
          ...dateFilter
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          }
        },
        skip: type === 'SALES' ? skip : 0,
        take: type === 'SALES' ? parseInt(limit) : parseInt(limit) / 2,
        orderBy: { returnDate: 'desc' }
      }),
      type === 'SALES' ? Promise.resolve([]) : prisma.purchaseReturn.findMany({
        where: {
          companyId,
          ...dateFilter
        },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          }
        },
        skip: type === 'PURCHASE' ? skip : 0,
        take: type === 'PURCHASE' ? parseInt(limit) : parseInt(limit) / 2,
        orderBy: { returnDate: 'desc' }
      }),
      type === 'PURCHASE' ? Promise.resolve(0) : prisma.salesReturn.count({
        where: { companyId, ...dateFilter }
      }),
      type === 'SALES' ? Promise.resolve(0) : prisma.purchaseReturn.count({
        where: { companyId, ...dateFilter }
      })
    ]);

    // Add type identifier to each return
    const salesReturnsWithType = salesReturns.map(ret => ({
      ...ret,
      returnType: 'SALES'
    }));

    const purchaseReturnsWithType = purchaseReturns.map(ret => ({
      ...ret,
      returnType: 'PURCHASE'
    }));

    // Combine and sort by date
    const allReturns = [...salesReturnsWithType, ...purchaseReturnsWithType]
      .sort((a, b) => new Date(b.returnDate) - new Date(a.returnDate));

    const total = salesCount + purchaseCount;

    res.json({
      success: true,
      data: {
        returns: allReturns,
        salesReturns: salesReturnsWithType,
        purchaseReturns: purchaseReturnsWithType,
        summary: {
          totalReturns: allReturns.length,
          salesReturnsCount: salesReturns.length,
          purchaseReturnsCount: purchaseReturns.length,
          totalSalesReturnValue: salesReturns.reduce((sum, ret) => sum + (ret.totalAmount || 0), 0),
          totalPurchaseReturnValue: purchaseReturns.reduce((sum, ret) => sum + (ret.totalAmount || 0), 0)
        }
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      count: allReturns.length
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch returns',
      error: error.message
    });
  }
};

// Get sales returns only
export const getSalesReturns = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const { startDate, endDate, customerId, page = 1, limit = 50 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const where = { companyId };

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate && endDate) {
      where.returnDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [returns, total] = await Promise.all([
      prisma.salesReturn.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { returnDate: 'desc' }
      }),
      prisma.salesReturn.count({ where })
    ]);

    res.json({
      success: true,
      data: returns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      count: returns.length
    });
  } catch (error) {
    console.error('Error fetching sales returns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales returns',
      error: error.message
    });
  }
};

// Get purchase returns only
export const getPurchaseReturns = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const { startDate, endDate, vendorId, page = 1, limit = 50 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const where = { companyId };

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (startDate && endDate) {
      where.returnDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [returns, total] = await Promise.all([
      prisma.purchaseReturn.findMany({
        where,
        include: {
          vendor: true,
          items: {
            include: {
              product: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { returnDate: 'desc' }
      }),
      prisma.purchaseReturn.count({ where })
    ]);

    res.json({
      success: true,
      data: returns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      count: returns.length
    });
  } catch (error) {
    console.error('Error fetching purchase returns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase returns',
      error: error.message
    });
  }
};
