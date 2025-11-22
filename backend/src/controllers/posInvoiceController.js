// POS Invoice Controller
// Manages Point of Sale invoices

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get all POS invoices for a company
export const getPOSInvoices = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const { startDate, endDate, status, page = 1, limit = 50 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const where = {
      companyId,
      invoiceType: 'POS' // POS specific invoices
    };

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.invoiceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
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
        skip,
        take: parseInt(limit),
        orderBy: { invoiceDate: 'desc' }
      }),
      prisma.invoice.count({ where })
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      count: invoices.length
    });
  } catch (error) {
    console.error('Error fetching POS invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch POS invoices',
      error: error.message
    });
  }
};

// Get POS invoice by ID
export const getPOSInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        invoiceType: 'POS'
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'POS invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching POS invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch POS invoice',
      error: error.message
    });
  }
};

// Create POS invoice
export const createPOSInvoice = async (req, res) => {
  try {
    const {
      companyId,
      customerId,
      items,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod,
      paymentStatus,
      notes
    } = req.body;

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        customerId,
        invoiceNumber: `POS-${Date.now()}`,
        invoiceDate: new Date(),
        invoiceType: 'POS',
        subtotal: parseFloat(subtotal),
        taxAmount: parseFloat(taxAmount) || 0,
        discountAmount: parseFloat(discountAmount) || 0,
        totalAmount: parseFloat(totalAmount),
        paymentStatus: paymentStatus || 'PAID',
        status: 'COMPLETED',
        notes,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            taxRate: parseFloat(item.taxRate) || 0,
            taxAmount: parseFloat(item.taxAmount) || 0,
            discountPercent: parseFloat(item.discountPercent) || 0,
            totalAmount: parseFloat(item.totalAmount)
          }))
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Update stock levels for POS sale
    for (const item of items) {
      await prisma.stock.updateMany({
        where: {
          productId: item.productId
        },
        data: {
          quantity: {
            decrement: parseInt(item.quantity)
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'POS invoice created successfully'
    });
  } catch (error) {
    console.error('Error creating POS invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create POS invoice',
      error: error.message
    });
  }
};

// Update POS invoice
export const updatePOSInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: invoice,
      message: 'POS invoice updated successfully'
    });
  } catch (error) {
    console.error('Error updating POS invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update POS invoice',
      error: error.message
    });
  }
};

// Delete POS invoice
export const deletePOSInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.invoice.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'POS invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting POS invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete POS invoice',
      error: error.message
    });
  }
};
