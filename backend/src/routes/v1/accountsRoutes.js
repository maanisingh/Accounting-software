/**
 * Accounts Routes
 * API routes for accounts module - all 28 endpoints
 */

import express from 'express';
import * as accountController from '../../controllers/accountController.js';
import * as journalEntryController from '../../controllers/journalEntryController.js';
import * as paymentController from '../../controllers/paymentController.js';
import * as receiptController from '../../controllers/receiptController.js';

import * as accountValidation from '../../validations/accountValidation.js';
import * as journalEntryValidation from '../../validations/journalEntryValidation.js';
import * as paymentValidation from '../../validations/paymentValidation.js';
import * as receiptValidation from '../../validations/receiptValidation.js';

import { validateBody, validateQuery, validateParams } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all accounts routes
router.use(authenticate);

// ==================== CHART OF ACCOUNTS (8 endpoints) ====================

/**
 * @route   POST /api/v1/accounts
 * @desc    Create account
 * @access  Private
 */
router.post(
  '/accounts',
  validateBody(accountValidation.createAccountSchema),
  accountController.createAccount
);

/**
 * @route   GET /api/v1/accounts
 * @desc    List all accounts
 * @access  Private
 */
router.get(
  '/accounts',
  validateQuery(accountValidation.getAccountsSchema),
  accountController.getAccounts
);

/**
 * @route   GET /api/v1/accounts/tree
 * @desc    Get account hierarchy tree structure
 * @access  Private
 * @note    Must be before /:id to avoid route conflict
 */
router.get(
  '/accounts/tree',
  accountController.getAccountTree
);

/**
 * @route   GET /api/v1/accounts/types
 * @desc    Get all account types
 * @access  Private
 * @note    Must be before /:id to avoid route conflict
 */
router.get(
  '/accounts/types',
  accountController.getAccountTypes
);

/**
 * @route   GET /api/v1/accounts/:id
 * @desc    Get account details with balance
 * @access  Private
 */
router.get(
  '/accounts/:id',
  validateParams(accountValidation.accountIdSchema),
  accountController.getAccountById
);

/**
 * @route   PUT /api/v1/accounts/:id
 * @desc    Update account
 * @access  Private
 */
router.put(
  '/accounts/:id',
  validateParams(accountValidation.accountIdSchema),
  validateBody(accountValidation.updateAccountSchema),
  accountController.updateAccount
);

/**
 * @route   DELETE /api/v1/accounts/:id
 * @desc    Delete account (if no transactions)
 * @access  Private
 */
router.delete(
  '/accounts/:id',
  validateParams(accountValidation.accountIdSchema),
  accountController.deleteAccount
);

/**
 * @route   POST /api/v1/accounts/:id/activate
 * @desc    Activate/deactivate account
 * @access  Private
 */
router.post(
  '/accounts/:id/activate',
  validateParams(accountValidation.accountIdSchema),
  validateBody(accountValidation.toggleAccountStatusSchema),
  accountController.toggleAccountStatus
);

// ==================== JOURNAL ENTRIES (8 endpoints) ====================

/**
 * @route   POST /api/v1/journal-entries
 * @desc    Create journal entry (with lines)
 * @access  Private
 */
router.post(
  '/journal-entries',
  validateBody(journalEntryValidation.createJournalEntrySchema),
  journalEntryController.createJournalEntry
);

/**
 * @route   GET /api/v1/journal-entries
 * @desc    List entries (pagination, filter)
 * @access  Private
 */
router.get(
  '/journal-entries',
  validateQuery(journalEntryValidation.getJournalEntriesSchema),
  journalEntryController.getJournalEntries
);

/**
 * @route   GET /api/v1/journal-entries/pending
 * @desc    Get unposted entries
 * @access  Private
 * @note    Must be before /:id to avoid route conflict
 */
router.get(
  '/journal-entries/pending',
  journalEntryController.getPendingEntries
);

/**
 * @route   GET /api/v1/journal-entries/account/:id
 * @desc    Get entries for specific account
 * @access  Private
 * @note    Must be before /:id to avoid route conflict
 */
router.get(
  '/journal-entries/account/:id',
  validateParams(journalEntryValidation.accountIdParamSchema),
  validateQuery(journalEntryValidation.getEntriesByAccountSchema),
  journalEntryController.getEntriesByAccount
);

/**
 * @route   GET /api/v1/journal-entries/:id
 * @desc    Get entry with lines
 * @access  Private
 */
router.get(
  '/journal-entries/:id',
  validateParams(journalEntryValidation.journalEntryIdSchema),
  journalEntryController.getJournalEntryById
);

/**
 * @route   PUT /api/v1/journal-entries/:id
 * @desc    Update entry (before posting)
 * @access  Private
 */
router.put(
  '/journal-entries/:id',
  validateParams(journalEntryValidation.journalEntryIdSchema),
  validateBody(journalEntryValidation.updateJournalEntrySchema),
  journalEntryController.updateJournalEntry
);

/**
 * @route   DELETE /api/v1/journal-entries/:id
 * @desc    Delete entry (before posting)
 * @access  Private
 */
router.delete(
  '/journal-entries/:id',
  validateParams(journalEntryValidation.journalEntryIdSchema),
  journalEntryController.deleteJournalEntry
);

/**
 * @route   POST /api/v1/journal-entries/:id/post
 * @desc    Post entry (finalize, no edits after)
 * @access  Private
 */
router.post(
  '/journal-entries/:id/post',
  validateParams(journalEntryValidation.journalEntryIdSchema),
  journalEntryController.postJournalEntry
);

// ==================== PAYMENTS (6 endpoints) ====================

/**
 * @route   POST /api/v1/payments
 * @desc    Record payment to vendor
 * @access  Private
 */
router.post(
  '/payments',
  validateBody(paymentValidation.createPaymentSchema),
  paymentController.createPayment
);

/**
 * @route   GET /api/v1/payments
 * @desc    List all payments
 * @access  Private
 */
router.get(
  '/payments',
  validateQuery(paymentValidation.getPaymentsSchema),
  paymentController.getPayments
);

/**
 * @route   GET /api/v1/payments/pending
 * @desc    Get bills pending payment
 * @access  Private
 * @note    Must be before /:id to avoid route conflict
 */
router.get(
  '/payments/pending',
  validateQuery(paymentValidation.getPendingBillsSchema),
  paymentController.getPendingBills
);

/**
 * @route   GET /api/v1/payments/vendor/:id
 * @desc    Get payments by vendor
 * @access  Private
 * @note    Must be before /:id to avoid route conflict
 */
router.get(
  '/payments/vendor/:id',
  validateParams(paymentValidation.vendorIdParamSchema),
  paymentController.getPaymentsByVendor
);

/**
 * @route   GET /api/v1/payments/:id
 * @desc    Get payment details
 * @access  Private
 */
router.get(
  '/payments/:id',
  validateParams(paymentValidation.paymentIdSchema),
  paymentController.getPaymentById
);

/**
 * @route   DELETE /api/v1/payments/:id
 * @desc    Delete payment (reverse journal)
 * @access  Private
 */
router.delete(
  '/payments/:id',
  validateParams(paymentValidation.paymentIdSchema),
  paymentController.deletePayment
);

// ==================== RECEIPTS (6 endpoints) ====================

/**
 * @route   POST /api/v1/receipts
 * @desc    Record receipt from customer
 * @access  Private
 */
router.post(
  '/receipts',
  validateBody(receiptValidation.createReceiptSchema),
  receiptController.createReceipt
);

/**
 * @route   GET /api/v1/receipts
 * @desc    List all receipts
 * @access  Private
 */
router.get(
  '/receipts',
  validateQuery(receiptValidation.getReceiptsSchema),
  receiptController.getReceipts
);

/**
 * @route   GET /api/v1/receipts/pending
 * @desc    Get invoices pending payment
 * @access  Private
 * @note    Must be before /:id to avoid route conflict
 */
router.get(
  '/receipts/pending',
  validateQuery(receiptValidation.getPendingInvoicesSchema),
  receiptController.getPendingInvoices
);

/**
 * @route   GET /api/v1/receipts/customer/:id
 * @desc    Get receipts by customer
 * @access  Private
 * @note    Must be before /:id to avoid route conflict
 */
router.get(
  '/receipts/customer/:id',
  validateParams(receiptValidation.customerIdParamSchema),
  receiptController.getReceiptsByCustomer
);

/**
 * @route   GET /api/v1/receipts/:id
 * @desc    Get receipt details
 * @access  Private
 */
router.get(
  '/receipts/:id',
  validateParams(receiptValidation.receiptIdSchema),
  receiptController.getReceiptById
);

/**
 * @route   DELETE /api/v1/receipts/:id
 * @desc    Delete receipt (reverse journal)
 * @access  Private
 */
router.delete(
  '/receipts/:id',
  validateParams(receiptValidation.receiptIdSchema),
  receiptController.deleteReceipt
);

export default router;
