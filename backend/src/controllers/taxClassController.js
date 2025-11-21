// Tax Class Controller
// Provides predefined tax rates for different regions

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Predefined tax classes (GST rates for India, can be extended for other regions)
const TAX_CLASSES = [
  {
    id: 'nil',
    name: 'Nil Rated (0%)',
    rate: 0,
    description: 'No tax applicable',
    region: 'IN',
    type: 'GST'
  },
  {
    id: 'gst_0.25',
    name: 'GST 0.25%',
    rate: 0.25,
    description: 'GST at 0.25% (Precious Stones)',
    region: 'IN',
    type: 'GST'
  },
  {
    id: 'gst_3',
    name: 'GST 3%',
    rate: 3,
    description: 'GST at 3% (Precious Metals)',
    region: 'IN',
    type: 'GST'
  },
  {
    id: 'gst_5',
    name: 'GST 5%',
    rate: 5,
    description: 'GST at 5% (Essential Goods)',
    region: 'IN',
    type: 'GST'
  },
  {
    id: 'gst_12',
    name: 'GST 12%',
    rate: 12,
    description: 'GST at 12% (Processed Foods)',
    region: 'IN',
    type: 'GST'
  },
  {
    id: 'gst_18',
    name: 'GST 18%',
    rate: 18,
    description: 'GST at 18% (Most Goods & Services)',
    region: 'IN',
    type: 'GST'
  },
  {
    id: 'gst_28',
    name: 'GST 28%',
    rate: 28,
    description: 'GST at 28% (Luxury Items)',
    region: 'IN',
    type: 'GST'
  },
  {
    id: 'vat_5',
    name: 'VAT 5%',
    rate: 5,
    description: 'VAT at 5%',
    region: 'AE',
    type: 'VAT'
  },
  {
    id: 'vat_15',
    name: 'VAT 15%',
    rate: 15,
    description: 'VAT at 15% (Saudi Arabia)',
    region: 'SA',
    type: 'VAT'
  },
  {
    id: 'exempt',
    name: 'Exempt',
    rate: 0,
    description: 'Tax exempt items',
    region: 'ALL',
    type: 'EXEMPT'
  },
];

// Get all tax classes
export const getAllTaxClasses = async (req, res) => {
  try {
    const { region } = req.query;

    let taxClasses = TAX_CLASSES;
    if (region) {
      taxClasses = TAX_CLASSES.filter(tc =>
        tc.region === region.toUpperCase() || tc.region === 'ALL'
      );
    }

    res.json({
      success: true,
      data: taxClasses,
      count: taxClasses.length
    });
  } catch (error) {
    console.error('Error fetching tax classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tax classes',
      error: error.message
    });
  }
};

// Get tax class by ID
export const getTaxClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const taxClass = TAX_CLASSES.find(tc => tc.id === id);

    if (!taxClass) {
      return res.status(404).json({
        success: false,
        message: 'Tax class not found'
      });
    }

    res.json({
      success: true,
      data: taxClass
    });
  } catch (error) {
    console.error('Error fetching tax class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tax class',
      error: error.message
    });
  }
};

// Get tax classes by rate
export const getTaxClassesByRate = async (req, res) => {
  try {
    const { rate } = req.params;
    const taxClasses = TAX_CLASSES.filter(tc => tc.rate === parseFloat(rate));

    res.json({
      success: true,
      data: taxClasses,
      count: taxClasses.length
    });
  } catch (error) {
    console.error('Error fetching tax classes by rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tax classes by rate',
      error: error.message
    });
  }
};
