/**
 * Invoice Routes
 * All invoice-related endpoints
 */

import express from 'express';
import * as invoiceController from '../../controllers/invoiceController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/invoices
 * @desc    Create new invoice
 * @access  Private
 */
router.post('/invoices', invoiceController.createInvoice);

/**
 * @route   GET /api/v1/invoices
 * @desc    Get all invoices with filters
 * @access  Private
 */
router.get('/invoices', invoiceController.getInvoices);

/**
 * @route   GET /api/v1/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get('/invoices/:id', invoiceController.getInvoiceById);

/**
 * @route   PUT /api/v1/invoices/:id
 * @desc    Update invoice
 * @access  Private
 */
router.put('/invoices/:id', invoiceController.updateInvoice);

/**
 * @route   DELETE /api/v1/invoices/:id
 * @desc    Delete invoice
 * @access  Private
 */
router.delete('/invoices/:id', invoiceController.deleteInvoice);

export default router;
