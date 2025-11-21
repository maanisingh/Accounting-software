// User Role Routes
import express from 'express';
import * as userRoleController from '../../controllers/userRoleController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all user role routes
router.use(authenticate);

// GET /api/v1/user-roles - Get all user roles
router.get('/', userRoleController.getAllRoles);

// GET /api/v1/user-roles/:role - Get role by name
router.get('/:role', userRoleController.getRoleByName);

// GET /api/v1/user-roles/:role/permissions - Get role permissions
router.get('/:role/permissions', userRoleController.getRolePermissions);

// GET /api/v1/user-roles/:role/users - Get users by role
router.get('/:role/users', userRoleController.getUsersByRole);

export default router;
