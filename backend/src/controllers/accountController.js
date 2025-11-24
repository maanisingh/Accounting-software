/**
 * Account Controller
 * Handles chart of accounts HTTP requests
 */

import * as accountService from '../services/accountService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @route   POST /api/v1/accounts
 * @desc    Create new account
 * @access  Private
 */
export const createAccount = asyncHandler(async (req, res) => {
  const accountData = {
    ...req.body,
    companyId: req.user.companyId
  };

  const account = await accountService.createAccount(accountData, req.user.id);

  ApiResponse.created(account, 'Account created successfully').send(res);
});

/**
 * @route   GET /api/v1/accounts
 * @desc    Get all accounts
 * @access  Private
 */
export const getAccounts = asyncHandler(async (req, res) => {
  const filters = {
    accountType: req.query.accountType,
    isActive: req.query.isActive,
    parentId: req.query.parentId,
    search: req.query.search
  };

  const accounts = await accountService.getAccounts(req.user.companyId, filters);

  ApiResponse.success(
    { accounts },
    `Retrieved ${accounts.length} accounts`
  ).send(res);
});

/**
 * @route   GET /api/v1/accounts/:id
 * @desc    Get account by ID with balance
 * @access  Private
 */
export const getAccountById = asyncHandler(async (req, res) => {
  const account = await accountService.getAccountById(req.params.id, req.user.companyId);

  // Add field aliases for compatibility
  if (account) {
    account.type = account.accountType;
    account.name = account.accountName;
    account.code = account.accountNumber;
  }

  ApiResponse.success(account, 'Account retrieved successfully').send(res);
});

/**
 * @route   PUT /api/v1/accounts/:id
 * @desc    Update account
 * @access  Private
 */
export const updateAccount = asyncHandler(async (req, res) => {
  const account = await accountService.updateAccount(
    req.params.id,
    req.user.companyId,
    req.body
  );

  ApiResponse.success(account, 'Account updated successfully').send(res);
});

/**
 * @route   DELETE /api/v1/accounts/:id
 * @desc    Delete account (if no transactions)
 * @access  Private
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  await accountService.deleteAccount(req.params.id, req.user.companyId);

  ApiResponse.success(null, 'Account deleted successfully').send(res);
});

/**
 * @route   GET /api/v1/accounts/tree
 * @desc    Get account hierarchy tree
 * @access  Private
 */
export const getAccountTree = asyncHandler(async (req, res) => {
  const tree = await accountService.getAccountTree(req.user.companyId);

  ApiResponse.success(tree, 'Account tree retrieved successfully').send(res);
});

/**
 * @route   POST /api/v1/accounts/:id/activate
 * @desc    Activate/deactivate account
 * @access  Private
 */
export const toggleAccountStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const account = await accountService.toggleAccountStatus(
    req.params.id,
    req.user.companyId,
    isActive
  );

  ApiResponse.success(
    account,
    `Account ${isActive ? 'activated' : 'deactivated'} successfully`
  ).send(res);
});

/**
 * @route   GET /api/v1/accounts/types
 * @desc    Get all account types
 * @access  Private
 */
export const getAccountTypes = asyncHandler(async (req, res) => {
  const types = accountService.getAccountTypes();

  ApiResponse.success(types, 'Account types retrieved successfully').send(res);
});
