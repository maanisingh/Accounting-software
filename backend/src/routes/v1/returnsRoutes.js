// Returns Routes
import express from 'express';
import * as returnsController from '../../controllers/returnsController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/v1/get-returns - Get all returns (sales + purchase combined)
router.get('/', returnsController.getReturns);

// GET /api/v1/get-returns/sales - Get sales returns only
router.get('/sales', returnsController.getSalesReturns);

// GET /api/v1/get-returns/purchase - Get purchase returns only
router.get('/purchase', returnsController.getPurchaseReturns);

export default router;
