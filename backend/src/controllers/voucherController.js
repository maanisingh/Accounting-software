// Voucher Controller
// Manages accounting vouchers (Journal Entries categorized by type)

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Helper function to map voucher types to journal entry types
const getEntryTypeForVoucher = (voucherType) => {
  const typeMap = {
    'INCOME': ['INCOME', 'REVENUE', 'RECEIPT'],
    'EXPENSE': ['EXPENSE', 'PAYMENT'],
    'CONTRA': ['CONTRA', 'TRANSFER'],
    'PAYMENT': ['PAYMENT', 'EXPENSE'],
    'RECEIPT': ['RECEIPT', 'INCOME'],
    'JOURNAL': ['JOURNAL', 'MANUAL', 'ADJUSTMENT']
  };

  return typeMap[voucherType] || [voucherType];
};

// Get all vouchers (uses companyId from auth token)
export const getVouchers = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const { type, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = { companyId };

    // Filter by voucher type if provided
    if (type) {
      const entryTypes = getEntryTypeForVoucher(type);
      where.entryType = {
        in: entryTypes
      };
    }

    // Filter by posting status
    if (status === 'POSTED') {
      where.isPosted = true;
    } else if (status === 'DRAFT') {
      where.isPosted = false;
    }

    // Filter by date range
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
                  accountNumber: true,
                  accountName: true,
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
      }
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vouchers',
      error: error.message
    });
  }
};

// Get all vouchers for a company
export const getVouchersByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { type, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = { companyId };

    if (type) {
      const entryTypes = getEntryTypeForVoucher(type);
      where.entryType = {
        in: entryTypes
      };
    }

    if (status === 'POSTED') {
      where.isPosted = true;
    } else if (status === 'DRAFT') {
      where.isPosted = false;
    }

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
              account: true
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
      }
    });
  } catch (error) {
    console.error('Error fetching company vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company vouchers',
      error: error.message
    });
  }
};

// Get single voucher by ID
export const getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const voucher = await prisma.journalEntry.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    console.error('Error fetching voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voucher',
      error: error.message
    });
  }
};

// Create new voucher
export const createVoucher = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { entryType, entryDate, description, lines } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Validate double-entry: debits must equal credits
    const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Double-entry validation failed: Debits ($${totalDebit.toFixed(2)}) must equal Credits ($${totalCredit.toFixed(2)})`
      });
    }

    // Generate entry number
    const lastEntry = await prisma.journalEntry.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { entryNumber: true }
    });

    const lastNumber = lastEntry ? parseInt(lastEntry.entryNumber.replace(/\D/g, '')) : 0;
    const entryNumber = `JE${(lastNumber + 1).toString().padStart(6, '0')}`;

    // Create voucher
    const voucher = await prisma.journalEntry.create({
      data: {
        companyId,
        entryNumber,
        entryType: entryType || 'MANUAL',
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        description,
        totalDebit,
        totalCredit,
        lines: {
          create: lines.map(line => ({
            accountId: line.accountId,
            debit: parseFloat(line.debit || 0),
            credit: parseFloat(line.credit || 0),
            description: line.description || description
          }))
        },
        createdBy: req.user?.id
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
      message: 'Voucher created successfully',
      data: voucher
    });
  } catch (error) {
    console.error('Error creating voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create voucher',
      error: error.message
    });
  }
};

// Update voucher (only if not posted)
export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const { entryType, entryDate, description, lines } = req.body;

    // Check if voucher exists and is not posted
    const existingVoucher = await prisma.journalEntry.findFirst({
      where: { id, companyId }
    });

    if (!existingVoucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    if (existingVoucher.isPosted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update posted voucher'
      });
    }

    // Validate double-entry
    if (lines) {
      const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
      const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Double-entry validation failed: Debits ($${totalDebit.toFixed(2)}) must equal Credits ($${totalCredit.toFixed(2)})`
        });
      }
    }

    // Update voucher
    const voucher = await prisma.journalEntry.update({
      where: { id },
      data: {
        entryType,
        entryDate: entryDate ? new Date(entryDate) : undefined,
        description,
        totalDebit: lines ? lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0) : undefined,
        totalCredit: lines ? lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0) : undefined,
        lines: lines ? {
          deleteMany: {},
          create: lines.map(line => ({
            accountId: line.accountId,
            debit: parseFloat(line.debit || 0),
            credit: parseFloat(line.credit || 0),
            description: line.description || description
          }))
        } : undefined
      },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Voucher updated successfully',
      data: voucher
    });
  } catch (error) {
    console.error('Error updating voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update voucher',
      error: error.message
    });
  }
};

// Post voucher (make it permanent)
export const postVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const voucher = await prisma.journalEntry.findFirst({
      where: { id, companyId }
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    if (voucher.isPosted) {
      return res.status(400).json({
        success: false,
        message: 'Voucher already posted'
      });
    }

    const updatedVoucher = await prisma.journalEntry.update({
      where: { id },
      data: {
        isPosted: true,
        postedAt: new Date()
      },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Voucher posted successfully',
      data: updatedVoucher
    });
  } catch (error) {
    console.error('Error posting voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post voucher',
      error: error.message
    });
  }
};

// Delete voucher (only if not posted)
export const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const voucher = await prisma.journalEntry.findFirst({
      where: { id, companyId }
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    if (voucher.isPosted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete posted voucher'
      });
    }

    await prisma.journalEntry.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Voucher deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete voucher',
      error: error.message
    });
  }
};
