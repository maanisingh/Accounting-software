/**
 * Purchase Report Controller
 */

import { PrismaClient } from '@prisma/client';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

const prisma = new PrismaClient();

// GET /api/v1/reports/purchases-summary
export const getPurchasesSummary = asyncHandler(async (req, res) => {
  const { companyId, startDate, endDate, page = 1, limit = 50 } = req.query;

  const where = {
    companyId: companyId || req.user.companyId
  };

  if (startDate && endDate) {
    where.orderDate = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: { orderDate: 'desc' }
    }),
    prisma.purchaseOrder.count({ where })
  ]);

  const summary = {
    totalOrders: total,
    totalAmount: orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0),
    totalTax: orders.reduce((sum, order) => sum + (parseFloat(order.taxAmount) || 0), 0)
  };

  ApiResponse.success({
    summary,
    orders,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
  }, 'Purchase summary retrieved successfully').send(res);
});

// GET /api/v1/reports/purchases-detailed
export const getDetailedPurchases = asyncHandler(async (req, res) => {
  const { companyId, startDate, endDate, vendorId, page = 1, limit = 50 } = req.query;

  const where = {
    companyId: companyId || req.user.companyId
  };

  if (vendorId) where.vendorId = vendorId;
  if (startDate && endDate) {
    where.orderDate = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } }
      },
      skip,
      take: parseInt(limit),
      orderBy: { orderDate: 'desc' }
    }),
    prisma.purchaseOrder.count({ where })
  ]);

  ApiResponse.success({
    data: orders,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    count: orders.length
  }, 'Detailed purchase report retrieved successfully').send(res);
});

// Stub implementations for other endpoints
export const getPurchasesByVendor = asyncHandler(async (req, res) => {
  ApiResponse.success({ data: [], message: 'Not implemented yet' }).send(res);
});

export const getPurchasesByProduct = asyncHandler(async (req, res) => {
  ApiResponse.success({ data: [], message: 'Not implemented yet' }).send(res);
});

export const getPendingPurchaseOrders = asyncHandler(async (req, res) => {
  ApiResponse.success({ data: [], message: 'Not implemented yet' }).send(res);
});

export const getPurchaseReturns = asyncHandler(async (req, res) => {
  ApiResponse.success({ data: [], message: 'Not implemented yet' }).send(res);
});

export const getPurchaseTax = asyncHandler(async (req, res) => {
  ApiResponse.success({ data: [], message: 'Not implemented yet' }).send(res);
});

export const getVendorPayments = asyncHandler(async (req, res) => {
  ApiResponse.success({ data: [], message: 'Not implemented yet' }).send(res);
});

export default {
  getPurchasesSummary,
  getDetailedPurchases,
  getPurchasesByVendor,
  getPurchasesByProduct,
  getPendingPurchaseOrders,
  getPurchaseReturns,
  getPurchaseTax,
  getVendorPayments
};
