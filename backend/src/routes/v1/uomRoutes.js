// UOM Routes
import express from 'express';
import * as uomController from '../../controllers/uomController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all UOM routes
router.use(authenticate);

// GET /api/v1/uoms - Get all UOMs
router.get('/', uomController.getAllUOMs);

// GET /api/v1/uoms/category/:category - Get UOMs by category
router.get('/category/:category', uomController.getUOMsByCategory);

// GET /api/v1/uoms/:code - Get UOM by code
router.get('/:code', uomController.getUOMByCode);

export default router;
