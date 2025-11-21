// Income Voucher Controller
// Manages income/receipt vouchers

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get all income vouchers for a company
export const getIncomeVouchersByCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, status, page = 1, limit = 50 } = req.query;

    const where = {
      companyId: id,
      type: 'RECEIPT' // Income vouchers are receipts
    };

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.paymentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [vouchers, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              accountNumber: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { paymentDate: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      success: true,
      data: vouchers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      count: vouchers.length
    });
  } catch (error) {
    console.error('Error fetching income vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income vouchers',
      error: error.message
    });
  }
};

// Get income voucher by ID
export const getIncomeVoucherById = async (req, res) => {
  try {
    const { id } = req.params;

    const voucher = await prisma.payment.findFirst({
      where: {
        id,
        type: 'RECEIPT'
      },
      include: {
        account: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Income voucher not found'
      });
    }

    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    console.error('Error fetching income voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income voucher',
      error: error.message
    });
  }
};

// Create income voucher
export const createIncomeVoucher = async (req, res) => {
  try {
    const {
      companyId,
      accountId,
      amount,
      paymentMethod,
      referenceNumber,
      paymentDate,
      notes
    } = req.body;

    const voucher = await prisma.payment.create({
      data: {
        companyId,
        accountId,
        amount: parseFloat(amount),
        type: 'RECEIPT',
        paymentMethod: paymentMethod || 'CASH',
        referenceNumber,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes,
        status: 'PAID'
      },
      include: {
        account: true
      }
    });

    res.status(201).json({
      success: true,
      data: voucher,
      message: 'Income voucher created successfully'
    });
  } catch (error) {
    console.error('Error creating income voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create income voucher',
      error: error.message
    });
  }
};
