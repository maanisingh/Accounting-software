// Service Routes
import express from 'express';
import * as serviceController from '../../controllers/serviceController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all service routes
router.use(authenticate);

// GET /api/v1/services - Get all services (with query params)
router.get('/', serviceController.getServicesByCompany);

// GET /api/v1/services/company/:id - Get all services for a company
router.get('/company/:id', serviceController.getServicesByCompany);

// GET /api/v1/services/:id - Get service by ID
router.get('/:id', serviceController.getServiceById);

// POST /api/v1/services - Create new service
router.post('/', serviceController.createService);

// PUT /api/v1/services/:id - Update service
router.put('/:id', serviceController.updateService);

// DELETE /api/v1/services/:id - Delete service
router.delete('/:id', serviceController.deleteService);

export default router;
