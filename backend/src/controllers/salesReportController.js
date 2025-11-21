/**
 * Sales Report Controller
 */

import { PrismaClient } from '@prisma/client';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

const prisma = new PrismaClient();

// GET /api/v1/reports/sales-summary
export const getSalesSummary = asyncHandler(async (req, res) => {
  const { companyId, startDate, endDate } = req.query;

  const where = {
    companyId: companyId || req.user.companyId
  };

  if (startDate && endDate) {
    where.invoiceDate = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } }
    },
    orderBy: { invoiceDate: 'desc' }
  });

  const summary = {
    totalInvoices: invoices.length,
    totalRevenue: invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0),
    totalTax: invoices.reduce((sum, inv) => sum + (parseFloat(inv.taxAmount) || 0), 0)
  };

  ApiResponse.success({ summary, invoices }, 'Sales summary retrieved successfully').send(res);
});

// GET /api/v1/reports/sales-detailed
export const getDetailedSales = asyncHandler(async (req, res) => {
  const { companyId, startDate, endDate, customerId } = req.query;

  const where = {
    companyId: companyId || req.user.companyId
  };

  if (customerId) where.customerId = customerId;
  if (startDate && endDate) {
    where.invoiceDate = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } }
    },
    orderBy: { invoiceDate: 'desc' }
  });

  ApiResponse.success({ data: invoices, count: invoices.length }, 'Detailed sales retrieved').send(res);
});

// Stub implementations for other endpoints
export const getSalesByCustomer = asyncHandler(async (req, res) => {
  ApiResponse.success({ data: [], message: 'Not implemented yet' }).send(res);
});

export const getSalesByProduct = asyncHandler(async (req, res) => {
  ApiResponse.success({ data: [], message: 'Not implemented yet' }).send(res);
});

export const getSalesByDate = asyncHandler(async (req, res) => {
  ApiResponse.success({ data: [], message: 'Not implemented yet' }).send(res);
});

export const getSalesTrends = asyncHandler(async (req, res) => {
  ApiResponse.success({ data: [], message: 'Not implemented yet' }).send(res);
});

export const getSalesReturns = asyncHandler(async (req, res) => {
  ApiResponse.success({ data: [], message: 'Not implemented yet' }).send(res);
});

export const getSalesTax = asyncHandler(async (req, res) => {
  ApiResponse.success({ data: [], message: 'Not implemented yet' }).send(res);
});

export const getPOSSummary = asyncHandler(async (req, res) => {
  const { companyId } = req.query;

  // POS functionality to be implemented
  const summary = {
    totalTransactions: 0,
    totalAmount: 0,
    averageTransaction: 0,
    message: 'POS feature coming soon'
  };

  ApiResponse.success({ summary, transactions: [] }, 'POS summary retrieved successfully').send(res);
});

export default {
  getSalesSummary,
  getDetailedSales,
  getSalesByCustomer,
  getSalesByProduct,
  getSalesByDate,
  getSalesTrends,
  getSalesReturns,
  getSalesTax,
  getPOSSummary
};
