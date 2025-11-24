# ZirakBook - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [User Roles](#user-roles)
3. [Logging In](#logging-in)
4. [Dashboard Overview](#dashboard-overview)
5. [Common Workflows](#common-workflows)
6. [Module Guides](#module-guides)
7. [Tips and Best Practices](#tips-and-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is ZirakBook?

ZirakBook is a multi-tenant accounting SaaS application that provides comprehensive financial management, inventory control, sales, purchases, and reporting capabilities.

### Key Features

- **Multi-Tenant Architecture**: Complete data isolation between companies
- **Role-Based Access Control**: Different permissions for different user roles
- **Comprehensive Accounting**: Chart of accounts, journal entries, financial reports
- **Inventory Management**: Products, categories, brands, stock tracking
- **Sales Module**: Quotations, orders, invoices, delivery challans
- **Purchase Module**: Quotations, orders, goods receipts, bills
- **Customer & Vendor Management**: Complete CRM and vendor tracking
- **Financial Reports**: Balance sheet, P&L, cash flow, and more

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Login credentials (provided by administrator)

---

## User Roles

### SUPERADMIN
**Who**: Platform administrators
**Access**: All companies, all features, system configuration
**Typical Users**: ZirakBook support team, system administrators

**Key Responsibilities:**
- Create and manage companies
- Manage users across all companies
- View consolidated reports
- Configure system settings
- Handle platform-level operations

**Dashboard**: Super Admin Dashboard at `/dashboard`

### COMPANY_ADMIN
**Who**: Company administrators
**Access**: Full access to their company's data
**Typical Users**: Company owners, CFOs, IT managers

**Key Responsibilities:**
- Manage company users
- Configure company settings
- Access all company data
- Approve transactions
- View all reports

**Dashboard**: Company Dashboard at `/company/dashboard`

### ACCOUNTANT
**Who**: Accounting and finance staff
**Access**: Financial and accounting modules
**Typical Users**: Accountants, bookkeepers, finance managers

**Key Responsibilities:**
- Manage chart of accounts
- Create journal entries
- Record payments and receipts
- Generate financial reports
- Reconcile accounts

**Dashboard**: Company Dashboard at `/company/dashboard`

### MANAGER
**Who**: Department managers
**Access**: Reporting and operational modules
**Typical Users**: Operations managers, department heads

**Key Responsibilities:**
- View dashboards and reports
- Manage inventory and sales
- Monitor performance metrics
- Cannot modify accounting data

**Dashboard**: Company Dashboard at `/company/dashboard`

### SALES_USER
**Who**: Sales team members
**Access**: Sales and customer modules
**Typical Users**: Sales representatives, account managers

**Key Responsibilities:**
- Create quotations and invoices
- Manage customers
- Track sales performance
- Limited access to other modules

**Dashboard**: Company Dashboard at `/company/dashboard`

### PURCHASE_USER
**Who**: Procurement team
**Access**: Purchase and vendor modules
**Typical Users**: Procurement officers, buyers

**Key Responsibilities:**
- Create purchase orders
- Manage vendors
- Track purchase performance
- Limited access to other modules

**Dashboard**: Company Dashboard at `/company/dashboard`

### INVENTORY_USER
**Who**: Warehouse and inventory staff
**Access**: Inventory management modules
**Typical Users**: Warehouse managers, inventory controllers

**Key Responsibilities:**
- Manage products and stock
- Perform stock adjustments
- Track inventory movements
- Limited access to other modules

**Dashboard**: Company Dashboard at `/company/dashboard`

### VIEWER
**Who**: Read-only users
**Access**: View-only access to reports and data
**Typical Users**: Auditors, consultants, stakeholders

**Key Responsibilities:**
- View reports and dashboards
- Cannot create or modify any data

**Dashboard**: Company Dashboard at `/company/dashboard`

---

## Logging In

### Step 1: Navigate to Login Page

Open your browser and go to:
```
https://frontend-production-32b8.up.railway.app/login
```

### Step 2: Enter Credentials

**For Demo/Testing:**

All demo accounts use password: `Test@123456`

**SUPERADMIN:**
- Email: `superadmin@test.com`
- Password: `Test@123456`

**TechVision Inc:**
- Admin: `companyadmin@test.com`
- Accountant: `accountant@testcompany.com`
- Manager: `manager@testcompany.com`

**Global Retail Co:**
- Admin: `admin@globalretail.com`
- Accountant: `accountant@globalretail.com`

**Manufacturing Solutions LLC:**
- Admin: `admin@mfgsolutions.com`
- Accountant: `accountant@mfgsolutions.com`

### Step 3: Dashboard

After successful login:
- **SUPERADMIN**: Redirected to `/dashboard` (Super Admin Dashboard)
- **All Others**: Redirected to `/company/dashboard` (Company Dashboard)

### Logout

Click on your profile menu (usually top-right) and select "Logout"

---

## Dashboard Overview

### Super Admin Dashboard (`/dashboard`)

**Visible to**: SUPERADMIN only

**Sections:**
- **Companies Overview**: List of all companies with status
- **Platform Statistics**: Total users, transactions, revenue
- **Recent Activity**: Latest activities across all companies
- **System Health**: Server status, database metrics

**Quick Actions:**
- Create New Company
- Manage Users
- View Reports
- System Settings

### Company Dashboard (`/company/dashboard`)

**Visible to**: All company users (based on role)

**Sections:**
- **Financial Summary**: Revenue, expenses, profit, cash flow
- **Sales Metrics**: Sales orders, invoices, top customers
- **Purchase Metrics**: Purchase orders, bills, top vendors
- **Inventory Status**: Stock levels, low stock alerts
- **Recent Transactions**: Latest activities

**Quick Actions (role-dependent):**
- Create Invoice
- Create Purchase Order
- Add Customer
- Add Product
- View Reports

---

## Common Workflows

### 1. Create a New Customer

**Who Can**: COMPANY_ADMIN, SALES_USER

**Steps:**
1. Navigate to **Accounts** > **Customers/Debtors**
2. Click **Add Customer** button
3. Fill in customer details:
   - Name (required)
   - Email
   - Phone
   - Address, City, State, Country
   - Tax Number (GST/VAT)
   - Credit Limit
   - Credit Days (payment terms)
4. Click **Save**

**Result**: Customer is created with auto-generated customer number (e.g., CUST-0001)

### 2. Create a New Product

**Who Can**: COMPANY_ADMIN, INVENTORY_USER

**Steps:**
1. Navigate to **Inventory** > **Products**
2. Click **Add Product** button
3. Fill in product details:
   - SKU (required, unique)
   - Name (required)
   - Description
   - Type: Goods or Service
   - Category
   - Brand
   - Unit (PCS, KG, etc.)
   - Purchase Price
   - Selling Price
   - MRP
   - Tax Rate (GST %)
   - HSN/SAC Code
   - Stock Levels (min, max, reorder)
4. Upload images (optional)
5. Click **Save**

**Result**: Product is created and available for sales/purchase

### 3. Create a Sales Invoice

**Who Can**: COMPANY_ADMIN, SALES_USER

**Steps:**
1. Navigate to **Sales** > **Invoice**
2. Click **Create Invoice** button
3. Select customer (or create new)
4. Set invoice date and due date
5. Add products:
   - Select product
   - Enter quantity
   - Unit price auto-fills (can be edited)
   - Tax calculated automatically
6. Add discount if applicable
7. Review totals (Subtotal, Tax, Total)
8. Add notes or terms (optional)
9. Click **Save** or **Save & Send**

**Result**: Invoice created with auto-generated number (e.g., INV-0001)

### 4. Record Payment from Customer

**Who Can**: COMPANY_ADMIN, ACCOUNTANT

**Steps:**
1. Navigate to **Accounts** > **Receipt Entry**
2. Click **Add Receipt**
3. Select customer
4. Select invoice (optional - can be on-account)
5. Enter amount received
6. Select payment method (Cash, Bank, Card, etc.)
7. Enter payment details (check number, UPI ID, etc.)
8. Set receipt date
9. Add notes
10. Click **Save**

**Result**: Payment recorded, customer balance updated

### 5. Create Purchase Order

**Who Can**: COMPANY_ADMIN, PURCHASE_USER

**Steps:**
1. Navigate to **Purchases** > **Purchase Order**
2. Click **Create PO**
3. Select vendor
4. Set order date and expected delivery
5. Add products and quantities
6. Review prices and totals
7. Add terms and conditions
8. Click **Save** or **Send to Vendor**

**Result**: PO created with auto-generated number (e.g., PO-0001)

### 6. Receive Goods (Goods Receipt Note)

**Who Can**: COMPANY_ADMIN, INVENTORY_USER

**Steps:**
1. Navigate to **Purchases** > **Goods Receipt**
2. Click **Create GRN**
3. Select PO (optional)
4. Select vendor
5. Select warehouse
6. For each item:
   - Enter received quantity
   - Enter accepted quantity
   - Note any rejected/damaged items
7. Add vehicle and driver details
8. Click **Save**

**Result**: Stock updated, GRN created

### 7. Generate Financial Reports

**Who Can**: COMPANY_ADMIN, ACCOUNTANT, MANAGER (view-only)

**Steps:**
1. Navigate to **Reports** > Select report type
2. Options:
   - Balance Sheet
   - Profit & Loss
   - Cash Flow
   - Trial Balance
   - Day Book
   - Ledger
3. Set date range
4. Apply filters (accounts, categories, etc.)
5. Click **Generate Report**
6. Options to:
   - View on screen
   - Export to PDF
   - Export to Excel
   - Print

**Result**: Report generated with company data

### 8. Add New User to Company

**Who Can**: COMPANY_ADMIN, SUPERADMIN

**Steps:**
1. Navigate to **Settings** > **Users**
2. Click **Add User**
3. Enter user details:
   - Name
   - Email (becomes username)
   - Phone
   - Role (select from dropdown)
   - Initial password
4. Set permissions (based on role)
5. Click **Save**

**Result**: User created, can log in with provided credentials

### 9. Manage Chart of Accounts

**Who Can**: COMPANY_ADMIN, ACCOUNTANT

**Steps:**
1. Navigate to **Accounts** > **Chart of Accounts**
2. View existing accounts organized by type:
   - Assets
   - Liabilities
   - Equity
   - Revenue
   - Expenses
3. To add new account:
   - Click **Add Account**
   - Enter account number
   - Enter account name
   - Select type
   - Set parent account (for hierarchy)
   - Enter opening balance
   - Click **Save**

**Result**: New account added to chart

### 10. Create Journal Entry

**Who Can**: COMPANY_ADMIN, ACCOUNTANT

**Steps:**
1. Navigate to **Reports** > **Journal Entries**
2. Click **Create Entry**
3. Set entry date
4. Add description
5. Add journal lines:
   - Select account (debit side)
   - Enter amount
   - Select account (credit side)
   - Enter amount
6. Ensure debits = credits
7. Click **Post**

**Result**: Journal entry posted, accounts updated

---

## Module Guides

### Accounts Module

**Key Features:**
- Chart of Accounts
- Customers/Debtors Management
- Vendors/Creditors Management
- Ledger Accounts
- Payment Entry
- Receipt Entry

**Navigation**: `/company/accounts/*`

**Typical Tasks:**
- Add/edit customers
- Add/edit vendors
- View ledger balances
- Record payments
- Record receipts

### Inventory Module

**Key Features:**
- Product Management
- Categories & Brands
- Warehouses
- Stock Adjustments
- Stock Transfer
- Inventory Valuation

**Navigation**: `/company/inventory/*`

**Typical Tasks:**
- Add/edit products
- Manage stock levels
- Transfer stock between warehouses
- Adjust stock for damages/losses
- View inventory reports

### Sales Module

**Key Features:**
- Sales Quotations
- Sales Orders
- Delivery Challans
- Invoices
- Sales Returns

**Navigation**: `/company/sales/*`

**Typical Tasks:**
- Create quotations
- Convert quotation to order
- Generate invoices
- Track deliveries
- Process returns

### Purchases Module

**Key Features:**
- Purchase Quotations
- Purchase Orders
- Goods Receipts
- Bills/Invoices
- Purchase Returns

**Navigation**: `/company/purchases/*`

**Typical Tasks:**
- Request quotations
- Create purchase orders
- Receive goods
- Record bills
- Process returns

### Reports Module

**Key Features:**
- Financial Reports
- Sales Reports
- Purchase Reports
- Inventory Reports
- Tax Reports
- Custom Reports

**Navigation**: `/company/reports/*`

**Available Reports:**
- Balance Sheet
- Profit & Loss Statement
- Cash Flow Statement
- Trial Balance
- Day Book
- Sales Register
- Purchase Register
- Stock Summary
- GST Reports
- VAT Reports

### Settings Module

**Key Features:**
- Company Information
- User Management
- Roles & Permissions
- System Configuration

**Navigation**: `/company/settings/*`

**Typical Tasks:**
- Update company details
- Manage users
- Configure fiscal year
- Set tax rates
- Customize invoice formats

---

## Tips and Best Practices

### General Tips

1. **Regular Backups**: Ensure regular backups of your data
2. **Reconciliation**: Reconcile accounts monthly
3. **User Training**: Train users on their specific modules
4. **Password Security**: Use strong passwords, change regularly
5. **Data Entry**: Enter data promptly for accurate reporting

### Accounting Best Practices

1. **Chart of Accounts**: Set up properly from the start
2. **Opening Balances**: Enter accurately
3. **Daily Entries**: Post transactions daily
4. **Month End**: Perform month-end closing procedures
5. **Review Reports**: Review financial reports monthly
6. **Audit Trail**: Maintain proper documentation

### Inventory Best Practices

1. **SKU Naming**: Use consistent SKU naming conventions
2. **Stock Counts**: Perform regular physical stock counts
3. **Reorder Levels**: Set appropriate reorder points
4. **Expiry Tracking**: Track product expiry dates
5. **Warehouse Organization**: Keep warehouses organized

### Sales Best Practices

1. **Customer Database**: Keep customer information updated
2. **Credit Limits**: Set and monitor credit limits
3. **Payment Terms**: Clearly define payment terms
4. **Follow-ups**: Follow up on overdue invoices
5. **Documentation**: Maintain proper sales documentation

### Purchase Best Practices

1. **Vendor Evaluation**: Regularly evaluate vendors
2. **Purchase Orders**: Use POs for all purchases
3. **GRN Matching**: Match GRNs with POs
4. **Payment Scheduling**: Schedule payments optimally
5. **Vendor Relationships**: Maintain good vendor relationships

---

## Troubleshooting

### Login Issues

**Problem**: Cannot log in
**Solutions**:
- Verify email is correct (case-sensitive)
- Verify password is correct
- Clear browser cache and cookies
- Try different browser
- Contact administrator for password reset

**Problem**: Logged out automatically
**Solutions**:
- Session timeout (normal after 24 hours)
- Login again
- Check "Keep me logged in" for longer sessions

### Data Not Showing

**Problem**: Cannot see customers/products
**Solutions**:
- Verify you're logged in
- Check you have permissions for that module
- Refresh the page
- Check if data was entered correctly
- Contact administrator

**Problem**: Wrong company data showing
**Solutions**:
- Verify you're logged in with correct company account
- Logout and login again
- Multi-tenant isolation should prevent this - report if it happens

### Report Issues

**Problem**: Report shows no data
**Solutions**:
- Check date range
- Verify filters are not too restrictive
- Ensure data exists for that period
- Try resetting filters

**Problem**: Report numbers don't match
**Solutions**:
- Verify date ranges
- Check for unposted transactions
- Reconcile accounts
- Contact accountant

### Performance Issues

**Problem**: System is slow
**Solutions**:
- Check internet connection
- Clear browser cache
- Close unnecessary browser tabs
- Try different browser
- Check if system is under maintenance

**Problem**: Page won't load
**Solutions**:
- Refresh page
- Clear cache
- Check internet connection
- Try different URL
- Contact administrator

### Error Messages

**Problem**: "401 Unauthorized"
**Solutions**:
- Session expired - login again
- Check you have permission for that action

**Problem**: "403 Forbidden"
**Solutions**:
- You don't have permission for this action
- Contact administrator to grant permissions

**Problem**: "404 Not Found"
**Solutions**:
- Page URL may be incorrect
- Feature may not be available
- Contact administrator

**Problem**: "500 Server Error"
**Solutions**:
- System error - try again
- If persists, contact administrator
- Note the action that caused error

---

## Getting Help

### Documentation
- User Guide: This document
- API Documentation: For developers
- Deployment Guide: For administrators

### Support Channels
- **Administrator**: Contact your company administrator
- **Platform Support**: For platform-level issues
- **Training**: Request training sessions

### Reporting Issues
When reporting an issue, include:
1. Your username/email
2. What you were trying to do
3. What happened vs what you expected
4. Error message (if any)
5. Screenshot (if helpful)
6. Browser and version
7. Date and time of issue

---

## Keyboard Shortcuts

### Global
- `Ctrl/Cmd + S`: Save current form
- `Esc`: Close modal/dialog
- `Ctrl/Cmd + P`: Print
- `/`: Focus search

### Navigation
- `Alt + H`: Home/Dashboard
- `Alt + C`: Customers
- `Alt + V`: Vendors
- `Alt + P`: Products
- `Alt + I`: Invoices

*(Note: Actual shortcuts may vary based on implementation)*

---

## Glossary

**Chart of Accounts**: List of all accounts used in accounting

**Debit/Credit**: Accounting entries (debits increase assets/expenses, credits increase liabilities/revenue)

**Fiscal Year**: Company's financial year

**GST**: Goods and Services Tax

**HSN**: Harmonized System Nomenclature code

**Invoice**: Bill sent to customer

**Journal Entry**: Accounting entry recording a transaction

**Ledger**: Record of all transactions for an account

**Multi-Tenant**: Each company has isolated data

**PO**: Purchase Order

**RBAC**: Role-Based Access Control

**SAC**: Service Accounting Code

**SKU**: Stock Keeping Unit (product identifier)

**VAT**: Value Added Tax

---

## Quick Reference

### Common Navigation Paths

| Feature | Path |
|---------|------|
| Dashboard | `/company/dashboard` |
| Customers | `/company/customersdebtors` |
| Vendors | `/company/vendorscreditors` |
| Products | `/company/product` |
| Invoices | `/company/invoice` |
| Purchase Orders | `/company/purchasorderr` |
| Chart of Accounts | `/company/allacounts` |
| Balance Sheet | `/company/balancesheet` |
| Profit & Loss | `/company/profitloss` |
| Users | `/company/users` |
| Company Info | `/company/companyinfo` |

### Support Information

- **Application URL**: https://frontend-production-32b8.up.railway.app
- **API URL**: https://accounting-software-production.up.railway.app/api/v1
- **Demo Credentials**: See [Credentials Document](CREDENTIALS.md)
- **Deployment Info**: See [Deployment Guide](DEPLOYMENT.md)

---

*Last Updated: November 24, 2025*
*Version: 1.0*
