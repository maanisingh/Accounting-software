#!/bin/bash

###############################################################################
# ZirakBook Accounting System - Sales Module Testing Script
# Tests all 18 sales endpoints with complete workflow scenarios
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:5000/api/v1"
CONTENT_TYPE="Content-Type: application/json"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Variables to store IDs
TOKEN=""
COMPANY_ID=""
CUSTOMER_ID=""
PRODUCT_ID=""
WAREHOUSE_ID=""
SALES_QUOTATION_ID=""
SALES_ORDER_ID=""
DELIVERY_CHALLAN_ID=""
SALES_RETURN_ID=""
INVOICE_ID=""

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST $TOTAL_TESTS: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ PASSED: $1${NC}\n"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}✗ FAILED: $1${NC}\n"
    ((FAILED_TESTS++))
}

run_test() {
    local test_name=$1
    local endpoint=$2
    local method=$3
    local data=$4

    ((TOTAL_TESTS++))
    print_test "$test_name"

    if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "$CONTENT_TYPE" \
            -H "Authorization: Bearer $TOKEN")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "$CONTENT_TYPE" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data")
    fi

    echo "Response: $response"

    if echo "$response" | grep -q '"success":true'; then
        print_success "$test_name"
        echo "$response"
    else
        print_error "$test_name"
        echo "$response"
        return 1
    fi
}

###############################################################################
# Setup & Authentication
###############################################################################

print_header "SETUP: Authentication & Prerequisites"

# Login
echo -e "${YELLOW}Logging in...${NC}"
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "$CONTENT_TYPE" \
    -d '{
        "email": "admin@zirakbook.com",
        "password": "Admin@123"
    }')

echo "Login Response: $login_response"

TOKEN=$(echo $login_response | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
COMPANY_ID=$(echo $login_response | grep -o '"companyId":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get authentication token. Please ensure:"
    echo "1. The backend server is running on port 5000"
    echo "2. The database is set up correctly"
    echo "3. The admin user exists with email: admin@zirakbook.com${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo "Company ID: $COMPANY_ID"

###############################################################################
# Prerequisites Setup
###############################################################################

print_header "SETUP: Creating Prerequisites (Customer, Product, Warehouse)"

# Create Customer
echo -e "${YELLOW}Creating Customer...${NC}"
customer_response=$(curl -s -X POST "$BASE_URL/customers" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "name": "Test Customer Ltd",
        "email": "customer@test.com",
        "phone": "+1234567890",
        "address": "123 Customer Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "postalCode": "400001",
        "taxNumber": "27AABCU9603R1ZM",
        "creditLimit": 100000,
        "creditDays": 30
    }')

CUSTOMER_ID=$(echo $customer_response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}Customer created: $CUSTOMER_ID${NC}"

# Create Warehouse
echo -e "${YELLOW}Creating Warehouse...${NC}"
warehouse_response=$(curl -s -X POST "$BASE_URL/warehouses" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "code": "WH-TEST-01",
        "name": "Test Warehouse",
        "address": "456 Warehouse Ave",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "isDefault": true
    }')

WAREHOUSE_ID=$(echo $warehouse_response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}Warehouse created: $WAREHOUSE_ID${NC}"

# Create Product with Initial Stock
echo -e "${YELLOW}Creating Product...${NC}"
product_response=$(curl -s -X POST "$BASE_URL/products" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "sku": "PROD-SALES-001",
        "name": "Test Sales Product",
        "description": "Product for sales testing",
        "type": "GOODS",
        "unit": "PCS",
        "purchasePrice": 500,
        "sellingPrice": 1000,
        "mrp": 1200,
        "taxRate": 18,
        "hsnCode": "8471",
        "reorderLevel": 10,
        "minStockLevel": 5,
        "maxStockLevel": 1000,
        "isSaleable": true,
        "isPurchasable": true,
        "trackInventory": true
    }')

PRODUCT_ID=$(echo $product_response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}Product created: $PRODUCT_ID${NC}"

# Add Opening Stock
echo -e "${YELLOW}Adding opening stock...${NC}"
stock_response=$(curl -s -X POST "$BASE_URL/stock/opening" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"productId\": \"$PRODUCT_ID\",
        \"warehouseId\": \"$WAREHOUSE_ID\",
        \"quantity\": 100,
        \"unitPrice\": 500
    }")

echo -e "${GREEN}Stock added: 100 units${NC}\n"

###############################################################################
# Sales Quotation Tests (6 endpoints)
###############################################################################

print_header "SALES QUOTATIONS (6 Endpoints)"

# 1. Create Sales Quotation
run_test "Create Sales Quotation" \
    "/sales-quotations" \
    "POST" \
    "{
        \"customerId\": \"$CUSTOMER_ID\",
        \"quotationDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"validTill\": \"$(date -u -d '+30 days' +%Y-%m-%dT%H:%M:%SZ)\",
        \"referenceNo\": \"CUST-REF-001\",
        \"shippingAddress\": \"123 Customer Street, Mumbai, Maharashtra 400001\",
        \"items\": [
            {
                \"productId\": \"$PRODUCT_ID\",
                \"description\": \"Test Sales Product\",
                \"quantity\": 10,
                \"unitPrice\": 1000,
                \"taxRate\": 18,
                \"discountAmount\": 500
            }
        ],
        \"notes\": \"Please confirm within 7 days\",
        \"terms\": \"Payment within 30 days of invoice date\"
    }" && SALES_QUOTATION_ID=$(echo $response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Sales Quotation ID: $SALES_QUOTATION_ID"

# 2. Get All Sales Quotations
run_test "Get All Sales Quotations" \
    "/sales-quotations?page=1&limit=10" \
    "GET"

# 3. Get Sales Quotation by ID
run_test "Get Sales Quotation by ID" \
    "/sales-quotations/$SALES_QUOTATION_ID" \
    "GET"

# 4. Update Sales Quotation
run_test "Update Sales Quotation" \
    "/sales-quotations/$SALES_QUOTATION_ID" \
    "PUT" \
    "{
        \"notes\": \"Updated: Please confirm within 5 days\",
        \"status\": \"SENT\"
    }"

# 5. Convert Quotation to Sales Order
run_test "Convert Quotation to Sales Order" \
    "/sales-quotations/$SALES_QUOTATION_ID/convert" \
    "POST" \
    "{
        \"orderDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"deliveryDate\": \"$(date -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ)\",
        \"notes\": \"Converted from quotation\"
    }" && SALES_ORDER_ID=$(echo $response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Sales Order ID: $SALES_ORDER_ID"

# 6. Delete Sales Quotation (create new one first)
echo -e "${YELLOW}Creating another quotation for deletion test...${NC}"
delete_quotation_response=$(curl -s -X POST "$BASE_URL/sales-quotations" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"customerId\": \"$CUSTOMER_ID\",
        \"items\": [{
            \"productId\": \"$PRODUCT_ID\",
            \"quantity\": 5,
            \"unitPrice\": 1000,
            \"taxRate\": 18
        }]
    }")

DELETE_QUOTATION_ID=$(echo $delete_quotation_response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

run_test "Delete Sales Quotation" \
    "/sales-quotations/$DELETE_QUOTATION_ID" \
    "DELETE"

###############################################################################
# Sales Order Tests (6 endpoints)
###############################################################################

print_header "SALES ORDERS (6 Endpoints)"

# 7. Create Sales Order (Manual - without quotation)
run_test "Create Sales Order (Manual)" \
    "/sales-orders" \
    "POST" \
    "{
        \"customerId\": \"$CUSTOMER_ID\",
        \"orderDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"deliveryDate\": \"$(date -u -d '+10 days' +%Y-%m-%dT%H:%M:%SZ)\",
        \"shippingAddress\": \"123 Customer Street, Mumbai\",
        \"items\": [
            {
                \"productId\": \"$PRODUCT_ID\",
                \"description\": \"Manual order\",
                \"quantity\": 5,
                \"unitPrice\": 1000,
                \"taxRate\": 18,
                \"discountAmount\": 200
            }
        ],
        \"notes\": \"Manual sales order\",
        \"terms\": \"Payment within 30 days\"
    }" && MANUAL_SO_ID=$(echo $response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Manual Sales Order ID: $MANUAL_SO_ID"

# 8. Get All Sales Orders
run_test "Get All Sales Orders" \
    "/sales-orders?page=1&limit=10" \
    "GET"

# 9. Get Sales Order by ID
run_test "Get Sales Order by ID" \
    "/sales-orders/$SALES_ORDER_ID" \
    "GET"

# 10. Update Sales Order
run_test "Update Sales Order" \
    "/sales-orders/$MANUAL_SO_ID" \
    "PUT" \
    "{
        \"notes\": \"Updated order notes\",
        \"status\": \"APPROVED\"
    }"

# 11. Delete Sales Order (create new one first)
echo -e "${YELLOW}Creating another order for deletion test...${NC}"
delete_order_response=$(curl -s -X POST "$BASE_URL/sales-orders" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"customerId\": \"$CUSTOMER_ID\",
        \"items\": [{
            \"productId\": \"$PRODUCT_ID\",
            \"quantity\": 2,
            \"unitPrice\": 1000,
            \"taxRate\": 18
        }]
    }")

DELETE_ORDER_ID=$(echo $delete_order_response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

run_test "Delete Sales Order" \
    "/sales-orders/$DELETE_ORDER_ID" \
    "DELETE"

###############################################################################
# Delivery Challan Tests (4 endpoints)
###############################################################################

print_header "DELIVERY CHALLANS (4 Endpoints)"

# 12. Create Delivery Challan
run_test "Create Delivery Challan" \
    "/delivery-challans" \
    "POST" \
    "{
        \"customerId\": \"$CUSTOMER_ID\",
        \"salesOrderId\": \"$SALES_ORDER_ID\",
        \"challanDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"shippingAddress\": \"123 Customer Street, Mumbai\",
        \"vehicleNo\": \"MH-01-AB-1234\",
        \"driverName\": \"John Doe\",
        \"driverPhone\": \"+919876543210\",
        \"transportMode\": \"Road\",
        \"items\": [
            {
                \"productId\": \"$PRODUCT_ID\",
                \"description\": \"Delivery for SO\",
                \"quantity\": 10,
                \"unitPrice\": 1000,
                \"taxRate\": 18,
                \"discountAmount\": 500,
                \"warehouseId\": \"$WAREHOUSE_ID\"
            }
        ],
        \"notes\": \"Handle with care\"
    }" && DELIVERY_CHALLAN_ID=$(echo $response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Delivery Challan ID: $DELIVERY_CHALLAN_ID"

# 13. Get All Delivery Challans
run_test "Get All Delivery Challans" \
    "/delivery-challans?page=1&limit=10" \
    "GET"

# 14. Get Delivery Challan by ID
run_test "Get Delivery Challan by ID" \
    "/delivery-challans/$DELIVERY_CHALLAN_ID" \
    "GET"

# 15. Delete Delivery Challan (will reverse stock)
echo -e "${YELLOW}Creating another challan for deletion test...${NC}"
delete_challan_response=$(curl -s -X POST "$BASE_URL/delivery-challans" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"customerId\": \"$CUSTOMER_ID\",
        \"items\": [{
            \"productId\": \"$PRODUCT_ID\",
            \"quantity\": 3,
            \"unitPrice\": 1000,
            \"taxRate\": 18,
            \"warehouseId\": \"$WAREHOUSE_ID\"
        }]
    }")

DELETE_CHALLAN_ID=$(echo $delete_challan_response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

run_test "Delete Delivery Challan (Stock Reversal)" \
    "/delivery-challans/$DELETE_CHALLAN_ID" \
    "DELETE"

###############################################################################
# Sales Return Tests (2 endpoints)
###############################################################################

print_header "SALES RETURNS (2 Endpoints)"

# 16. Create Sales Return
run_test "Create Sales Return" \
    "/sales-returns" \
    "POST" \
    "{
        \"customerId\": \"$CUSTOMER_ID\",
        \"returnDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"reason\": \"Customer returned damaged products\",
        \"items\": [
            {
                \"productId\": \"$PRODUCT_ID\",
                \"description\": \"Damaged product\",
                \"quantity\": 2,
                \"returnReason\": \"DAMAGED\",
                \"unitPrice\": 1000,
                \"taxRate\": 18,
                \"discountAmount\": 0,
                \"warehouseId\": \"$WAREHOUSE_ID\"
            }
        ],
        \"notes\": \"Products were damaged during shipping\"
    }" && SALES_RETURN_ID=$(echo $response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Sales Return ID: $SALES_RETURN_ID"

# 17. Get All Sales Returns
run_test "Get All Sales Returns" \
    "/sales-returns?page=1&limit=10" \
    "GET"

# 18. Get Sales Return by ID
run_test "Get Sales Return by ID" \
    "/sales-returns/$SALES_RETURN_ID" \
    "GET"

###############################################################################
# Integration Test: Convert Sales Order to Invoice
###############################################################################

print_header "INTEGRATION TEST: Convert Sales Order to Invoice"

# First, update the SO status to APPROVED
curl -s -X PUT "$BASE_URL/sales-orders/$MANUAL_SO_ID" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"status": "APPROVED"}' > /dev/null

run_test "Convert Sales Order to Invoice" \
    "/sales-orders/$MANUAL_SO_ID/invoice" \
    "POST" \
    "{
        \"invoiceDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"notes\": \"Invoice from sales order\"
    }" && INVOICE_ID=$(echo $response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Invoice ID: $INVOICE_ID"

###############################################################################
# Verify Stock Movements
###############################################################################

print_header "VERIFICATION: Stock Movements"

echo -e "${YELLOW}Checking stock movements for product...${NC}"
stock_movements=$(curl -s -X GET "$BASE_URL/movements?productId=$PRODUCT_ID" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $TOKEN")

echo "Stock Movements:"
echo "$stock_movements" | grep -o '"referenceType":"[^"]*' || echo "No movements found"
echo "$stock_movements" | grep -o '"quantity":[^,}]*' || echo "No quantities found"

echo -e "${YELLOW}Checking current stock levels...${NC}"
stock_levels=$(curl -s -X GET "$BASE_URL/stock" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $TOKEN")

echo "Current Stock:"
echo "$stock_levels" | grep -o '"quantity":[^,}]*' | head -1
echo "$stock_levels" | grep -o '"availableQty":[^,}]*' | head -1

###############################################################################
# Test Summary
###############################################################################

print_header "TEST SUMMARY"

echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Generated IDs for reference:${NC}"
    echo "Customer ID: $CUSTOMER_ID"
    echo "Product ID: $PRODUCT_ID"
    echo "Warehouse ID: $WAREHOUSE_ID"
    echo "Sales Quotation ID: $SALES_QUOTATION_ID"
    echo "Sales Order ID: $SALES_ORDER_ID"
    echo "Delivery Challan ID: $DELIVERY_CHALLAN_ID"
    echo "Sales Return ID: $SALES_RETURN_ID"
    echo "Invoice ID: $INVOICE_ID"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please check the output above.${NC}"
    exit 1
fi
