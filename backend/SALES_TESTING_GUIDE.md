# Sales Module Testing Guide

## Quick Start

### Run Automated Tests
```bash
cd /root/zirabook-accounting-full/backend
./test-sales-module.sh
```

The script will:
1. Authenticate
2. Create prerequisites (Customer, Product, Warehouse)
3. Test all 18 endpoints
4. Verify stock movements
5. Show summary with pass/fail counts

---

## Manual Testing with cURL

### Prerequisites Setup

1. **Login**
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zirakbook.com","password":"Admin@123"}' | \
  jq -r '.data.accessToken')

echo $TOKEN
```

2. **Create Customer**
```bash
CUSTOMER_ID=$(curl -s -X POST http://localhost:5000/api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Customer Ltd",
    "email": "customer@test.com",
    "phone": "+1234567890",
    "creditLimit": 100000,
    "creditDays": 30
  }' | jq -r '.data.id')

echo $CUSTOMER_ID
```

3. **Create Product with Stock**
```bash
PRODUCT_ID=$(curl -s -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "sku": "PROD-TEST-001",
    "name": "Test Product",
    "sellingPrice": 1000,
    "taxRate": 18,
    "isSaleable": true
  }' | jq -r '.data.id')

# Get warehouse ID
WAREHOUSE_ID=$(curl -s -X GET "http://localhost:5000/api/v1/warehouses" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

# Add stock
curl -s -X POST http://localhost:5000/api/v1/stock/opening \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"warehouseId\": \"$WAREHOUSE_ID\",
    \"quantity\": 100,
    \"unitPrice\": 500
  }"
```

---

## Test Scenarios

### Scenario 1: Complete Sales Workflow

#### Step 1: Create Quotation
```bash
QUOTATION_ID=$(curl -s -X POST http://localhost:5000/api/v1/sales-quotations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"validTill\": \"2025-12-31T23:59:59Z\",
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 10,
        \"unitPrice\": 1000,
        \"taxRate\": 18,
        \"discountAmount\": 500
      }
    ],
    \"notes\": \"Please confirm within 7 days\"
  }" | jq -r '.data.id')

echo "Quotation ID: $QUOTATION_ID"
```

#### Step 2: Convert to Sales Order
```bash
ORDER_ID=$(curl -s -X POST "http://localhost:5000/api/v1/sales-quotations/$QUOTATION_ID/convert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}' | jq -r '.data.id')

echo "Order ID: $ORDER_ID"
```

#### Step 3: Approve Order
```bash
curl -s -X PUT "http://localhost:5000/api/v1/sales-orders/$ORDER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "APPROVED"}' | jq
```

#### Step 4: Create Delivery Challan
```bash
CHALLAN_ID=$(curl -s -X POST http://localhost:5000/api/v1/delivery-challans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"salesOrderId\": \"$ORDER_ID\",
    \"vehicleNo\": \"MH-01-AB-1234\",
    \"driverName\": \"John Doe\",
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 10,
        \"unitPrice\": 1000,
        \"taxRate\": 18,
        \"discountAmount\": 500,
        \"warehouseId\": \"$WAREHOUSE_ID\"
      }
    ]
  }" | jq -r '.data.id')

echo "Challan ID: $CHALLAN_ID"
```

#### Step 5: Verify Stock Reduced
```bash
curl -s -X GET "http://localhost:5000/api/v1/stock?productId=$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0] | {quantity, availableQty}'
```

#### Step 6: Convert Order to Invoice
```bash
INVOICE_ID=$(curl -s -X POST "http://localhost:5000/api/v1/sales-orders/$ORDER_ID/invoice" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}' | jq -r '.data.id')

echo "Invoice ID: $INVOICE_ID"
```

---

### Scenario 2: Sales Return

#### Create Return
```bash
RETURN_ID=$(curl -s -X POST http://localhost:5000/api/v1/sales-returns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"invoiceId\": \"$INVOICE_ID\",
    \"reason\": \"Damaged products\",
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 2,
        \"returnReason\": \"DAMAGED\",
        \"unitPrice\": 1000,
        \"taxRate\": 18,
        \"warehouseId\": \"$WAREHOUSE_ID\"
      }
    ]
  }" | jq -r '.data.id')

echo "Return ID: $RETURN_ID"
```

#### Verify Stock Increased
```bash
curl -s -X GET "http://localhost:5000/api/v1/stock?productId=$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0] | {quantity, availableQty}'
```

---

### Scenario 3: Delete Challan (Stock Reversal)

#### Delete Challan
```bash
curl -s -X DELETE "http://localhost:5000/api/v1/delivery-challans/$CHALLAN_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### Verify Stock Reversed
```bash
curl -s -X GET "http://localhost:5000/api/v1/stock?productId=$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0] | {quantity, availableQty}'
```

---

## List Operations

### List Quotations
```bash
curl -s -X GET "http://localhost:5000/api/v1/sales-quotations?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### List Orders
```bash
curl -s -X GET "http://localhost:5000/api/v1/sales-orders?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### List Challans
```bash
curl -s -X GET "http://localhost:5000/api/v1/delivery-challans?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### List Returns
```bash
curl -s -X GET "http://localhost:5000/api/v1/sales-returns?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Filter Examples

### Filter by Customer
```bash
curl -s -X GET "http://localhost:5000/api/v1/sales-orders?customerId=$CUSTOMER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Filter by Status
```bash
curl -s -X GET "http://localhost:5000/api/v1/sales-quotations?status=DRAFT" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Filter by Date Range
```bash
curl -s -X GET "http://localhost:5000/api/v1/sales-orders?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Search
```bash
curl -s -X GET "http://localhost:5000/api/v1/sales-quotations?search=SQ-0001" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Stock Movement Verification

### View Stock Movements
```bash
curl -s -X GET "http://localhost:5000/api/v1/movements?productId=$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Current Stock Levels
```bash
curl -s -X GET "http://localhost:5000/api/v1/stock" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Error Testing

### Credit Limit Exceeded
```bash
# Create order exceeding credit limit
curl -s -X POST http://localhost:5000/api/v1/sales-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 1000,
        \"unitPrice\": 1000,
        \"taxRate\": 18
      }
    ]
  }" | jq
```

### Insufficient Stock
```bash
# Try to deliver more than available
curl -s -X POST http://localhost:5000/api/v1/delivery-challans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 999,
        \"unitPrice\": 1000,
        \"taxRate\": 18,
        \"warehouseId\": \"$WAREHOUSE_ID\"
      }
    ]
  }" | jq
```

### Invalid Status Transition
```bash
# Try to delete approved order
curl -s -X DELETE "http://localhost:5000/api/v1/sales-orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Expected Results

### Successful Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-11-21T08:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "timestamp": "2025-11-21T08:00:00.000Z"
}
```

---

## Verification Checklist

After running tests, verify:

- [ ] All quotations created successfully
- [ ] Quotation converts to order correctly
- [ ] Order validates credit limit
- [ ] Delivery challan reduces stock
- [ ] Stock movements recorded correctly
- [ ] Sales return increases stock
- [ ] Challan deletion reverses stock
- [ ] Invoice created from order
- [ ] Customer balance updated
- [ ] All list endpoints return data
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] Error cases handled properly

---

## Troubleshooting

### Issue: "Token expired"
```bash
# Re-login
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zirakbook.com","password":"Admin@123"}' | \
  jq -r '.data.accessToken')
```

### Issue: "Customer not found"
```bash
# List customers to get valid ID
curl -s -X GET http://localhost:5000/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0].id'
```

### Issue: "Product not found"
```bash
# List products to get valid ID
curl -s -X GET http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0].id'
```

### Issue: "Insufficient stock"
```bash
# Check current stock
curl -s -X GET "http://localhost:5000/api/v1/stock?productId=$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# Add more stock if needed
curl -s -X POST http://localhost:5000/api/v1/stock/adjustment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"warehouseId\": \"$WAREHOUSE_ID\",
    \"quantity\": 50,
    \"adjustmentType\": \"IN\",
    \"reason\": \"Stock adjustment\"
  }"
```

---

## Performance Testing

### Load Test Example
```bash
# Create 100 quotations
for i in {1..100}; do
  curl -s -X POST http://localhost:5000/api/v1/sales-quotations \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"customerId\": \"$CUSTOMER_ID\",
      \"items\": [{
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 1,
        \"unitPrice\": 1000,
        \"taxRate\": 18
      }]
    }" > /dev/null &
done

wait
echo "Load test complete"
```

---

## Integration with Other Modules

### Check Inventory Impact
```bash
# Before delivery
curl -s -X GET "http://localhost:5000/api/v1/stock" \
  -H "Authorization: Bearer $TOKEN" | jq

# Create delivery challan
# ... (delivery challan creation)

# After delivery
curl -s -X GET "http://localhost:5000/api/v1/stock" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Check Stock Movements
```bash
curl -s -X GET "http://localhost:5000/api/v1/movements?movementType=SALE" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Tips

1. **Use jq for pretty output:**
   ```bash
   curl ... | jq
   ```

2. **Save IDs for reuse:**
   ```bash
   ID=$(curl ... | jq -r '.data.id')
   ```

3. **Check response success:**
   ```bash
   curl ... | jq '.success'
   ```

4. **View only specific fields:**
   ```bash
   curl ... | jq '.data | {id, orderNumber, total}'
   ```

5. **Count results:**
   ```bash
   curl ... | jq '.pagination.total'
   ```

---

## Quick Commands Reference

```bash
# Set base variables
export TOKEN="your_token_here"
export BASE_URL="http://localhost:5000/api/v1"

# List all quotations
curl -s "$BASE_URL/sales-quotations" -H "Authorization: Bearer $TOKEN" | jq

# Get quotation details
curl -s "$BASE_URL/sales-quotations/{id}" -H "Authorization: Bearer $TOKEN" | jq

# List all orders
curl -s "$BASE_URL/sales-orders" -H "Authorization: Bearer $TOKEN" | jq

# Get order details
curl -s "$BASE_URL/sales-orders/{id}" -H "Authorization: Bearer $TOKEN" | jq

# List all challans
curl -s "$BASE_URL/delivery-challans" -H "Authorization: Bearer $TOKEN" | jq

# List all returns
curl -s "$BASE_URL/sales-returns" -H "Authorization: Bearer $TOKEN" | jq
```

---

**For automated testing, simply run:**
```bash
./test-sales-module.sh
```
