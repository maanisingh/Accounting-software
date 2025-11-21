// Tax Class Routes
import express from 'express';
import * as taxClassController from '../../controllers/taxClassController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all tax class routes
router.use(authenticate);

// GET /api/v1/tax-classes - Get all tax classes
router.get('/', taxClassController.getAllTaxClasses);

// GET /api/v1/tax-classes/:id - Get tax class by ID
router.get('/:id', taxClassController.getTaxClassById);

// GET /api/v1/tax-classes/rate/:rate - Get tax classes by rate
router.get('/rate/:rate', taxClassController.getTaxClassesByRate);

export default router;
