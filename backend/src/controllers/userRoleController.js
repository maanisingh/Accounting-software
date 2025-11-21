// User Role Controller
// Manages user roles and role information

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Role definitions with permissions
const ROLE_DEFINITIONS = [
  {
    role: 'SUPERADMIN',
    name: 'Super Administrator',
    description: 'Full system access across all companies',
    level: 1,
    permissions: ['*'] // All permissions
  },
  {
    role: 'COMPANY_ADMIN',
    name: 'Company Administrator',
    description: 'Full access to company data and settings',
    level: 2,
    permissions: ['accounts', 'inventory', 'sales', 'purchases', 'reports', 'settings', 'users']
  },
  {
    role: 'ACCOUNTANT',
    name: 'Accountant',
    description: 'Access to accounting and financial modules',
    level: 3,
    permissions: ['accounts', 'reports', 'payments', 'journal_entries']
  },
  {
    role: 'MANAGER',
    name: 'Manager',
    description: 'Access to inventory, sales, and purchase modules',
    level: 3,
    permissions: ['inventory', 'sales', 'purchases', 'reports']
  },
  {
    role: 'SALES_USER',
    name: 'Sales User',
    description: 'Access to sales module only',
    level: 4,
    permissions: ['sales', 'customers', 'sales_reports']
  },
  {
    role: 'PURCHASE_USER',
    name: 'Purchase User',
    description: 'Access to purchase module only',
    level: 4,
    permissions: ['purchases', 'vendors', 'purchase_reports']
  },
  {
    role: 'INVENTORY_USER',
    name: 'Inventory User',
    description: 'Access to inventory module only',
    level: 4,
    permissions: ['inventory', 'stock', 'products', 'warehouses']
  },
  {
    role: 'VIEWER',
    name: 'Viewer',
    description: 'Read-only access to reports',
    level: 5,
    permissions: ['reports_view']
  }
];

// Get all user roles
export const getAllRoles = async (req, res) => {
  try {
    const { company_id } = req.query;

    // If company_id is provided, also return users count for each role
    if (company_id) {
      const userCounts = await prisma.user.groupBy({
        by: ['role'],
        where: { companyId: company_id },
        _count: true
      });

      const rolesWithCounts = ROLE_DEFINITIONS.map(role => ({
        ...role,
        usersCount: userCounts.find(uc => uc.role === role.role)?._count || 0
      }));

      return res.json({
        success: true,
        data: rolesWithCounts,
        count: rolesWithCounts.length
      });
    }

    res.json({
      success: true,
      data: ROLE_DEFINITIONS,
      count: ROLE_DEFINITIONS.length
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: error.message
    });
  }
};

// Get role by name
export const getRoleByName = async (req, res) => {
  try {
    const { role } = req.params;
    const roleData = ROLE_DEFINITIONS.find(r => r.role === role.toUpperCase());

    if (!roleData) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Get users with this role
    const { company_id } = req.query;
    if (company_id) {
      const users = await prisma.user.findMany({
        where: {
          companyId: company_id,
          role: role.toUpperCase()
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true
        }
      });

      return res.json({
        success: true,
        data: {
          ...roleData,
          users
        }
      });
    }

    res.json({
      success: true,
      data: roleData
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role',
      error: error.message
    });
  }
};

// Get role permissions
export const getRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const roleData = ROLE_DEFINITIONS.find(r => r.role === role.toUpperCase());

    if (!roleData) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: {
        role: roleData.role,
        name: roleData.name,
        permissions: roleData.permissions
      }
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role permissions',
      error: error.message
    });
  }
};

// Get users by role
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { company_id, status } = req.query;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'company_id is required'
      });
    }

    const where = {
      companyId: company_id,
      role: role.toUpperCase()
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: {
        data: users,
        count: users.length
      }
    });
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users by role',
      error: error.message
    });
  }
};
