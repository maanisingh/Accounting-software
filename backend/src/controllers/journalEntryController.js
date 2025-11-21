/**
 * Journal Entry Controller
 * Handles journal entry HTTP requests
 */

import * as journalEntryService from '../services/journalEntryService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @route   POST /api/v1/journal-entries
 * @desc    Create journal entry
 * @access  Private
 */
export const createJournalEntry = asyncHandler(async (req, res) => {
  const entryData = {
    ...req.body,
    companyId: req.user.companyId
  };

  const entry = await journalEntryService.createJournalEntry(entryData, req.user.id);

  ApiResponse.created(entry, 'Journal entry created successfully').send(res);
});

/**
 * @route   GET /api/v1/journal-entries
 * @desc    Get journal entries with pagination
 * @access  Private
 */
export const getJournalEntries = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    isPosted: req.query.isPosted,
    entryType: req.query.entryType,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    search: req.query.search
  };

  const result = await journalEntryService.getJournalEntries(req.user.companyId, filters);

  ApiResponse.paginated(
    result.entries,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total,
    'Journal entries retrieved successfully'
  ).send(res);
});

/**
 * @route   GET /api/v1/journal-entries/:id
 * @desc    Get journal entry by ID
 * @access  Private
 */
export const getJournalEntryById = asyncHandler(async (req, res) => {
  const entry = await journalEntryService.getJournalEntryById(
    req.params.id,
    req.user.companyId
  );

  ApiResponse.success(entry, 'Journal entry retrieved successfully').send(res);
});

/**
 * @route   PUT /api/v1/journal-entries/:id
 * @desc    Update journal entry (before posting)
 * @access  Private
 */
export const updateJournalEntry = asyncHandler(async (req, res) => {
  const entry = await journalEntryService.updateJournalEntry(
    req.params.id,
    req.user.companyId,
    req.body
  );

  ApiResponse.success(entry, 'Journal entry updated successfully').send(res);
});

/**
 * @route   DELETE /api/v1/journal-entries/:id
 * @desc    Delete journal entry (before posting)
 * @access  Private
 */
export const deleteJournalEntry = asyncHandler(async (req, res) => {
  await journalEntryService.deleteJournalEntry(req.params.id, req.user.companyId);

  ApiResponse.success(null, 'Journal entry deleted successfully').send(res);
});

/**
 * @route   POST /api/v1/journal-entries/:id/post
 * @desc    Post journal entry (finalize)
 * @access  Private
 */
export const postJournalEntry = asyncHandler(async (req, res) => {
  const entry = await journalEntryService.postJournalEntry(
    req.params.id,
    req.user.companyId
  );

  ApiResponse.success(entry, 'Journal entry posted successfully').send(res);
});

/**
 * @route   GET /api/v1/journal-entries/pending
 * @desc    Get unposted entries
 * @access  Private
 */
export const getPendingEntries = asyncHandler(async (req, res) => {
  const entries = await journalEntryService.getPendingEntries(req.user.companyId);

  ApiResponse.success(
    entries,
    `Retrieved ${entries.length} pending entries`
  ).send(res);
});

/**
 * @route   GET /api/v1/journal-entries/account/:id
 * @desc    Get entries for specific account
 * @access  Private
 */
export const getEntriesByAccount = asyncHandler(async (req, res) => {
  const filters = {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    isPosted: req.query.isPosted
  };

  const entries = await journalEntryService.getEntriesByAccount(
    req.params.id,
    req.user.companyId,
    filters
  );

  ApiResponse.success(
    entries,
    `Retrieved ${entries.length} entries for account`
  ).send(res);
});
