/**
 * Category Service
 * Business logic for category management operations
 */

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * Create a new category
 * @param {Object} categoryData - Category data
 * @param {string} userId - ID of user creating the category
 * @returns {Promise<Object>} Created category
 */
export const createCategory = async (categoryData, userId) => {
  const { companyId, name, description, parentId } = categoryData;

  // Check if category name already exists at the same level for this company
  const existingCategory = await prisma.category.findFirst({
    where: {
      companyId,
      name: {
        equals: name,
        mode: 'insensitive'
      },
      parentId: parentId || null
    }
  });

  if (existingCategory) {
    throw ApiError.conflict('Category with this name already exists at this level', ERROR_CODES.DB_DUPLICATE_ENTRY);
  }

  // Verify parent category exists if provided
  if (parentId) {
    const parentCategory = await prisma.category.findFirst({
      where: { id: parentId, companyId }
    });

    if (!parentCategory) {
      throw ApiError.notFound('Parent category not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }
  }

  // Create category
  const category = await prisma.category.create({
    data: {
      companyId,
      name,
      description: description || null,
      parentId: parentId || null
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  logger.info(`Category created: ${category.name} by ${userId}`);

  return category;
};

/**
 * Get all categories for a company (tree structure)
 * @param {string} companyId - Company ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of categories in tree structure
 */
export const getCategories = async (companyId, filters = {}) => {
  const { isActive, search, flat } = filters;

  const where = { companyId };

  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      parent: {
        select: {
          id: true,
          name: true
        }
      },
      children: {
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true
        }
      },
      _count: {
        select: {
          products: true,
          children: true
        }
      }
    }
  });

  // If flat list is requested, return as is
  if (flat === 'true' || flat === true) {
    return categories;
  }

  // Build tree structure
  const categoryMap = new Map();
  const rootCategories = [];

  // First pass: create map
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: build tree
  categories.forEach(category => {
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children.push(categoryMap.get(category.id));
      }
    } else {
      rootCategories.push(categoryMap.get(category.id));
    }
  });

  return rootCategories;
};

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Category details
 */
export const getCategoryById = async (categoryId, companyId) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, companyId },
    include: {
      parent: {
        select: {
          id: true,
          name: true
        }
      },
      children: {
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true
        }
      },
      _count: {
        select: {
          products: true,
          children: true
        }
      }
    }
  });

  if (!category) {
    throw ApiError.notFound('Category not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  return category;
};

/**
 * Update category
 * @param {string} categoryId - Category ID
 * @param {string} companyId - Company ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of user performing update
 * @returns {Promise<Object>} Updated category
 */
export const updateCategory = async (categoryId, companyId, updateData, userId) => {
  // Check if category exists
  const existingCategory = await prisma.category.findFirst({
    where: { id: categoryId, companyId }
  });

  if (!existingCategory) {
    throw ApiError.notFound('Category not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // If name or parent is being updated, check for duplicates
  if (updateData.name || updateData.parentId !== undefined) {
    const nameToCheck = updateData.name || existingCategory.name;
    const parentToCheck = updateData.parentId !== undefined ? updateData.parentId : existingCategory.parentId;

    const nameExists = await prisma.category.findFirst({
      where: {
        companyId,
        name: {
          equals: nameToCheck,
          mode: 'insensitive'
        },
        parentId: parentToCheck || null,
        id: { not: categoryId }
      }
    });

    if (nameExists) {
      throw ApiError.conflict('Category with this name already exists at this level', ERROR_CODES.DB_DUPLICATE_ENTRY);
    }
  }

  // Verify parent category exists if being updated
  if (updateData.parentId) {
    // Prevent setting self as parent
    if (updateData.parentId === categoryId) {
      throw ApiError.badRequest('Category cannot be its own parent');
    }

    const parentCategory = await prisma.category.findFirst({
      where: { id: updateData.parentId, companyId }
    });

    if (!parentCategory) {
      throw ApiError.notFound('Parent category not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

    // Prevent circular references
    const isDescendant = await checkIfDescendant(categoryId, updateData.parentId);
    if (isDescendant) {
      throw ApiError.badRequest('Cannot set a descendant category as parent (circular reference)');
    }
  }

  // Update category
  const category = await prisma.category.update({
    where: { id: categoryId },
    data: updateData,
    include: {
      parent: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  logger.info(`Category updated: ${categoryId} by ${userId}`);

  return category;
};

/**
 * Delete category
 * @param {string} categoryId - Category ID
 * @param {string} companyId - Company ID
 * @param {string} userId - ID of user performing deletion
 * @returns {Promise<void>}
 */
export const deleteCategory = async (categoryId, companyId, userId) => {
  // Check if category exists
  const category = await prisma.category.findFirst({
    where: { id: categoryId, companyId },
    include: {
      _count: {
        select: {
          products: true,
          children: true
        }
      }
    }
  });

  if (!category) {
    throw ApiError.notFound('Category not found', ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  // Check if category has child categories
  if (category._count.children > 0) {
    throw ApiError.badRequest(
      `Cannot delete category. It has ${category._count.children} sub-category(ies). Please delete or reassign the sub-categories first.`
    );
  }

  // Check if category is used in any products
  if (category._count.products > 0) {
    throw ApiError.badRequest(
      `Cannot delete category. It is used in ${category._count.products} product(s). Please remove the category from all products first or deactivate the category.`
    );
  }

  // Delete category
  await prisma.category.delete({
    where: { id: categoryId }
  });

  logger.info(`Category deleted: ${categoryId} by ${userId}`);
};

/**
 * Helper function to check if a category is a descendant of another
 * @param {string} ancestorId - Potential ancestor category ID
 * @param {string} descendantId - Potential descendant category ID
 * @returns {Promise<boolean>} True if descendant
 */
const checkIfDescendant = async (ancestorId, descendantId) => {
  let currentId = descendantId;

  while (currentId) {
    const category = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    });

    if (!category || !category.parentId) {
      return false;
    }

    if (category.parentId === ancestorId) {
      return true;
    }

    currentId = category.parentId;
  }

  return false;
};

export default {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
