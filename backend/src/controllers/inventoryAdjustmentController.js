// Inventory Adjustment Controller
// Manages inventory adjustments (stock corrections, write-offs, etc.)

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get all inventory adjustments for a company
export const getInventoryAdjustments = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const { startDate, endDate, productId, warehouseId, page = 1, limit = 50 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const where = {
      companyId,
      movementType: 'ADJUSTMENT' // Only adjustment type stock movements
    };

    if (productId) {
      where.productId = productId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [adjustments, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unit: true
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { movementDate: 'desc' }
      }),
      prisma.stockMovement.count({ where })
    ]);

    res.json({
      success: true,
      data: adjustments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      count: adjustments.length
    });
  } catch (error) {
    console.error('Error fetching inventory adjustments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory adjustments',
      error: error.message
    });
  }
};

// Get inventory adjustment by ID
export const getInventoryAdjustmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const adjustment = await prisma.stockMovement.findFirst({
      where: {
        id,
        movementType: 'ADJUSTMENT'
      },
      include: {
        product: true,
        warehouse: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Inventory adjustment not found'
      });
    }

    res.json({
      success: true,
      data: adjustment
    });
  } catch (error) {
    console.error('Error fetching inventory adjustment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory adjustment',
      error: error.message
    });
  }
};

// Create inventory adjustment
export const createInventoryAdjustment = async (req, res) => {
  try {
    const {
      companyId,
      productId,
      warehouseId,
      quantity,
      reason,
      notes
    } = req.body;

    const userCompanyId = req.user?.companyId || companyId;

    if (!userCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Validate required fields
    if (!productId || !warehouseId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, warehouse ID, and quantity are required'
      });
    }

    const quantityValue = parseInt(quantity);

    // Create the adjustment as a stock movement
    const adjustment = await prisma.stockMovement.create({
      data: {
        companyId: userCompanyId,
        productId,
        warehouseId,
        movementType: 'ADJUSTMENT',
        quantity: quantityValue,
        unitPrice: 0, // Adjustments don't have price
        totalValue: 0,
        balanceAfter: 0, // Will be updated after stock update
        notes: notes || reason || 'Stock adjustment',
        referenceNumber: `ADJ-${Date.now()}`,
        movementDate: new Date()
      },
      include: {
        product: true,
        warehouse: true
      }
    });

    // Update stock levels
    await prisma.stock.upsert({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId
        }
      },
      update: {
        quantity: {
          increment: quantityValue
        }
      },
      create: {
        productId,
        warehouseId,
        quantity: quantityValue
      }
    });

    res.status(201).json({
      success: true,
      data: adjustment,
      message: 'Inventory adjustment created successfully'
    });
  } catch (error) {
    console.error('Error creating inventory adjustment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory adjustment',
      error: error.message
    });
  }
};

// Update inventory adjustment
export const updateInventoryAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent changing critical fields
    delete updateData.companyId;
    delete updateData.productId;
    delete updateData.warehouseId;
    delete updateData.movementType;

    const adjustment = await prisma.stockMovement.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
        warehouse: true
      }
    });

    res.json({
      success: true,
      data: adjustment,
      message: 'Inventory adjustment updated successfully'
    });
  } catch (error) {
    console.error('Error updating inventory adjustment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory adjustment',
      error: error.message
    });
  }
};

// Delete inventory adjustment
export const deleteInventoryAdjustment = async (req, res) => {
  try {
    const { id } = req.params;

    // Get adjustment details before deletion for stock reversal
    const adjustment = await prisma.stockMovement.findUnique({
      where: { id }
    });

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: 'Inventory adjustment not found'
      });
    }

    // Reverse stock change
    await prisma.stock.updateMany({
      where: {
        productId: adjustment.productId,
        warehouseId: adjustment.warehouseId
      },
      data: {
        quantity: {
          decrement: adjustment.quantity
        }
      }
    });

    // Delete the adjustment
    await prisma.stockMovement.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Inventory adjustment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory adjustment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory adjustment',
      error: error.message
    });
  }
};
