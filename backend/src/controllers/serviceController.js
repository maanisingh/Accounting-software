// Service Controller
// Manages service products (ProductType = SERVICE)

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get all services for a company
export const getServicesByCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, search, categoryId, page = 1, limit = 50 } = req.query;

    const where = {
      companyId: id,
      type: 'SERVICE'
    };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sacCode: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [services, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      success: true,
      data: services,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      count: services.length
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
};

// Get service by ID
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.product.findFirst({
      where: {
        id,
        type: 'SERVICE'
      },
      include: {
        category: true,
        brand: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
      error: error.message
    });
  }
};

// Create new service
export const createService = async (req, res) => {
  try {
    const {
      companyId,
      name,
      description,
      sacCode,
      categoryId,
      brandId,
      sellingPrice,
      taxRate,
      unit = 'HR',
      isActive = true
    } = req.body;

    const service = await prisma.product.create({
      data: {
        companyId,
        name,
        description,
        type: 'SERVICE',
        sacCode,
        categoryId,
        brandId,
        unit,
        sellingPrice: parseFloat(sellingPrice) || 0,
        taxRate: parseFloat(taxRate) || 0,
        purchasePrice: 0,
        mrp: parseFloat(sellingPrice) || 0,
        isActive,
        isSaleable: true,
        isPurchasable: false,
        trackInventory: false,
        sku: `SRV-${Date.now()}` // Auto-generate SKU for services
      },
      include: {
        category: true,
        brand: true
      }
    });

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message
    });
  }
};

// Update service
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verify it's a service
    const existing = await prisma.product.findFirst({
      where: { id, type: 'SERVICE' }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const service = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        brand: true
      }
    });

    res.json({
      success: true,
      data: service,
      message: 'Service updated successfully'
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
};

// Delete service
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify it's a service
    const existing = await prisma.product.findFirst({
      where: { id, type: 'SERVICE' }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await prisma.product.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
};
