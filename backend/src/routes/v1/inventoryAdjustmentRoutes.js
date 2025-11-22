// Inventory Adjustment Routes
import express from 'express';
import * as inventoryAdjustmentController from '../../controllers/inventoryAdjustmentController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all inventory adjustment routes
router.use(authenticate);

// GET /api/v1/inventory-adjustments - Get all inventory adjustments
router.get('/', inventoryAdjustmentController.getInventoryAdjustments);

// GET /api/v1/inventory-adjustments/:id - Get inventory adjustment by ID
router.get('/:id', inventoryAdjustmentController.getInventoryAdjustmentById);

// POST /api/v1/inventory-adjustments - Create inventory adjustment
router.post('/', inventoryAdjustmentController.createInventoryAdjustment);

// PUT /api/v1/inventory-adjustments/:id - Update inventory adjustment
router.put('/:id', inventoryAdjustmentController.updateInventoryAdjustment);

// DELETE /api/v1/inventory-adjustments/:id - Delete inventory adjustment
router.delete('/:id', inventoryAdjustmentController.deleteInventoryAdjustment);

export default router;
