/**
 * ZirakBook Production Database Seeder
 * Creates comprehensive demo data with proper multi-tenant isolation
 *
 * DATABASE DESIGN DECISION:
 * - SUPERADMIN users are linked to a "platform company" for schema consistency
 * - SUPERADMIN has cross-company access enforced at application level
 * - Regular users (COMPANY_ADMIN, ACCOUNTANT, etc.) are company-scoped
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Shared password for all demo accounts
const DEMO_PASSWORD = 'Test@123456';

const seed = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ZirakBook Production Database Seeder                      ║');
  console.log('║  Multi-Tenant SaaS with Demo Data                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Hash password once for all users
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    // ============================================================
    // STEP 1: Create Platform Company for SUPERADMIN
    // ============================================================
    console.log('📦 STEP 1: Creating Platform Company...');

    let platformCompany = await prisma.company.findFirst({
      where: { email: 'platform@zirakbook.com' }
    });

    if (!platformCompany) {
      platformCompany = await prisma.company.create({
        data: {
          name: 'ZirakBook Platform',
          email: 'platform@zirakbook.com',
          phone: '1-800-ZIRAKBOOK',
          address: 'Platform Admin HQ',
          city: 'San Francisco',
          state: 'California',
          country: 'USA',
          postalCode: '94102',
          taxNumber: 'PLATFORM-TAX',
          fiscalYearStart: new Date('2025-01-01'),
          fiscalYearEnd: new Date('2025-12-31'),
          baseCurrency: 'USD',
          isActive: true
        }
      });
      console.log('✅ Platform Company created:', platformCompany.name);
    } else {
      console.log('⚠️  Platform Company already exists');
    }

    // ============================================================
    // STEP 2: Create SUPERADMIN User
    // ============================================================
    console.log('\n👤 STEP 2: Creating SUPERADMIN...');

    let superAdmin = await prisma.user.findFirst({
      where: { email: 'superadmin@test.com' }
    });

    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: {
          companyId: platformCompany.id,
          name: 'Super Admin',
          email: 'superadmin@test.com',
          password: hashedPassword,
          role: 'SUPERADMIN',
          status: 'ACTIVE',
          emailVerified: true
        }
      });
      console.log('✅ SUPERADMIN created:', superAdmin.email);
    } else {
      console.log('⚠️  SUPERADMIN already exists');
    }

    // ============================================================
    // STEP 3: Create Demo Companies
    // ============================================================
    console.log('\n🏢 STEP 3: Creating Demo Companies...');

    const companies = [];

    // Company 1: TechVision Inc
    let company1 = await prisma.company.findFirst({
      where: { email: 'admin@techvision.com' }
    });

    if (!company1) {
      company1 = await prisma.company.create({
        data: {
          name: 'TechVision Inc',
          email: 'admin@techvision.com',
          phone: '+1-555-0101',
          address: '123 Tech Street',
          city: 'Austin',
          state: 'Texas',
          country: 'USA',
          postalCode: '78701',
          taxNumber: 'TAX-TECH-001',
          fiscalYearStart: new Date('2025-01-01'),
          fiscalYearEnd: new Date('2025-12-31'),
          baseCurrency: 'USD',
          isActive: true
        }
      });
      console.log('✅ Company created: TechVision Inc');
    } else {
      console.log('⚠️  TechVision Inc already exists');
    }
    companies.push(company1);

    // Company 2: Global Retail Co
    let company2 = await prisma.company.findFirst({
      where: { email: 'admin@globalretail.com' }
    });

    if (!company2) {
      company2 = await prisma.company.create({
        data: {
          name: 'Global Retail Co',
          email: 'admin@globalretail.com',
          phone: '+1-555-0202',
          address: '456 Market Avenue',
          city: 'New York',
          state: 'New York',
          country: 'USA',
          postalCode: '10001',
          taxNumber: 'TAX-RETAIL-002',
          fiscalYearStart: new Date('2025-01-01'),
          fiscalYearEnd: new Date('2025-12-31'),
          baseCurrency: 'USD',
          isActive: true
        }
      });
      console.log('✅ Company created: Global Retail Co');
    } else {
      console.log('⚠️  Global Retail Co already exists');
    }
    companies.push(company2);

    // Company 3: Manufacturing Solutions LLC
    let company3 = await prisma.company.findFirst({
      where: { email: 'admin@mfgsolutions.com' }
    });

    if (!company3) {
      company3 = await prisma.company.create({
        data: {
          name: 'Manufacturing Solutions LLC',
          email: 'admin@mfgsolutions.com',
          phone: '+1-555-0303',
          address: '789 Industrial Blvd',
          city: 'Detroit',
          state: 'Michigan',
          country: 'USA',
          postalCode: '48201',
          taxNumber: 'TAX-MFG-003',
          fiscalYearStart: new Date('2025-01-01'),
          fiscalYearEnd: new Date('2025-12-31'),
          baseCurrency: 'USD',
          isActive: true
        }
      });
      console.log('✅ Company created: Manufacturing Solutions LLC');
    } else {
      console.log('⚠️  Manufacturing Solutions LLC already exists');
    }
    companies.push(company3);

    // ============================================================
    // STEP 4: Create Users for Each Company
    // ============================================================
    console.log('\n👥 STEP 4: Creating Users for Companies...');

    const userTemplates = [
      {
        email: 'companyadmin@test.com',
        name: 'Company Admin',
        role: 'COMPANY_ADMIN',
        company: company1
      },
      {
        email: 'accountant@testcompany.com',
        name: 'Test Accountant',
        role: 'ACCOUNTANT',
        company: company1
      },
      {
        email: 'manager@testcompany.com',
        name: 'Test Manager',
        role: 'MANAGER',
        company: company1
      },
      {
        email: 'sales@testcompany.com',
        name: 'Sales User',
        role: 'SALES_USER',
        company: company1
      },
      {
        email: 'admin@globalretail.com',
        name: 'Global Retail Admin',
        role: 'COMPANY_ADMIN',
        company: company2
      },
      {
        email: 'accountant@globalretail.com',
        name: 'Retail Accountant',
        role: 'ACCOUNTANT',
        company: company2
      },
      {
        email: 'admin@mfgsolutions.com',
        name: 'Manufacturing Admin',
        role: 'COMPANY_ADMIN',
        company: company3
      },
      {
        email: 'accountant@mfgsolutions.com',
        name: 'Manufacturing Accountant',
        role: 'ACCOUNTANT',
        company: company3
      }
    ];

    for (const template of userTemplates) {
      const existing = await prisma.user.findFirst({
        where: { email: template.email }
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            companyId: template.company.id,
            name: template.name,
            email: template.email,
            password: hashedPassword,
            role: template.role,
            status: 'ACTIVE',
            emailVerified: true
          }
        });
        console.log(`✅ User created: ${template.name} (${template.role})`);
      } else {
        console.log(`⚠️  User already exists: ${template.email}`);
      }
    }

    // ============================================================
    // STEP 5: Create Chart of Accounts for Each Company
    // ============================================================
    console.log('\n📊 STEP 5: Creating Chart of Accounts...');

    const accountTemplate = [
      { accountNumber: '1000', accountName: 'Cash', accountType: 'ASSET', description: 'Cash on hand' },
      { accountNumber: '1010', accountName: 'Bank Account', accountType: 'ASSET', description: 'Bank account balance' },
      { accountNumber: '1100', accountName: 'Petty Cash', accountType: 'ASSET', description: 'Petty cash fund' },
      { accountNumber: '1200', accountName: 'Accounts Receivable', accountType: 'ASSET', description: 'Money owed by customers' },
      { accountNumber: '1500', accountName: 'Inventory', accountType: 'ASSET', description: 'Products in stock' },
      { accountNumber: '1600', accountName: 'Prepaid Expenses', accountType: 'ASSET', description: 'Prepaid expenses' },
      { accountNumber: '1700', accountName: 'Fixed Assets', accountType: 'ASSET', description: 'Property, plant, equipment' },
      { accountNumber: '2000', accountName: 'Accounts Payable', accountType: 'LIABILITY', description: 'Money owed to suppliers' },
      { accountNumber: '2100', accountName: 'Credit Card Payable', accountType: 'LIABILITY', description: 'Credit card liabilities' },
      { accountNumber: '2200', accountName: 'Loans Payable', accountType: 'LIABILITY', description: 'Bank loans and debt' },
      { accountNumber: '3000', accountName: 'Owner Equity', accountType: 'EQUITY', description: 'Owner investment' },
      { accountNumber: '3100', accountName: 'Retained Earnings', accountType: 'EQUITY', description: 'Accumulated profits' },
      { accountNumber: '4000', accountName: 'Sales Revenue', accountType: 'REVENUE', description: 'Revenue from sales' },
      { accountNumber: '4100', accountName: 'Service Revenue', accountType: 'REVENUE', description: 'Revenue from services' },
      { accountNumber: '4200', accountName: 'Other Income', accountType: 'REVENUE', description: 'Miscellaneous income' },
      { accountNumber: '5000', accountName: 'Cost of Goods Sold', accountType: 'EXPENSE', description: 'Direct costs of products sold' },
      { accountNumber: '6000', accountName: 'Salaries Expense', accountType: 'EXPENSE', description: 'Employee salaries' },
      { accountNumber: '6100', accountName: 'Rent Expense', accountType: 'EXPENSE', description: 'Office rent' },
      { accountNumber: '6200', accountName: 'Utilities Expense', accountType: 'EXPENSE', description: 'Utilities' },
      { accountNumber: '6300', accountName: 'Marketing Expense', accountType: 'EXPENSE', description: 'Marketing and advertising' },
      { accountNumber: '6400', accountName: 'Office Supplies', accountType: 'EXPENSE', description: 'Office supplies' },
      { accountNumber: '6500', accountName: 'Insurance Expense', accountType: 'EXPENSE', description: 'Insurance premiums' },
      { accountNumber: '6600', accountName: 'Depreciation Expense', accountType: 'EXPENSE', description: 'Asset depreciation' },
      { accountNumber: '6700', accountName: 'Travel Expense', accountType: 'EXPENSE', description: 'Business travel' },
      { accountNumber: '6800', accountName: 'Professional Fees', accountType: 'EXPENSE', description: 'Legal, accounting fees' },
    ];

    for (const company of companies) {
      const existingAccounts = await prisma.account.count({
        where: { companyId: company.id }
      });

      if (existingAccounts === 0) {
        await prisma.account.createMany({
          data: accountTemplate.map(acc => ({
            ...acc,
            companyId: company.id
          }))
        });
        console.log(`✅ Created ${accountTemplate.length} accounts for ${company.name}`);
      } else {
        console.log(`⚠️  Accounts already exist for ${company.name}`);
      }
    }

    // ============================================================
    // STEP 6: Create Demo Customers
    // ============================================================
    console.log('\n👥 STEP 6: Creating Demo Customers...');

    const customerTemplates = [
      { name: 'Acme Corporation', email: 'billing@acme.com', phone: '555-1001', city: 'Los Angeles', creditLimit: 50000, creditDays: 30 },
      { name: 'Best Buy Solutions', email: 'ap@bestbuy.com', phone: '555-1002', city: 'Chicago', creditLimit: 75000, creditDays: 45 },
      { name: 'Consolidated Industries', email: 'finance@consolidated.com', phone: '555-1003', city: 'Houston', creditLimit: 100000, creditDays: 60 },
      { name: 'Delta Enterprises', email: 'accounts@delta.com', phone: '555-1004', city: 'Phoenix', creditLimit: 40000, creditDays: 30 },
      { name: 'Echo Systems Inc', email: 'billing@echo.com', phone: '555-1005', city: 'Philadelphia', creditLimit: 60000, creditDays: 45 },
      { name: 'Future Tech LLC', email: 'ap@futuretech.com', phone: '555-1006', city: 'San Antonio', creditLimit: 55000, creditDays: 30 },
      { name: 'Global Partners Ltd', email: 'finance@globalp.com', phone: '555-1007', city: 'San Diego', creditLimit: 85000, creditDays: 60 },
      { name: 'Horizon Corp', email: 'billing@horizon.com', phone: '555-1008', city: 'Dallas', creditLimit: 70000, creditDays: 45 },
      { name: 'Innovation Hub', email: 'ap@innovation.com', phone: '555-1009', city: 'San Jose', creditLimit: 65000, creditDays: 30 },
      { name: 'Jupiter Networks', email: 'accounts@jupiter.com', phone: '555-1010', city: 'Austin', creditLimit: 90000, creditDays: 60 },
    ];

    for (const company of companies) {
      const existingCustomers = await prisma.customer.count({
        where: { companyId: company.id }
      });

      if (existingCustomers === 0) {
        let customerCount = 1;
        for (const template of customerTemplates) {
          await prisma.customer.create({
            data: {
              companyId: company.id,
              customerNumber: `CUST-${String(customerCount).padStart(4, '0')}`,
              name: template.name,
              email: template.email,
              phone: template.phone,
              address: `${100 + customerCount} Business St`,
              city: template.city,
              state: 'State',
              country: 'USA',
              postalCode: `${10000 + customerCount}`,
              taxNumber: `TAX-${String(customerCount).padStart(6, '0')}`,
              creditLimit: template.creditLimit,
              creditDays: template.creditDays,
              openingBalance: 0,
              currentBalance: 0,
              isActive: true
            }
          });
          customerCount++;
        }
        console.log(`✅ Created ${customerTemplates.length} customers for ${company.name}`);
      } else {
        console.log(`⚠️  Customers already exist for ${company.name}`);
      }
    }

    // ============================================================
    // STEP 7: Create Demo Vendors
    // ============================================================
    console.log('\n🏭 STEP 7: Creating Demo Vendors...');

    const vendorTemplates = [
      { name: 'Premium Supplies Inc', email: 'billing@premiumsupplies.com', phone: '555-2001', city: 'Seattle', paymentTerms: 30 },
      { name: 'Quality Materials Co', email: 'ap@qualitymaterials.com', phone: '555-2002', city: 'Portland', paymentTerms: 45 },
      { name: 'Reliable Distributors', email: 'finance@reliable.com', phone: '555-2003', city: 'Denver', paymentTerms: 60 },
      { name: 'Superior Vendors LLC', email: 'accounts@superior.com', phone: '555-2004', city: 'Boston', paymentTerms: 30 },
      { name: 'TopTier Wholesale', email: 'billing@toptier.com', phone: '555-2005', city: 'Miami', paymentTerms: 45 },
    ];

    for (const company of companies) {
      const existingVendors = await prisma.vendor.count({
        where: { companyId: company.id }
      });

      if (existingVendors === 0) {
        let vendorCount = 1;
        for (const template of vendorTemplates) {
          await prisma.vendor.create({
            data: {
              companyId: company.id,
              vendorNumber: `VEND-${String(vendorCount).padStart(4, '0')}`,
              name: template.name,
              email: template.email,
              phone: template.phone,
              address: `${200 + vendorCount} Supplier Rd`,
              city: template.city,
              state: 'State',
              country: 'USA',
              postalCode: `${20000 + vendorCount}`,
              taxNumber: `VTAX-${String(vendorCount).padStart(6, '0')}`,
              paymentTerms: template.paymentTerms,
              openingBalance: 0,
              currentBalance: 0,
              isActive: true
            }
          });
          vendorCount++;
        }
        console.log(`✅ Created ${vendorTemplates.length} vendors for ${company.name}`);
      } else {
        console.log(`⚠️  Vendors already exist for ${company.name}`);
      }
    }

    // ============================================================
    // STEP 8: Create Demo Categories & Brands
    // ============================================================
    console.log('\n📦 STEP 8: Creating Categories & Brands...');

    const categories = ['Electronics', 'Furniture', 'Office Supplies', 'Software', 'Hardware'];
    const brands = ['TechBrand', 'OfficePro', 'InnovativeSolutions', 'QualityGoods', 'PremiumTech'];

    for (const company of companies) {
      const existingCategories = await prisma.category.count({
        where: { companyId: company.id }
      });

      if (existingCategories === 0) {
        for (const catName of categories) {
          await prisma.category.create({
            data: {
              companyId: company.id,
              name: catName,
              description: `${catName} products`,
              isActive: true
            }
          });
        }
        console.log(`✅ Created ${categories.length} categories for ${company.name}`);
      } else {
        console.log(`⚠️  Categories already exist for ${company.name}`);
      }

      const existingBrands = await prisma.brand.count({
        where: { companyId: company.id }
      });

      if (existingBrands === 0) {
        for (const brandName of brands) {
          await prisma.brand.create({
            data: {
              companyId: company.id,
              name: brandName,
              description: `${brandName} products`,
              isActive: true
            }
          });
        }
        console.log(`✅ Created ${brands.length} brands for ${company.name}`);
      } else {
        console.log(`⚠️  Brands already exist for ${company.name}`);
      }
    }

    // ============================================================
    // STEP 9: Create Demo Products
    // ============================================================
    console.log('\n📦 STEP 9: Creating Demo Products...');

    const productTemplates = [
      { sku: 'PROD-001', name: 'Wireless Mouse', type: 'GOODS', unit: 'PCS', purchasePrice: 15.00, sellingPrice: 29.99, mrp: 34.99, taxRate: 18 },
      { sku: 'PROD-002', name: 'USB Keyboard', type: 'GOODS', unit: 'PCS', purchasePrice: 25.00, sellingPrice: 49.99, mrp: 59.99, taxRate: 18 },
      { sku: 'PROD-003', name: 'LED Monitor 24"', type: 'GOODS', unit: 'PCS', purchasePrice: 120.00, sellingPrice: 199.99, mrp: 249.99, taxRate: 18 },
      { sku: 'PROD-004', name: 'Office Chair', type: 'GOODS', unit: 'PCS', purchasePrice: 80.00, sellingPrice: 149.99, mrp: 179.99, taxRate: 18 },
      { sku: 'PROD-005', name: 'Desk Lamp', type: 'GOODS', unit: 'PCS', purchasePrice: 12.00, sellingPrice: 24.99, mrp: 29.99, taxRate: 18 },
      { sku: 'PROD-006', name: 'Notebook A4', type: 'GOODS', unit: 'PCS', purchasePrice: 2.00, sellingPrice: 4.99, mrp: 5.99, taxRate: 12 },
      { sku: 'PROD-007', name: 'Ballpoint Pen', type: 'GOODS', unit: 'PCS', purchasePrice: 0.50, sellingPrice: 1.49, mrp: 1.99, taxRate: 12 },
      { sku: 'PROD-008', name: 'Printer Paper (Ream)', type: 'GOODS', unit: 'PCS', purchasePrice: 3.50, sellingPrice: 7.99, mrp: 9.99, taxRate: 12 },
      { sku: 'PROD-009', name: 'Stapler', type: 'GOODS', unit: 'PCS', purchasePrice: 4.00, sellingPrice: 8.99, mrp: 10.99, taxRate: 18 },
      { sku: 'PROD-010', name: 'File Folder', type: 'GOODS', unit: 'PCS', purchasePrice: 1.00, sellingPrice: 2.49, mrp: 2.99, taxRate: 12 },
      { sku: 'SERV-001', name: 'IT Consultation', type: 'SERVICE', unit: 'HR', purchasePrice: 0, sellingPrice: 150.00, mrp: 200.00, taxRate: 18 },
      { sku: 'SERV-002', name: 'Installation Service', type: 'SERVICE', unit: 'HR', purchasePrice: 0, sellingPrice: 75.00, mrp: 100.00, taxRate: 18 },
    ];

    for (const company of companies) {
      const existingProducts = await prisma.product.count({
        where: { companyId: company.id }
      });

      if (existingProducts === 0) {
        const companyCategories = await prisma.category.findMany({
          where: { companyId: company.id },
          take: 1
        });

        const companyBrands = await prisma.brand.findMany({
          where: { companyId: company.id },
          take: 1
        });

        for (const template of productTemplates) {
          await prisma.product.create({
            data: {
              companyId: company.id,
              sku: template.sku,
              name: template.name,
              description: `High quality ${template.name}`,
              type: template.type,
              categoryId: companyCategories[0]?.id,
              brandId: companyBrands[0]?.id,
              unit: template.unit,
              purchasePrice: template.purchasePrice,
              sellingPrice: template.sellingPrice,
              mrp: template.mrp,
              taxRate: template.taxRate,
              reorderLevel: 10,
              minStockLevel: 5,
              maxStockLevel: 100,
              isActive: true,
              isSaleable: true,
              isPurchasable: true,
              trackInventory: template.type === 'GOODS'
            }
          });
        }
        console.log(`✅ Created ${productTemplates.length} products for ${company.name}`);
      } else {
        console.log(`⚠️  Products already exist for ${company.name}`);
      }
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ Database Seeding Completed Successfully!               ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║                                                            ║');
    console.log('║  LOGIN CREDENTIALS (All use password: Test@123456)        ║');
    console.log('║                                                            ║');
    console.log('║  SUPERADMIN (Platform Access):                             ║');
    console.log('║  Email: superadmin@test.com                                ║');
    console.log('║                                                            ║');
    console.log('║  COMPANY 1: TechVision Inc                                 ║');
    console.log('║  - Admin: companyadmin@test.com                            ║');
    console.log('║  - Accountant: accountant@testcompany.com                  ║');
    console.log('║  - Manager: manager@testcompany.com                        ║');
    console.log('║  - Sales: sales@testcompany.com                            ║');
    console.log('║                                                            ║');
    console.log('║  COMPANY 2: Global Retail Co                               ║');
    console.log('║  - Admin: admin@globalretail.com                           ║');
    console.log('║  - Accountant: accountant@globalretail.com                 ║');
    console.log('║                                                            ║');
    console.log('║  COMPANY 3: Manufacturing Solutions LLC                    ║');
    console.log('║  - Admin: admin@mfgsolutions.com                           ║');
    console.log('║  - Accountant: accountant@mfgsolutions.com                 ║');
    console.log('║                                                            ║');
    console.log('║  DEMO DATA PER COMPANY:                                    ║');
    console.log('║  - 25 Chart of Accounts                                    ║');
    console.log('║  - 10 Customers                                            ║');
    console.log('║  - 5 Vendors                                               ║');
    console.log('║  - 5 Categories                                            ║');
    console.log('║  - 5 Brands                                                ║');
    console.log('║  - 12 Products (10 goods + 2 services)                     ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
