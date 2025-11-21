// Voucher Routes
import express from 'express';
import * as voucherController from '../../controllers/voucherController.js';
import * as incomeVoucherController from '../../controllers/incomeVoucherController.js';
import * as contraVoucherController from '../../controllers/contraVoucherController.js';
import * as posInvoiceController from '../../controllers/posInvoiceController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all voucher routes
router.use(authenticate);

// ==================== INVENTORY VOUCHERS ====================

// GET /api/v1/vouchers/company/:companyId - Get all vouchers
router.get('/company/:companyId', voucherController.getVouchersByCompany);

// GET /api/v1/vouchers/:id - Get voucher by ID
router.get('/:id', voucherController.getVoucherById);

// POST /api/v1/vouchers - Create voucher
router.post('/', voucherController.createVoucher);

// PUT /api/v1/vouchers/:id - Update voucher
router.put('/:id', voucherController.updateVoucher);

// DELETE /api/v1/vouchers/:id - Delete voucher
router.delete('/:id', voucherController.deleteVoucher);

// ==================== INCOME VOUCHERS ====================
// Mounted at /v1/income-vouchers in routes/index.js

// GET /api/v1/income-vouchers/company/:id - Get income vouchers
router.get('/company/:id', incomeVoucherController.getIncomeVouchersByCompany);

// GET /api/v1/income-vouchers/:id - Get income voucher by ID
router.get('/:id', incomeVoucherController.getIncomeVoucherById);

// POST /api/v1/income-vouchers - Create income voucher
router.post('/', incomeVoucherController.createIncomeVoucher);

// ==================== CONTRA VOUCHERS ====================
// Mounted at /v1/contra-vouchers in routes/index.js

// GET /api/v1/contra-vouchers - Get contra vouchers
router.get('/', contraVoucherController.getContraVouchers);

// GET /api/v1/contra-vouchers/:id - Get contra voucher by ID
router.get('/:id', contraVoucherController.getContraVoucherById);

// POST /api/v1/contra-vouchers - Create contra voucher
router.post('/', contraVoucherController.createContraVoucher);

// ==================== POS INVOICES ====================
// Mounted at /v1/pos-invoices in routes/index.js

// GET /api/v1/pos-invoices - Get POS invoices
router.get('/', posInvoiceController.getPOSInvoices);

// GET /api/v1/pos-invoices/:id - Get POS invoice by ID
router.get('/:id', posInvoiceController.getPOSInvoiceById);

// POST /api/v1/pos-invoices - Create POS invoice
router.post('/', posInvoiceController.createPOSInvoice);

// PUT /api/v1/pos-invoices/:id - Update POS invoice
router.put('/:id', posInvoiceController.updatePOSInvoice);

// DELETE /api/v1/pos-invoices/:id - Delete POS invoice
router.delete('/:id', posInvoiceController.deletePOSInvoice);

export default router;
