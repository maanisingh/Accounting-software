// UOM (Unit of Measure) Controller
// Provides standardized units for products

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Predefined standard UOMs
const STANDARD_UOMS = [
  { code: 'PCS', name: 'Pieces', description: 'Individual pieces or units', category: 'COUNT' },
  { code: 'KG', name: 'Kilogram', description: 'Weight in kilograms', category: 'WEIGHT' },
  { code: 'G', name: 'Gram', description: 'Weight in grams', category: 'WEIGHT' },
  { code: 'LTR', name: 'Liter', description: 'Volume in liters', category: 'VOLUME' },
  { code: 'ML', name: 'Milliliter', description: 'Volume in milliliters', category: 'VOLUME' },
  { code: 'M', name: 'Meter', description: 'Length in meters', category: 'LENGTH' },
  { code: 'CM', name: 'Centimeter', description: 'Length in centimeters', category: 'LENGTH' },
  { code: 'BOX', name: 'Box', description: 'Boxed items', category: 'PACKAGING' },
  { code: 'DOZEN', name: 'Dozen', description: '12 pieces', category: 'COUNT' },
  { code: 'SET', name: 'Set', description: 'Set of items', category: 'COUNT' },
  { code: 'ROLL', name: 'Roll', description: 'Rolled items', category: 'PACKAGING' },
  { code: 'PACK', name: 'Pack', description: 'Packaged items', category: 'PACKAGING' },
  { code: 'BAG', name: 'Bag', description: 'Bagged items', category: 'PACKAGING' },
  { code: 'BOTTLE', name: 'Bottle', description: 'Bottled items', category: 'PACKAGING' },
  { code: 'CAN', name: 'Can', description: 'Canned items', category: 'PACKAGING' },
  { code: 'PAIR', name: 'Pair', description: '2 pieces', category: 'COUNT' },
  { code: 'SQM', name: 'Square Meter', description: 'Area in square meters', category: 'AREA' },
  { code: 'SQFT', name: 'Square Feet', description: 'Area in square feet', category: 'AREA' },
  { code: 'TON', name: 'Ton', description: 'Weight in tons', category: 'WEIGHT' },
  { code: 'HR', name: 'Hour', description: 'Time in hours (for services)', category: 'TIME' },
];

// Get all UOMs
export const getAllUOMs = async (req, res) => {
  try {
    res.json({
      success: true,
      data: STANDARD_UOMS,
      count: STANDARD_UOMS.length
    });
  } catch (error) {
    console.error('Error fetching UOMs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch UOMs',
      error: error.message
    });
  }
};

// Get UOMs by category
export const getUOMsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const filtered = STANDARD_UOMS.filter(uom => uom.category === category.toUpperCase());

    res.json({
      success: true,
      data: filtered,
      count: filtered.length
    });
  } catch (error) {
    console.error('Error fetching UOMs by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch UOMs by category',
      error: error.message
    });
  }
};

// Get UOM by code
export const getUOMByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const uom = STANDARD_UOMS.find(u => u.code === code.toUpperCase());

    if (!uom) {
      return res.status(404).json({
        success: false,
        message: 'UOM not found'
      });
    }

    res.json({
      success: true,
      data: uom
    });
  } catch (error) {
    console.error('Error fetching UOM:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch UOM',
      error: error.message
    });
  }
};
