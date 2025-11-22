// Contra Voucher Controller
// Manages contra vouchers (bank to cash or cash to bank transfers)

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get all contra vouchers for a company
export const getContraVouchers = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const where = {
      companyId,
      description: {
        contains: 'CONTRA',
        mode: 'insensitive'
      }
    };

    if (startDate && endDate) {
      where.entryDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [vouchers, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: {
              account: {
                select: {
                  id: true,
                  accountName: true,
                  accountNumber: true,
                  accountType: true
                }
              }
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { entryDate: 'desc' }
      }),
      prisma.journalEntry.count({ where })
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
    console.error('Error fetching contra vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contra vouchers',
      error: error.message
    });
  }
};

// Get contra voucher by ID
export const getContraVoucherById = async (req, res) => {
  try {
    const { id } = req.params;

    const voucher = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            account: true
          }
        },
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
        message: 'Contra voucher not found'
      });
    }

    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    console.error('Error fetching contra voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contra voucher',
      error: error.message
    });
  }
};

// Create contra voucher
export const createContraVoucher = async (req, res) => {
  try {
    const {
      companyId,
      fromAccountId,
      toAccountId,
      amount,
      referenceNumber,
      entryDate,
      notes
    } = req.body;

    // Generate entry number
    const latestEntry = await prisma.journalEntry.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { entryNumber: true }
    });

    const entryNumber = latestEntry
      ? `JE-${parseInt(latestEntry.entryNumber.split('-')[1] || '0') + 1}`
      : 'JE-1';

    const amountValue = parseFloat(amount);

    const voucher = await prisma.journalEntry.create({
      data: {
        companyId,
        entryNumber,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        entryType: 'MANUAL',
        referenceNumber: referenceNumber || `CONTRA-${Date.now()}`,
        description: `CONTRA: ${notes || 'Bank/Cash Transfer'}`,
        totalDebit: amountValue,
        totalCredit: amountValue,
        isPosted: true,
        postedAt: new Date(),
        lines: {
          create: [
            {
              accountId: fromAccountId,
              debit: 0,
              credit: amountValue,
              description: 'Contra transfer - credit'
            },
            {
              accountId: toAccountId,
              debit: amountValue,
              credit: 0,
              description: 'Contra transfer - debit'
            }
          ]
        }
      },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: voucher,
      message: 'Contra voucher created successfully'
    });
  } catch (error) {
    console.error('Error creating contra voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contra voucher',
      error: error.message
    });
  }
};
