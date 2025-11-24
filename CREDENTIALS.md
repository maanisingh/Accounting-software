# ZirakBook - Login Credentials

## Overview
All demo accounts use the same password for easy testing: **Test@123456**

## Production Deployment
- **Frontend**: https://frontend-production-32b8.up.railway.app
- **Backend API**: https://accounting-software-production.up.railway.app/api/v1

## Platform Administrator

### SUPERADMIN
**Purpose**: Platform-level administration, can manage all companies

| Field | Value |
|-------|-------|
| **Email** | superadmin@test.com |
| **Password** | Test@123456 |
| **Role** | SUPERADMIN |
| **Company** | ZirakBook Platform (system company) |
| **Access** | Can view and manage ALL companies |

**Login URL**: https://frontend-production-32b8.up.railway.app/login

After login, redirects to: `/dashboard` (Super Admin Dashboard)

---

## Company 1: TechVision Inc

**Company Details:**
- Name: TechVision Inc
- Location: Austin, Texas, USA
- Industry: Technology

### Users

#### Company Admin
| Field | Value |
|-------|-------|
| **Email** | companyadmin@test.com |
| **Password** | Test@123456 |
| **Role** | COMPANY_ADMIN |
| **Permissions** | Full access to TechVision Inc data only |

#### Accountant
| Field | Value |
|-------|-------|
| **Email** | accountant@testcompany.com |
| **Password** | Test@123456 |
| **Role** | ACCOUNTANT |
| **Permissions** | Accounting and financial operations |

#### Manager
| Field | Value |
|-------|-------|
| **Email** | manager@testcompany.com |
| **Password** | Test@123456 |
| **Role** | MANAGER |
| **Permissions** | Management and reporting access |

#### Sales User
| Field | Value |
|-------|-------|
| **Email** | sales@testcompany.com |
| **Password** | Test@123456 |
| **Role** | SALES_USER |
| **Permissions** | Sales module access |

**Login URL**: https://frontend-production-32b8.up.railway.app/login

After login, redirects to: `/company/dashboard` (Company Dashboard)

---

## Company 2: Global Retail Co

**Company Details:**
- Name: Global Retail Co
- Location: New York, New York, USA
- Industry: Retail

### Users

#### Company Admin
| Field | Value |
|-------|-------|
| **Email** | admin@globalretail.com |
| **Password** | Test@123456 |
| **Role** | COMPANY_ADMIN |
| **Permissions** | Full access to Global Retail Co data only |

#### Accountant
| Field | Value |
|-------|-------|
| **Email** | accountant@globalretail.com |
| **Password** | Test@123456 |
| **Role** | ACCOUNTANT |
| **Permissions** | Accounting and financial operations |

**Login URL**: https://frontend-production-32b8.up.railway.app/login

After login, redirects to: `/company/dashboard` (Company Dashboard)

---

## Company 3: Manufacturing Solutions LLC

**Company Details:**
- Name: Manufacturing Solutions LLC
- Location: Detroit, Michigan, USA
- Industry: Manufacturing

### Users

#### Company Admin
| Field | Value |
|-------|-------|
| **Email** | admin@mfgsolutions.com |
| **Password** | Test@123456 |
| **Role** | COMPANY_ADMIN |
| **Permissions** | Full access to Manufacturing Solutions data only |

#### Accountant
| Field | Value |
|-------|-------|
| **Email** | accountant@mfgsolutions.com |
| **Password** | Test@123456 |
| **Role** | ACCOUNTANT |
| **Permissions** | Accounting and financial operations |

**Login URL**: https://frontend-production-32b8.up.railway.app/login

After login, redirects to: `/company/dashboard` (Company Dashboard)

---

## Demo Data Summary

Each company has been seeded with:

### Chart of Accounts (25 accounts)
- Assets: Cash, Bank Account, Petty Cash, Accounts Receivable, Inventory, Prepaid Expenses, Fixed Assets
- Liabilities: Accounts Payable, Credit Card Payable, Loans Payable
- Equity: Owner Equity, Retained Earnings
- Revenue: Sales Revenue, Service Revenue, Other Income
- Expenses: COGS, Salaries, Rent, Utilities, Marketing, Office Supplies, Insurance, Depreciation, Travel, Professional Fees

### Customers (10)
- Acme Corporation
- Best Buy Solutions
- Consolidated Industries
- Delta Enterprises
- Echo Systems Inc
- Future Tech LLC
- Global Partners Ltd
- Horizon Corp
- Innovation Hub
- Jupiter Networks

### Vendors (5)
- Premium Supplies Inc
- Quality Materials Co
- Reliable Distributors
- Superior Vendors LLC
- TopTier Wholesale

### Products (12)
**Goods (10):**
1. Wireless Mouse
2. USB Keyboard
3. LED Monitor 24"
4. Office Chair
5. Desk Lamp
6. Notebook A4
7. Ballpoint Pen
8. Printer Paper (Ream)
9. Stapler
10. File Folder

**Services (2):**
1. IT Consultation
2. Installation Service

### Categories (5)
- Electronics
- Furniture
- Office Supplies
- Software
- Hardware

### Brands (5)
- TechBrand
- OfficePro
- InnovativeSolutions
- QualityGoods
- PremiumTech

---

## Multi-Tenant Architecture

### Data Isolation
- Each company has completely isolated data
- Users can only access data from their own company
- SUPERADMIN can view/manage all companies
- All database queries are filtered by `companyId`

### Role-Based Access Control (RBAC)

#### SUPERADMIN
- Platform-level administration
- Can create new companies
- Can manage all users across all companies
- Can view all financial data
- Can configure system settings

#### COMPANY_ADMIN
- Company-level administration
- Can manage users within their company
- Full access to all company data
- Can configure company settings
- Cannot access other companies' data

#### ACCOUNTANT
- Financial and accounting operations
- Can manage chart of accounts
- Can create journal entries
- Can view financial reports
- Cannot manage users or company settings

#### MANAGER
- Management and reporting access
- Can view reports and dashboards
- Can manage inventory and sales
- Cannot modify accounting data

#### SALES_USER
- Sales-focused access
- Can create quotations and invoices
- Can manage customers
- Limited access to other modules

#### PURCHASE_USER
- Purchase-focused access
- Can create purchase orders
- Can manage vendors
- Limited access to other modules

#### INVENTORY_USER
- Inventory management access
- Can manage products and stock
- Can perform stock adjustments
- Limited access to other modules

#### VIEWER
- Read-only access
- Can view reports and data
- Cannot create or modify any data

---

## Testing Multi-Tenant Isolation

### Test Scenario 1: Company Admin Access
1. Login as `companyadmin@test.com`
2. Navigate to Customers list
3. Should see only TechVision Inc's 10 customers
4. Should NOT see Global Retail Co or Manufacturing Solutions customers

### Test Scenario 2: SUPERADMIN Access
1. Login as `superadmin@test.com`
2. Navigate to Companies list
3. Should see all 4 companies (Platform + 3 demo companies)
4. Can switch between companies to view their data

### Test Scenario 3: Cross-Company Isolation
1. Login as `admin@globalretail.com`
2. Note the customer list (should have 10 Global Retail customers)
3. Logout
4. Login as `companyadmin@test.com`
5. Customer list should show TechVision customers, NOT Global Retail customers

---

## API Testing

### Login Endpoint
```bash
curl -X POST https://accounting-software-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@test.com",
    "password": "Test@123456"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "superadmin@test.com",
      "name": "Super Admin",
      "role": "SUPERADMIN",
      "companyId": "..."
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### Get Current User
```bash
curl -X GET https://accounting-software-production.up.railway.app/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Security Notes

1. **Password Strength**: All demo accounts use `Test@123456` which is NOT production-grade. Change in production deployment.

2. **Token Management**:
   - Access tokens expire after 24 hours
   - Refresh tokens expire after 30 days
   - Tokens are stored in localStorage

3. **Multi-Tenant Security**:
   - All API endpoints check `companyId`
   - Database queries are automatically filtered
   - Cross-company access is prevented at middleware level

4. **HTTPS**: All production traffic should use HTTPS (Railway provides this automatically)

---

## Troubleshooting

### Cannot Login
1. Verify you're using the correct email (case-sensitive)
2. Verify password is exactly `Test@123456`
3. Check browser console for errors
4. Verify backend is accessible at https://accounting-software-production.up.railway.app/api/v1/health

### 401 Unauthorized Errors
1. Token may have expired - login again
2. Clear localStorage and login again
3. Check if user account is active

### Cannot See Data
1. Verify you're logged in with the correct company user
2. Check database has been seeded properly
3. Verify multi-tenant filtering is working correctly

### SUPERADMIN Cannot See Companies
1. SUPERADMIN should see all companies
2. Check application role-checking logic
3. Verify SUPERADMIN permissions in backend

---

## Next Steps After Seeding

1. **Test All Login Accounts**: Verify each account can login successfully
2. **Test Multi-Tenant Isolation**: Ensure companies cannot see each other's data
3. **Test RBAC**: Verify role permissions work correctly
4. **Create Sample Transactions**: Add invoices, payments, etc. for more realistic demo
5. **Test All UI Pages**: Navigate through all 100+ pages to ensure they load correctly

---

## Support

For issues or questions about the seeded data:
- Check application logs in Railway dashboard
- Verify database connectivity
- Run health checks on API endpoints
- Review prisma seed logs for any errors
