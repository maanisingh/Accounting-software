# ZirakBook Inventory Module - Quick Start Guide

## 5-Minute Setup & Test

### Step 1: Prerequisites Check
```bash
# Ensure backend is running
cd /root/zirabook-accounting-full/backend
npm install
npm run dev
```

### Step 2: Get Authentication Token
```bash
# Login (replace with your credentials)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourPassword123!"
  }'

# Copy the "accessToken" from response
```

### Step 3: Set Token Variable
```bash
export TOKEN="paste-your-token-here"
export BASE_URL="http://localhost:3000/api/v1"
```

### Step 4: Quick Test - Create Workflow

#### 4.1 Create a Brand
```bash
BRAND_ID=$(curl -s -X POST $BASE_URL/brands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Apple","description":"Premium electronics"}' \
  | jq -r '.data.id')

echo "Brand ID: $BRAND_ID"
```

#### 4.2 Create a Category
```bash
CATEGORY_ID=$(curl -s -X POST $BASE_URL/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smartphones","description":"Mobile phones"}' \
  | jq -r '.data.id')

echo "Category ID: $CATEGORY_ID"
```

#### 4.3 Create a Warehouse
```bash
WAREHOUSE_ID=$(curl -s -X POST $BASE_URL/warehouses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"WH-01","name":"Main Warehouse","city":"Mumbai","isDefault":true}' \
  | jq -r '.data.id')

echo "Warehouse ID: $WAREHOUSE_ID"
```

#### 4.4 Create a Product
```bash
PRODUCT_ID=$(curl -s -X POST $BASE_URL/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sku\":\"IPH-14-128\",
    \"name\":\"iPhone 14 128GB\",
    \"unit\":\"PCS\",
    \"purchasePrice\":85000,
    \"sellingPrice\":99990,
    \"taxRate\":18,
    \"reorderLevel\":5,
    \"categoryId\":\"$CATEGORY_ID\",
    \"brandId\":\"$BRAND_ID\"
  }" | jq -r '.data.id')

echo "Product ID: $PRODUCT_ID"
```

#### 4.5 Add Initial Stock
```bash
curl -X POST $BASE_URL/products/$PRODUCT_ID/adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"warehouseId\":\"$WAREHOUSE_ID\",
    \"quantity\":50,
    \"reason\":\"Initial stock entry from supplier invoice #INV-001\"
  }"
```

#### 4.6 Check Stock Level
```bash
curl -X GET $BASE_URL/products/$PRODUCT_ID/stock \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## All 42 Endpoints Ready

- Products: 10 endpoints
- Brands: 4 endpoints
- Categories: 4 endpoints
- Warehouses: 6 endpoints
- Stock: 10 endpoints
- Movements: 8 endpoints

**Total: 42/42 Complete**

See INVENTORY_MODULE_TESTING.md for full details.
