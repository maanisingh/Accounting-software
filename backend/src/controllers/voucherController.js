// Voucher Controller
// Manages inventory vouchers for stock transactions

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get all vouchers for a company
export const getVouchersByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { type, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = {
      companyId
    };

    if (type) {
      where.type = type; // PURCHASE, SALE, TRANSFER, ADJUSTMENT
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [vouchers, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockMovement.count({ where })
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
    console.error('Error fetching vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vouchers',
      error: error.message
    });
  }
};

// Get voucher by ID
export const getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;

    const voucher = await prisma.stockMovement.findUnique({
      where: { id },
      include: {
        product: true,
        warehouse: true,
        fromWarehouse: true,
        toWarehouse: true,
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
    const {
      companyId,
      productId,
      warehouseId,
      fromWarehouseId,
      toWarehouseId,
      type,
      quantity,
      unitPrice,
      notes
    } = req.body;

    const voucher = await prisma.stockMovement.create({
      data: {
        companyId,
        productId,
        warehouseId: warehouseId || fromWarehouseId,
        fromWarehouseId,
        toWarehouseId,
        type,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice) || 0,
        totalValue: parseFloat(quantity) * (parseFloat(unitPrice) || 0),
        notes,
        referenceNumber: `VCH-${Date.now()}`,
        transactionDate: new Date()
      },
      include: {
        product: true,
        warehouse: true
      }
    });

    // Update stock levels
    if (type === 'PURCHASE' || type === 'ADJUSTMENT') {
      await prisma.stock.upsert({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId: warehouseId || fromWarehouseId
          }
        },
        update: {
          quantity: {
            increment: parseInt(quantity)
          }
        },
        create: {
          productId,
          warehouseId: warehouseId || fromWarehouseId,
          quantity: parseInt(quantity)
        }
      });
    }

    res.status(201).json({
      success: true,
      data: voucher,
      message: 'Voucher created successfully'
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

// Update voucher
export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const voucher = await prisma.stockMovement.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
        warehouse: true
      }
    });

    res.json({
      success: true,
      data: voucher,
      message: 'Voucher updated successfully'
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

// Delete voucher
export const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.stockMovement.delete({
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
