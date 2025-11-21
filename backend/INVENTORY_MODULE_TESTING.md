# Inventory Module Testing Guide

This document provides comprehensive testing instructions for all 42 inventory endpoints.

## Prerequisites

1. Backend server running on `http://localhost:3000`
2. Valid JWT authentication token
3. At least one company created in the database
4. User authenticated with appropriate permissions

## Getting Started

### 1. Obtain Authentication Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourPassword123!"
  }'
```

Copy the `accessToken` from the response and use it in all subsequent requests.

### 2. Set Environment Variables

```bash
export BASE_URL="http://localhost:3000/api/v1"
export TOKEN="your-jwt-token-here"
```

### 3. Run Automated Test Script

```bash
cd /root/zirabook-accounting-full/backend
bash test-inventory-module.sh
```

## Manual Testing - All 42 Endpoints

### BRANDS MODULE (4 endpoints)

#### 1. Create Brand
```bash
curl -X POST $BASE_URL/brands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Apple",
    "description": "Premium electronics brand"
  }'
```

#### 2. Get All Brands
```bash
curl -X GET "$BASE_URL/brands?isActive=true" \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Update Brand
```bash
curl -X PUT $BASE_URL/brands/{brandId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated premium electronics brand"
  }'
```

#### 4. Delete Brand
```bash
curl -X DELETE $BASE_URL/brands/{brandId} \
  -H "Authorization: Bearer $TOKEN"
```

---

### CATEGORIES MODULE (4 endpoints)

#### 5. Create Category
```bash
curl -X POST $BASE_URL/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic devices and accessories"
  }'
```

#### 6. Get All Categories
```bash
curl -X GET "$BASE_URL/categories?flat=false" \
  -H "Authorization: Bearer $TOKEN"
```

#### 7. Update Category
```bash
curl -X PUT $BASE_URL/categories/{categoryId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated electronics category"
  }'
```

#### 8. Delete Category
```bash
curl -X DELETE $BASE_URL/categories/{categoryId} \
  -H "Authorization: Bearer $TOKEN"
```

---

### WAREHOUSES MODULE (6 endpoints)

#### 9. Create Warehouse
```bash
curl -X POST $BASE_URL/warehouses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WH-MAIN",
    "name": "Main Warehouse",
    "address": "123 Industrial Area",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "400001",
    "phone": "9876543210",
    "email": "warehouse@example.com",
    "isDefault": true
  }'
```

#### 10. Get All Warehouses
```bash
curl -X GET "$BASE_URL/warehouses" \
  -H "Authorization: Bearer $TOKEN"
```

#### 11. Get Warehouse by ID
```bash
curl -X GET $BASE_URL/warehouses/{warehouseId} \
  -H "Authorization: Bearer $TOKEN"
```

#### 12. Update Warehouse
```bash
curl -X PUT $BASE_URL/warehouses/{warehouseId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543211",
    "isActive": true
  }'
```

#### 13. Get Warehouse Stock
```bash
curl -X GET "$BASE_URL/warehouses/{warehouseId}/stock?showZero=false" \
  -H "Authorization: Bearer $TOKEN"
```

#### 14. Delete Warehouse
```bash
curl -X DELETE $BASE_URL/warehouses/{warehouseId} \
  -H "Authorization: Bearer $TOKEN"
```

---

### PRODUCTS MODULE (10 endpoints)

#### 15. Create Product
```bash
curl -X POST $BASE_URL/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "IPH-14-PRO-128",
    "name": "iPhone 14 Pro 128GB",
    "description": "Latest iPhone model with pro features",
    "type": "GOODS",
    "categoryId": "{categoryId}",
    "brandId": "{brandId}",
    "barcode": "1234567890123",
    "unit": "PCS",
    "purchasePrice": 85000,
    "sellingPrice": 99990,
    "mrp": 104990,
    "taxRate": 18,
    "hsnCode": "85171300",
    "reorderLevel": 5,
    "minStockLevel": 3,
    "maxStockLevel": 50
  }'
```

#### 16. Get All Products
```bash
curl -X GET "$BASE_URL/products?page=1&limit=20&search=iPhone&sortBy=name&sortOrder=asc" \
  -H "Authorization: Bearer $TOKEN"
```

#### 17. Get Product by ID
```bash
curl -X GET $BASE_URL/products/{productId} \
  -H "Authorization: Bearer $TOKEN"
```

#### 18. Update Product
```bash
curl -X PUT $BASE_URL/products/{productId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sellingPrice": 98990,
    "reorderLevel": 10
  }'
```

#### 19. Delete Product
```bash
curl -X DELETE $BASE_URL/products/{productId} \
  -H "Authorization: Bearer $TOKEN"
```

#### 20. Search Products
```bash
curl -X GET "$BASE_URL/products/search?q=iPhone" \
  -H "Authorization: Bearer $TOKEN"
```

#### 21. Bulk Create Products
```bash
curl -X POST $BASE_URL/products/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "sku": "PROD-001",
        "name": "Product 1",
        "unit": "PCS",
        "sellingPrice": 100
      },
      {
        "sku": "PROD-002",
        "name": "Product 2",
        "unit": "PCS",
        "sellingPrice": 200
      }
    ]
  }'
```

#### 22. Get Product Stock Levels
```bash
curl -X GET $BASE_URL/products/{productId}/stock \
  -H "Authorization: Bearer $TOKEN"
```

#### 23. Adjust Product Stock
```bash
curl -X POST $BASE_URL/products/{productId}/adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouseId": "{warehouseId}",
    "quantity": 100,
    "reason": "Initial stock entry - received from supplier invoice #INV-001",
    "reference": "INV-001"
  }'
```

#### 24. Get Product Movement History
```bash
curl -X GET "$BASE_URL/products/{productId}/movement?page=1&limit=10&movementType=PURCHASE" \
  -H "Authorization: Bearer $TOKEN"
```

---

### STOCK MANAGEMENT MODULE (10 endpoints)

#### 25. Get All Stock
```bash
curl -X GET "$BASE_URL/stock?page=1&limit=20&showZero=false" \
  -H "Authorization: Bearer $TOKEN"
```

#### 26. Get Product Stock Across Warehouses
```bash
curl -X GET $BASE_URL/stock/{productId} \
  -H "Authorization: Bearer $TOKEN"
```

#### 27. Transfer Stock Between Warehouses
```bash
curl -X POST $BASE_URL/stock/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "{productId}",
    "fromWarehouseId": "{warehouseId1}",
    "toWarehouseId": "{warehouseId2}",
    "quantity": 25,
    "notes": "Stock transfer for regional distribution",
    "reference": "TRF-2025-001"
  }'
```

#### 28. Adjust Stock Levels
```bash
curl -X POST $BASE_URL/stock/adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "{productId}",
    "warehouseId": "{warehouseId}",
    "quantity": -3,
    "reason": "Three units found damaged during quality inspection - damaged beyond repair",
    "reference": "QC-REPORT-001"
  }'
```

#### 29. Get Low Stock Products
```bash
curl -X GET $BASE_URL/stock/low \
  -H "Authorization: Bearer $TOKEN"
```

#### 30. Get Out of Stock Products
```bash
curl -X GET $BASE_URL/stock/out \
  -H "Authorization: Bearer $TOKEN"
```

#### 31. Get All Stock Movements
```bash
curl -X GET "$BASE_URL/stock/movements?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

#### 32. Create Reorder Suggestion
```bash
curl -X POST $BASE_URL/stock/reorder \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### 33. Get Stock Valuation
```bash
curl -X GET "$BASE_URL/stock/valuation?warehouseId={warehouseId}" \
  -H "Authorization: Bearer $TOKEN"
```

#### 34. Get Stock Aging Report
```bash
curl -X GET "$BASE_URL/stock/aging?warehouseId={warehouseId}" \
  -H "Authorization: Bearer $TOKEN"
```

---

### STOCK MOVEMENTS MODULE (8 endpoints)

#### 35. Get All Movements
```bash
curl -X GET "$BASE_URL/movements?page=1&limit=20&movementType=PURCHASE" \
  -H "Authorization: Bearer $TOKEN"
```

#### 36. Get Movement by ID
```bash
curl -X GET $BASE_URL/movements/{movementId} \
  -H "Authorization: Bearer $TOKEN"
```

#### 37. Create Manual Movement
```bash
curl -X POST $BASE_URL/movements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "{productId}",
    "warehouseId": "{warehouseId}",
    "movementType": "ADJUSTMENT",
    "quantity": 10,
    "notes": "Stock correction after physical count - found additional units",
    "reference": "STOCK-COUNT-2025-01"
  }'
```

#### 38. Get Movements by Product
```bash
curl -X GET "$BASE_URL/movements/product/{productId}?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### 39. Get Movements by Warehouse
```bash
curl -X GET "$BASE_URL/movements/warehouse/{warehouseId}?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### 40. Get Movements by Type
```bash
curl -X GET "$BASE_URL/movements/type/TRANSFER?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### 41. Get Movements by Date Range
```bash
curl -X GET "$BASE_URL/movements/date-range?startDate=2025-01-01&endDate=2025-01-31&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

#### 42. Bulk Create Movements
```bash
curl -X POST $BASE_URL/movements/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "movements": [
      {
        "productId": "{productId1}",
        "warehouseId": "{warehouseId}",
        "quantity": 50,
        "notes": "Bulk import - supplier delivery batch 1"
      },
      {
        "productId": "{productId2}",
        "warehouseId": "{warehouseId}",
        "quantity": 75,
        "notes": "Bulk import - supplier delivery batch 2"
      }
    ]
  }'
```

---

## Testing Workflow

### Complete Test Flow

1. **Setup Phase**
   - Create a Brand
   - Create a Category
   - Create a Warehouse (will be default)

2. **Product Management**
   - Create products with different configurations
   - Search and filter products
   - Update product details

3. **Stock Operations**
   - Adjust initial stock levels
   - Transfer stock between warehouses
   - Check stock levels and movements

4. **Reporting**
   - Check low stock alerts
   - View stock valuation
   - Generate aging reports

5. **Cleanup** (optional)
   - Delete test data in reverse order
   - Products → Categories → Brands → Warehouses

### Expected Results

All endpoints should return:
- **Success**: HTTP 200/201 with proper JSON response
- **Error**: HTTP 4xx/5xx with descriptive error messages
- Consistent response format with `success`, `message`, `data` fields

### Common Error Scenarios to Test

1. **Validation Errors** (400)
   - Missing required fields
   - Invalid data types
   - Out of range values

2. **Authorization Errors** (401/403)
   - Missing token
   - Expired token
   - Insufficient permissions

3. **Not Found Errors** (404)
   - Invalid product/warehouse/brand/category ID

4. **Business Logic Errors** (400/409)
   - Duplicate SKU
   - Negative stock
   - Delete brand used in products
   - Transfer more stock than available

## Performance Testing

Test with larger datasets:
- Bulk create 100 products
- Paginate through 1000+ items
- Complex filters with multiple conditions

## Notes

- Replace `{productId}`, `{warehouseId}`, `{brandId}`, `{categoryId}`, `{movementId}` with actual IDs from responses
- All dates should be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)
- Stock quantities are integers
- Prices use 2 decimal precision
- Tax rates are percentages (0-100)

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Token expired - login again to get new token
2. **404 Not Found**: Check if IDs are correct and resources exist
3. **409 Conflict**: Duplicate SKU/code - use unique values
4. **400 Bad Request**: Check request body format and required fields

### Debug Tips

- Use `-v` flag with curl for verbose output
- Check backend logs for detailed error messages
- Verify database state directly if needed
- Use tools like Postman for easier testing during development
