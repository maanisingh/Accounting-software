# ZirakBook API Testing with Hoppscotch

## 📋 Quick Start Guide

### Step 1: Import the Collection

1. Open **Hoppscotch** (https://hoppscotch.io)
2. Click on **Collections** → **Import**
3. Select `ZirakBook_Hoppscotch_Collection.json`
4. The collection will be imported with all 194 endpoints organized by modules

### Step 2: Set Up Environment Variables

Create a new environment in Hoppscotch with these variables:

```json
{
  "token": "",
  "refreshToken": "",
  "companyId": "",
  "userId": "",
  "productId": "",
  "warehouseId": "",
  "brandId": "",
  "categoryId": "",
  "vendorId": "",
  "customerId": "",
  "purchaseOrderId": "",
  "goodsReceiptId": "",
  "billId": "",
  "paymentId": "",
  "salesOrderId": "",
  "deliveryChallanId": "",
  "invoiceId": "",
  "receiptId": "",
  "accountId": "",
  "journalEntryId": ""
}
```

### Step 3: Create Test Company & User

Run the seed script to create a test company and admin user:

```bash
cd /root/zirabook-accounting-full/backend
node seed_test_data.js
```

This will create:
- **Company**: Test Company Ltd
- **Admin User**:
  - Email: `admin@test.com`
  - Password: `Admin@123`
  - Role: SUPERADMIN

### Step 4: Test the Workflow

#### 4.1 Authentication
1. Go to **1. Authentication** → **Login**
2. Update the body with:
   ```json
   {
     "email": "admin@test.com",
     "password": "Admin@123"
   }
   ```
3. Send the request
4. Copy the `accessToken` from response
5. Set it as the `token` environment variable ({{token}})
6. Also copy `companyId`, `userId` to environment

#### 4.2 Inventory Setup
1. **Create Warehouse** (2. Inventory - Warehouses → Create Warehouse)
   - Copy the `id` from response → save as `warehouseId`
2. **Create Brand** (2. Inventory - Brands → Create Brand)
   - Copy the `id` → save as `brandId`
3. **Create Category** (2. Inventory - Categories → Create Category)
   - Copy the `id` → save as `categoryId`
4. **Create Product** (2. Inventory - Products → Create Product)
   - Update body with `brandId` and `categoryId`
   - Copy the `id` → save as `productId`

#### 4.3 Purchase Cycle
1. **Create Vendor** (3. Purchases - Vendors → Create Vendor)
   - Copy `id` → save as `vendorId`
2. **Create Purchase Order** (3. Purchases - Purchase Orders → Create Purchase Order)
   - Update body with `vendorId` and `productId`
   - Copy `id` → save as `purchaseOrderId`
3. **Approve PO** (3. Purchases - Purchase Orders → Approve Purchase Order)
   - Replace `:id` in URL with `purchaseOrderId`
4. **Create Goods Receipt** (3. Purchases - Goods Receipts → Create Goods Receipt)
   - Update body with `purchaseOrderId`, `warehouseId`, `productId`
   - Copy `id` → save as `goodsReceiptId`
5. **Create Bill** (3. Purchases - Bills → Create Bill)
   - Update body with `vendorId`, `goodsReceiptId`, `productId`
   - Copy `id` → save as `billId`

#### 4.4 Sales Cycle
1. **Create Customer** (4. Sales - Customers → Create Customer)
   - Copy `id` → save as `customerId`
2. **Create Sales Order** (4. Sales - Sales Orders → Create Sales Order)
   - Update body with `customerId` and `productId`
   - Copy `id` → save as `salesOrderId`
3. **Create Delivery Challan** (4. Sales - Delivery Challans → Create Delivery Challan)
   - Update body with `salesOrderId`, `warehouseId`, `productId`
   - Copy `id` → save as `deliveryChallanId`

#### 4.5 Accounts
1. **Create Account** (5. Accounts - Chart of Accounts → Create Account)
   - Copy `id` → save as `accountId`
2. **Create Journal Entry** (5. Accounts - Journal Entries → Create Journal Entry)
   - Update body with `accountId` (use same for both lines to balance)
   - Copy `id` → save as `journalEntryId`
3. **Create Payment** (5. Accounts - Payments → Create Payment)
   - Update body with `vendorId` and `billId`

#### 4.6 Reports
1. Test any report from **6. Reports** folder
2. All reports are ready to use - just update the date parameters

## 📊 Collection Structure

```
ZirakBook API Collection/
├── 1. Authentication (5 endpoints)
│   ├── Register User
│   ├── Login
│   ├── Get Current User
│   ├── Refresh Token
│   └── Logout
├── 2. Inventory (42 endpoints)
│   ├── Products (7 endpoints)
│   ├── Brands (5 endpoints)
│   ├── Categories (5 endpoints)
│   ├── Warehouses (5 endpoints)
│   └── Stock (10 endpoints)
├── 3. Purchases (42 endpoints)
│   ├── Vendors (5 endpoints)
│   ├── Purchase Orders (10 endpoints)
│   ├── Goods Receipts (8 endpoints)
│   ├── Bills (10 endpoints)
│   ├── Purchase Quotations (5 endpoints)
│   └── Purchase Returns (4 endpoints)
├── 4. Sales (18 endpoints)
│   ├── Customers (5 endpoints)
│   ├── Sales Orders (6 endpoints)
│   ├── Delivery Challans (4 endpoints)
│   └── Sales Returns (3 endpoints)
├── 5. Accounts (28 endpoints)
│   ├── Chart of Accounts (8 endpoints)
│   ├── Journal Entries (8 endpoints)
│   ├── Payments (6 endpoints)
│   └── Receipts (6 endpoints)
└── 6. Reports (45+ endpoints)
    ├── Financial (15 endpoints)
    ├── Sales (8 endpoints)
    ├── Inventory (8 endpoints)
    └── Tax (6 endpoints)
```

## 🔐 Important Notes

1. **Authorization**: All endpoints (except login/register) require the `Authorization: Bearer {{token}}` header
2. **Token Expiry**: If you get 401 errors, your token has expired - login again
3. **Variables**: Replace `{{variableName}}` with actual IDs from your environment
4. **Workflows**: Follow the order above for a complete end-to-end test
5. **Status Codes**:
   - 200: Success (GET, PUT, DELETE)
   - 201: Created (POST)
   - 400: Validation Error
   - 401: Unauthorized
   - 404: Not Found
   - 500: Server Error

## 🚀 Testing Tips

1. **Start Fresh**: Use the seed script to create a clean test environment
2. **Save IDs**: As you create entities, save their IDs in environment variables
3. **Follow Order**: Test in sequence - Inventory → Purchases → Sales → Accounts → Reports
4. **Check Stock**: After GRN and Delivery, verify stock levels using the Stock endpoints
5. **Verify Reports**: After transactions, test reports to see the data flowing through

## 📝 Common Issues

### Issue: "Company ID is required"
**Solution**: Run the seed script first, or manually create a company in the database

### Issue: "Invalid credentials"
**Solution**: Make sure you're using the correct email/password from the seed script

### Issue: "Product not found"
**Solution**: Create a product first using the Create Product endpoint

### Issue: "Insufficient stock"
**Solution**: Create a Goods Receipt to add stock before creating Delivery Challan

## 🎯 Key Workflows to Test

### Complete Purchase Cycle
Register → Login → Create Vendor → Create Product → Create PO → Approve PO → Create GRN → Create Bill → Create Payment → Check Reports

### Complete Sales Cycle
Register → Login → Create Customer → Create Product → Add Stock → Create SO → Create Delivery Challan → Create Invoice → Create Receipt → Check Reports

### Accounting Workflow
Create Accounts → Create Journal Entries → Post Entries → View Ledgers → Check Balance Sheet → Check P&L

## 📞 Support

If you encounter any issues:
1. Check the backend log: `tail -f /tmp/zirakbook-backend.log`
2. Verify the backend is running: `curl http://localhost:8020/api/health`
3. Check environment variables are set correctly in Hoppscotch

---

**Happy Testing! 🎉**
