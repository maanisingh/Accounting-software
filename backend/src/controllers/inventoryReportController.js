/**
 * Inventory Report Controller
 * Handles HTTP requests for inventory reports
 */

import * as inventoryReportService from '../services/inventoryReportService.js';
import ApiError from '../utils/ApiError.js';
import logger from '../config/logger.js';

/**
 * Get Inventory Summary
 * @route GET /api/v1/reports/inventory-summary
 */
export const getInventorySummary = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      warehouseId: req.query.warehouseId
    };

    const report = await inventoryReportService.getInventorySummary(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getInventorySummary controller:', error);
    next(error);
  }
};

/**
 * Get Inventory Valuation
 * @route GET /api/v1/reports/inventory-valuation
 */
export const getInventoryValuation = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      warehouseId: req.query.warehouseId,
      method: req.query.method
    };

    const report = await inventoryReportService.getInventoryValuation(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getInventoryValuation controller:', error);
    next(error);
  }
};

/**
 * Get Inventory Movement
 * @route GET /api/v1/reports/inventory-movement
 */
export const getInventoryMovement = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      productId: req.query.productId,
      warehouseId: req.query.warehouseId,
      movementType: req.query.movementType,
      page: req.query.page,
      limit: req.query.limit
    };

    const report = await inventoryReportService.getInventoryMovement(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getInventoryMovement controller:', error);
    next(error);
  }
};

/**
 * Get Inventory Aging
 * @route GET /api/v1/reports/inventory-aging
 */
export const getInventoryAging = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {};

    const report = await inventoryReportService.getInventoryAging(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getInventoryAging controller:', error);
    next(error);
  }
};

/**
 * Get Low Stock Items
 * @route GET /api/v1/reports/inventory-low-stock
 */
export const getLowStock = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {};

    const report = await inventoryReportService.getLowStock(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getLowStock controller:', error);
    next(error);
  }
};

/**
 * Get Reorder Report
 * @route GET /api/v1/reports/inventory-reorder
 */
export const getReorderReport = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {};

    const report = await inventoryReportService.getReorderReport(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getReorderReport controller:', error);
    next(error);
  }
};

/**
 * Get Stock by Warehouse
 * @route GET /api/v1/reports/inventory-warehouse
 */
export const getStockByWarehouse = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {};

    const report = await inventoryReportService.getStockByWarehouse(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getStockByWarehouse controller:', error);
    next(error);
  }
};

/**
 * Get Dead/Slow-Moving Stock
 * @route GET /api/v1/reports/inventory-dead
 */
export const getDeadStock = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const filters = {
      daysThreshold: req.query.daysThreshold,
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await inventoryReportService.getDeadStock(companyId, filters);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in getDeadStock controller:', error);
    next(error);
  }
};
