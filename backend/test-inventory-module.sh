#!/bin/bash

# ZirakBook Accounting System - Inventory Module Testing Script
# Tests all 42 inventory endpoints
#
# Usage:
#   1. Set your BASE_URL and TOKEN
#   2. Run: bash test-inventory-module.sh

# Configuration
BASE_URL="http://localhost:3000/api/v1"
TOKEN="your-jwt-token-here"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test header
print_header() {
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}========================================${NC}\n"
}

# Function to run a test
run_test() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}Test $TOTAL_TESTS: $test_name${NC}"

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    echo "Response: $body" | head -c 200
    echo -e "\n"
}

# Check if token is set
if [ "$TOKEN" == "your-jwt-token-here" ]; then
    echo -e "${RED}ERROR: Please set your JWT token in the TOKEN variable${NC}"
    echo "To get a token:"
    echo "  1. Login: curl -X POST $BASE_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"your@email.com\",\"password\":\"yourpassword\"}'"
    echo "  2. Copy the token from the response"
    echo "  3. Update the TOKEN variable in this script"
    exit 1
fi

# ========================================
# START TESTING
# ========================================

print_header "BRANDS MODULE (4 endpoints)"

run_test "Create Brand" POST "/brands" \
'{
  "name": "Test Brand",
  "description": "A test brand for inventory"
}'

run_test "Get All Brands" GET "/brands"

run_test "Update Brand" PUT "/brands/BRAND_ID_HERE" \
'{
  "description": "Updated description"
}'

run_test "Delete Brand" DELETE "/brands/BRAND_ID_HERE"

# ========================================
print_header "CATEGORIES MODULE (4 endpoints)"

run_test "Create Category" POST "/categories" \
'{
  "name": "Electronics",
  "description": "Electronic products"
}'

run_test "Get All Categories" GET "/categories"

run_test "Update Category" PUT "/categories/CATEGORY_ID_HERE" \
'{
  "description": "Updated electronics category"
}'

run_test "Delete Category" DELETE "/categories/CATEGORY_ID_HERE"

# ========================================
print_header "WAREHOUSES MODULE (6 endpoints)"

run_test "Create Warehouse" POST "/warehouses" \
'{
  "code": "WH-01",
  "name": "Main Warehouse",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "phone": "9876543210",
  "isDefault": true
}'

run_test "Get All Warehouses" GET "/warehouses"

run_test "Get Warehouse by ID" GET "/warehouses/WAREHOUSE_ID_HERE"

run_test "Update Warehouse" PUT "/warehouses/WAREHOUSE_ID_HERE" \
'{
  "city": "New Mumbai"
}'

run_test "Get Warehouse Stock" GET "/warehouses/WAREHOUSE_ID_HERE/stock"

run_test "Delete Warehouse" DELETE "/warehouses/WAREHOUSE_ID_HERE"

# ========================================
print_header "PRODUCTS MODULE (10 endpoints)"

run_test "Create Product" POST "/products" \
'{
  "sku": "PROD-001",
  "name": "Test Product",
  "description": "A test product",
  "unit": "PCS",
  "purchasePrice": 100,
  "sellingPrice": 150,
  "taxRate": 18,
  "reorderLevel": 10
}'

run_test "Get All Products" GET "/products?page=1&limit=10"

run_test "Get Product by ID" GET "/products/PRODUCT_ID_HERE"

run_test "Update Product" PUT "/products/PRODUCT_ID_HERE" \
'{
  "sellingPrice": 160
}'

run_test "Search Products" GET "/products/search?q=Test"

run_test "Bulk Create Products" POST "/products/bulk" \
'{
  "products": [
    {
      "sku": "BULK-001",
      "name": "Bulk Product 1",
      "unit": "PCS",
      "sellingPrice": 100
    },
    {
      "sku": "BULK-002",
      "name": "Bulk Product 2",
      "unit": "PCS",
      "sellingPrice": 200
    }
  ]
}'

run_test "Get Product Stock" GET "/products/PRODUCT_ID_HERE/stock"

run_test "Adjust Product Stock" POST "/products/PRODUCT_ID_HERE/adjust" \
'{
  "warehouseId": "WAREHOUSE_ID_HERE",
  "quantity": 50,
  "reason": "Initial stock entry for testing purposes"
}'

run_test "Get Product Movement History" GET "/products/PRODUCT_ID_HERE/movement?page=1&limit=10"

run_test "Delete Product" DELETE "/products/PRODUCT_ID_HERE"

# ========================================
print_header "STOCK MANAGEMENT MODULE (10 endpoints)"

run_test "Get All Stock" GET "/stock?page=1&limit=10"

run_test "Get Product Stock Across Warehouses" GET "/stock/PRODUCT_ID_HERE"

run_test "Transfer Stock Between Warehouses" POST "/stock/transfer" \
'{
  "productId": "PRODUCT_ID_HERE",
  "fromWarehouseId": "WAREHOUSE_1_ID",
  "toWarehouseId": "WAREHOUSE_2_ID",
  "quantity": 10,
  "notes": "Transfer for testing",
  "reference": "TRF-001"
}'

run_test "Adjust Stock Levels" POST "/stock/adjust" \
'{
  "productId": "PRODUCT_ID_HERE",
  "warehouseId": "WAREHOUSE_ID_HERE",
  "quantity": -5,
  "reason": "Damaged items removed from inventory during quality check"
}'

run_test "Get Low Stock Products" GET "/stock/low"

run_test "Get Out of Stock Products" GET "/stock/out"

run_test "Get All Stock Movements" GET "/stock/movements?page=1&limit=10"

run_test "Create Reorder Suggestion" POST "/stock/reorder"

run_test "Get Stock Valuation" GET "/stock/valuation"

run_test "Get Stock Aging Report" GET "/stock/aging"

# ========================================
print_header "STOCK MOVEMENTS MODULE (8 endpoints)"

run_test "Get All Movements" GET "/movements?page=1&limit=10"

run_test "Get Movement by ID" GET "/movements/MOVEMENT_ID_HERE"

run_test "Create Manual Movement" POST "/movements" \
'{
  "productId": "PRODUCT_ID_HERE",
  "warehouseId": "WAREHOUSE_ID_HERE",
  "movementType": "ADJUSTMENT",
  "quantity": 5,
  "notes": "Manual adjustment for testing purposes",
  "reference": "ADJ-001"
}'

run_test "Get Movements by Product" GET "/movements/product/PRODUCT_ID_HERE?page=1&limit=10"

run_test "Get Movements by Warehouse" GET "/movements/warehouse/WAREHOUSE_ID_HERE?page=1&limit=10"

run_test "Get Movements by Type" GET "/movements/type/ADJUSTMENT?page=1&limit=10"

run_test "Get Movements by Date Range" GET "/movements/date-range?startDate=2025-01-01&endDate=2025-12-31"

run_test "Bulk Create Movements" POST "/movements/bulk" \
'{
  "movements": [
    {
      "productId": "PRODUCT_ID_HERE",
      "warehouseId": "WAREHOUSE_ID_HERE",
      "quantity": 10,
      "notes": "Bulk movement 1 for testing"
    },
    {
      "productId": "PRODUCT_ID_HERE",
      "warehouseId": "WAREHOUSE_ID_HERE",
      "quantity": 15,
      "notes": "Bulk movement 2 for testing"
    }
  ]
}'

# ========================================
# SUMMARY
# ========================================

print_header "TEST SUMMARY"

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed! ✓${NC}\n"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please check the output above.${NC}\n"
    exit 1
fi
