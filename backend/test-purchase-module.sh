#!/bin/bash

# ZirakBook Accounting System - Purchase Module Testing Script
# Tests all 42 endpoints of the Purchase Module
# Phase 2 Implementation

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:5000/api/v1"
TOKEN=""
COMPANY_ID=""
VENDOR_ID=""
PRODUCT_ID=""
WAREHOUSE_ID=""

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print colored output
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to make API request
api_request() {
    local METHOD=$1
    local ENDPOINT=$2
    local DATA=$3

    if [ -z "$DATA" ]; then
        curl -s -X $METHOD \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            "$BASE_URL$ENDPOINT"
    else
        curl -s -X $METHOD \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$DATA" \
            "$BASE_URL$ENDPOINT"
    fi
}

# Function to extract ID from JSON response
extract_id() {
    echo $1 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

# ========================================
# SETUP: Authentication and Prerequisites
# ========================================

print_header "SETUP: Authentication"

# Login
print_info "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@zirakbook.com",
        "password": "Admin@123"
    }' \
    "$BASE_URL/auth/login")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Login failed. Please ensure the server is running and credentials are correct."
    exit 1
fi

print_success "Login successful"
COMPANY_ID=$(echo $LOGIN_RESPONSE | grep -o '"companyId":"[^"]*"' | cut -d'"' -f4)
print_info "Company ID: $COMPANY_ID"

# ========================================
# SETUP: Create Prerequisites
# ========================================

print_header "SETUP: Creating Prerequisites"

# Create Vendor
print_info "Creating vendor..."
VENDOR_RESPONSE=$(api_request POST "/vendors" '{
    "name": "Test Vendor Ltd",
    "email": "vendor@test.com",
    "phone": "+1234567890",
    "address": "123 Vendor Street",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "paymentTerms": 30,
    "taxNumber": "TAX123456"
}')
VENDOR_ID=$(extract_id "$VENDOR_RESPONSE")

if [ ! -z "$VENDOR_ID" ]; then
    print_success "Vendor created: $VENDOR_ID"
else
    print_error "Failed to create vendor"
fi

# Create Product
print_info "Creating product..."
PRODUCT_RESPONSE=$(api_request POST "/products" '{
    "sku": "TEST-PROD-001",
    "name": "Test Product for Purchase",
    "unit": "PCS",
    "purchasePrice": 100,
    "sellingPrice": 150,
    "taxRate": 18,
    "trackInventory": true
}')
PRODUCT_ID=$(extract_id "$PRODUCT_RESPONSE")

if [ ! -z "$PRODUCT_ID" ]; then
    print_success "Product created: $PRODUCT_ID"
else
    print_error "Failed to create product"
fi

# Create Warehouse
print_info "Creating warehouse..."
WAREHOUSE_RESPONSE=$(api_request POST "/warehouses" '{
    "code": "WH-TEST-01",
    "name": "Test Warehouse",
    "address": "123 Warehouse Ave",
    "city": "Los Angeles",
    "state": "CA",
    "isDefault": true
}')
WAREHOUSE_ID=$(extract_id "$WAREHOUSE_RESPONSE")

if [ ! -z "$WAREHOUSE_ID" ]; then
    print_success "Warehouse created: $WAREHOUSE_ID"
else
    print_error "Failed to create warehouse"
fi

# ========================================
# PURCHASE QUOTATIONS (8 endpoints)
# ========================================

print_header "PURCHASE QUOTATIONS - 8 Endpoints"

# 1. Create Purchase Quotation
print_info "1. Testing: POST /purchase-quotations"
QUOTATION_RESPONSE=$(api_request POST "/purchase-quotations" "{
    \"vendorId\": \"$VENDOR_ID\",
    \"quotationDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
    \"validTill\": \"$(date -u -d '+30 days' +%Y-%m-%dT%H:%M:%S.000Z)\",
    \"referenceNo\": \"REF-001\",
    \"items\": [
        {
            \"productId\": \"$PRODUCT_ID\",
            \"quantity\": 100,
            \"unitPrice\": 95,
            \"taxRate\": 18,
            \"discountAmount\": 0
        }
    ],
    \"notes\": \"Test quotation\",
    \"terms\": \"30 days payment\"
}")

QUOTATION_ID=$(extract_id "$QUOTATION_RESPONSE")
if [ ! -z "$QUOTATION_ID" ]; then
    print_success "Create Purchase Quotation"
else
    print_error "Create Purchase Quotation"
fi

# 2. List Purchase Quotations
print_info "2. Testing: GET /purchase-quotations"
LIST_QUOTATIONS=$(api_request GET "/purchase-quotations?page=1&limit=10")
if echo "$LIST_QUOTATIONS" | grep -q "quotations"; then
    print_success "List Purchase Quotations"
else
    print_error "List Purchase Quotations"
fi

# 3. Get Purchase Quotation by ID
print_info "3. Testing: GET /purchase-quotations/:id"
GET_QUOTATION=$(api_request GET "/purchase-quotations/$QUOTATION_ID")
if echo "$GET_QUOTATION" | grep -q "$QUOTATION_ID"; then
    print_success "Get Purchase Quotation by ID"
else
    print_error "Get Purchase Quotation by ID"
fi

# 4. Update Purchase Quotation
print_info "4. Testing: PUT /purchase-quotations/:id"
UPDATE_QUOTATION=$(api_request PUT "/purchase-quotations/$QUOTATION_ID" '{
    "notes": "Updated test quotation"
}')
if echo "$UPDATE_QUOTATION" | grep -q "Updated test quotation"; then
    print_success "Update Purchase Quotation"
else
    print_error "Update Purchase Quotation"
fi

# 5. Generate PDF
print_info "5. Testing: GET /purchase-quotations/:id/pdf"
PDF_QUOTATION=$(api_request GET "/purchase-quotations/$QUOTATION_ID/pdf")
if echo "$PDF_QUOTATION" | grep -q "success"; then
    print_success "Generate Quotation PDF"
else
    print_error "Generate Quotation PDF"
fi

# 6. Email Quotation
print_info "6. Testing: POST /purchase-quotations/:id/email"
EMAIL_QUOTATION=$(api_request POST "/purchase-quotations/$QUOTATION_ID/email" '{}')
if echo "$EMAIL_QUOTATION" | grep -q "success"; then
    print_success "Email Quotation"
else
    print_error "Email Quotation"
fi

# 7. Convert to Purchase Order
print_info "7. Testing: POST /purchase-quotations/:id/convert"
CONVERT_RESPONSE=$(api_request POST "/purchase-quotations/$QUOTATION_ID/convert" '{}')
PO_ID=$(extract_id "$CONVERT_RESPONSE")
if [ ! -z "$PO_ID" ]; then
    print_success "Convert Quotation to Purchase Order"
else
    print_error "Convert Quotation to Purchase Order"
fi

# 8. Delete Purchase Quotation (create new one first)
print_info "8. Testing: DELETE /purchase-quotations/:id"
DELETE_QUOTATION_RESPONSE=$(api_request POST "/purchase-quotations" "{
    \"vendorId\": \"$VENDOR_ID\",
    \"items\": [
        {
            \"productId\": \"$PRODUCT_ID\",
            \"quantity\": 50,
            \"unitPrice\": 95,
            \"taxRate\": 18
        }
    ]
}")
DELETE_QUOTATION_ID=$(extract_id "$DELETE_QUOTATION_RESPONSE")
DELETE_RESULT=$(api_request DELETE "/purchase-quotations/$DELETE_QUOTATION_ID")
if echo "$DELETE_RESULT" | grep -q "success"; then
    print_success "Delete Purchase Quotation"
else
    print_error "Delete Purchase Quotation"
fi

# ========================================
# PURCHASE ORDERS (10 endpoints)
# ========================================

print_header "PURCHASE ORDERS - 10 Endpoints"

# Create a new PO for testing if conversion didn't work
if [ -z "$PO_ID" ]; then
    print_info "Creating new Purchase Order for testing..."
    PO_RESPONSE=$(api_request POST "/purchase-orders" "{
        \"vendorId\": \"$VENDOR_ID\",
        \"orderDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
        \"expectedDeliveryDate\": \"$(date -u -d '+7 days' +%Y-%m-%dT%H:%M:%S.000Z)\",
        \"items\": [
            {
                \"productId\": \"$PRODUCT_ID\",
                \"quantity\": 100,
                \"unitPrice\": 95,
                \"taxRate\": 18,
                \"discountAmount\": 0
            }
        ],
        \"notes\": \"Test purchase order\"
    }")
    PO_ID=$(extract_id "$PO_RESPONSE")
fi

# 1. Create Purchase Order
print_info "1. Testing: POST /purchase-orders"
if [ ! -z "$PO_ID" ]; then
    print_success "Create Purchase Order"
else
    print_error "Create Purchase Order"
fi

# 2. List Purchase Orders
print_info "2. Testing: GET /purchase-orders"
LIST_PO=$(api_request GET "/purchase-orders?page=1&limit=10")
if echo "$LIST_PO" | grep -q "orders"; then
    print_success "List Purchase Orders"
else
    print_error "List Purchase Orders"
fi

# 3. Get Purchase Order by ID
print_info "3. Testing: GET /purchase-orders/:id"
GET_PO=$(api_request GET "/purchase-orders/$PO_ID")
if echo "$GET_PO" | grep -q "$PO_ID"; then
    print_success "Get Purchase Order by ID"
else
    print_error "Get Purchase Order by ID"
fi

# 4. Update Purchase Order
print_info "4. Testing: PUT /purchase-orders/:id"
UPDATE_PO=$(api_request PUT "/purchase-orders/$PO_ID" '{
    "notes": "Updated purchase order"
}')
if echo "$UPDATE_PO" | grep -q "success"; then
    print_success "Update Purchase Order"
else
    print_error "Update Purchase Order"
fi

# 5. Approve Purchase Order
print_info "5. Testing: POST /purchase-orders/:id/approve"
APPROVE_PO=$(api_request POST "/purchase-orders/$PO_ID/approve" '{}')
if echo "$APPROVE_PO" | grep -q "success"; then
    print_success "Approve Purchase Order"
else
    print_error "Approve Purchase Order"
fi

# 6. Generate PDF
print_info "6. Testing: GET /purchase-orders/:id/pdf"
PDF_PO=$(api_request GET "/purchase-orders/$PO_ID/pdf")
if echo "$PDF_PO" | grep -q "success"; then
    print_success "Generate Purchase Order PDF"
else
    print_error "Generate Purchase Order PDF"
fi

# 7. Email Purchase Order
print_info "7. Testing: POST /purchase-orders/:id/email"
EMAIL_PO=$(api_request POST "/purchase-orders/$PO_ID/email" '{}')
if echo "$EMAIL_PO" | grep -q "success"; then
    print_success "Email Purchase Order"
else
    print_error "Email Purchase Order"
fi

# 8. Create Goods Receipt from PO
print_info "8. Testing: POST /purchase-orders/:id/receive"
GRN_FROM_PO=$(api_request POST "/purchase-orders/$PO_ID/receive" "{
    \"warehouseId\": \"$WAREHOUSE_ID\",
    \"receiptDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
    \"items\": [
        {
            \"productId\": \"$PRODUCT_ID\",
            \"orderedQty\": 100,
            \"receivedQty\": 80,
            \"acceptedQty\": 80,
            \"rejectedQty\": 0,
            \"damagedQty\": 0,
            \"unitPrice\": 95,
            \"taxRate\": 18
        }
    ]
}")
GRN_ID=$(extract_id "$GRN_FROM_PO")
if [ ! -z "$GRN_ID" ]; then
    print_success "Create Goods Receipt from Purchase Order"
else
    print_error "Create Goods Receipt from Purchase Order"
fi

# 9. Close Purchase Order (create new one first)
print_info "9. Testing: POST /purchase-orders/:id/close"
CLOSE_PO_RESPONSE=$(api_request POST "/purchase-orders" "{
    \"vendorId\": \"$VENDOR_ID\",
    \"items\": [
        {
            \"productId\": \"$PRODUCT_ID\",
            \"quantity\": 50,
            \"unitPrice\": 95,
            \"taxRate\": 18
        }
    ]
}")
CLOSE_PO_ID=$(extract_id "$CLOSE_PO_RESPONSE")
api_request POST "/purchase-orders/$CLOSE_PO_ID/approve" '{}'
CLOSE_RESULT=$(api_request POST "/purchase-orders/$CLOSE_PO_ID/close" '{}')
if echo "$CLOSE_RESULT" | grep -q "success"; then
    print_success "Close Purchase Order"
else
    print_error "Close Purchase Order"
fi

# 10. Delete Purchase Order
print_info "10. Testing: DELETE /purchase-orders/:id"
DELETE_PO_RESPONSE=$(api_request POST "/purchase-orders" "{
    \"vendorId\": \"$VENDOR_ID\",
    \"items\": [
        {
            \"productId\": \"$PRODUCT_ID\",
            \"quantity\": 25,
            \"unitPrice\": 95,
            \"taxRate\": 18
        }
    ]
}")
DELETE_PO_ID=$(extract_id "$DELETE_PO_RESPONSE")
DELETE_PO_RESULT=$(api_request DELETE "/purchase-orders/$DELETE_PO_ID")
if echo "$DELETE_PO_RESULT" | grep -q "success"; then
    print_success "Delete Purchase Order"
else
    print_error "Delete Purchase Order"
fi

# ========================================
# GOODS RECEIPTS (8 endpoints)
# ========================================

print_header "GOODS RECEIPTS - 8 Endpoints"

# 1. Create Goods Receipt (already done via PO)
print_info "1. Testing: POST /goods-receipts"
if [ ! -z "$GRN_ID" ]; then
    print_success "Create Goods Receipt (via PO)"
else
    # Create standalone GRN
    GRN_RESPONSE=$(api_request POST "/goods-receipts" "{
        \"vendorId\": \"$VENDOR_ID\",
        \"warehouseId\": \"$WAREHOUSE_ID\",
        \"receiptDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
        \"items\": [
            {
                \"productId\": \"$PRODUCT_ID\",
                \"receivedQty\": 50,
                \"acceptedQty\": 50,
                \"unitPrice\": 95,
                \"taxRate\": 18
            }
        ]
    }")
    GRN_ID=$(extract_id "$GRN_RESPONSE")
    if [ ! -z "$GRN_ID" ]; then
        print_success "Create Goods Receipt"
    else
        print_error "Create Goods Receipt"
    fi
fi

# 2. List Goods Receipts
print_info "2. Testing: GET /goods-receipts"
LIST_GRN=$(api_request GET "/goods-receipts?page=1&limit=10")
if echo "$LIST_GRN" | grep -q "receipts"; then
    print_success "List Goods Receipts"
else
    print_error "List Goods Receipts"
fi

# 3. Get Goods Receipt by ID
print_info "3. Testing: GET /goods-receipts/:id"
GET_GRN=$(api_request GET "/goods-receipts/$GRN_ID")
if echo "$GET_GRN" | grep -q "$GRN_ID"; then
    print_success "Get Goods Receipt by ID"
else
    print_error "Get Goods Receipt by ID"
fi

# 4. Update Goods Receipt
print_info "4. Testing: PUT /goods-receipts/:id"
UPDATE_GRN=$(api_request PUT "/goods-receipts/$GRN_ID" '{
    "notes": "Updated goods receipt"
}')
if echo "$UPDATE_GRN" | grep -q "success"; then
    print_success "Update Goods Receipt"
else
    print_error "Update Goods Receipt"
fi

# 5. Approve Goods Receipt
print_info "5. Testing: POST /goods-receipts/:id/approve"
APPROVE_GRN=$(api_request POST "/goods-receipts/$GRN_ID/approve" '{}')
if echo "$APPROVE_GRN" | grep -q "success"; then
    print_success "Approve Goods Receipt"
else
    print_error "Approve Goods Receipt"
fi

# 6. Generate PDF
print_info "6. Testing: GET /goods-receipts/:id/pdf"
PDF_GRN=$(api_request GET "/goods-receipts/$GRN_ID/pdf")
if echo "$PDF_GRN" | grep -q "success"; then
    print_success "Generate Goods Receipt PDF"
else
    print_error "Generate Goods Receipt PDF"
fi

# 7. Get Receipts by Purchase Order
print_info "7. Testing: GET /goods-receipts/po/:id"
GRN_BY_PO=$(api_request GET "/goods-receipts/po/$PO_ID")
if echo "$GRN_BY_PO" | grep -q "success"; then
    print_success "Get Receipts by Purchase Order"
else
    print_error "Get Receipts by Purchase Order"
fi

# 8. Delete Goods Receipt (create new one first)
print_info "8. Testing: DELETE /goods-receipts/:id"
DELETE_GRN_RESPONSE=$(api_request POST "/goods-receipts" "{
    \"vendorId\": \"$VENDOR_ID\",
    \"warehouseId\": \"$WAREHOUSE_ID\",
    \"items\": [
        {
            \"productId\": \"$PRODUCT_ID\",
            \"receivedQty\": 10,
            \"acceptedQty\": 10,
            \"unitPrice\": 95,
            \"taxRate\": 18
        }
    ]
}")
DELETE_GRN_ID=$(extract_id "$DELETE_GRN_RESPONSE")
DELETE_GRN_RESULT=$(api_request DELETE "/goods-receipts/$DELETE_GRN_ID")
if echo "$DELETE_GRN_RESULT" | grep -q "success"; then
    print_success "Delete Goods Receipt"
else
    print_error "Delete Goods Receipt"
fi

# ========================================
# BILLS (10 endpoints)
# ========================================

print_header "BILLS - 10 Endpoints"

# 1. Create Bill
print_info "1. Testing: POST /bills"
BILL_RESPONSE=$(api_request POST "/bills" "{
    \"vendorId\": \"$VENDOR_ID\",
    \"billDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
    \"purchaseOrderId\": \"$PO_ID\",
    \"items\": [
        {
            \"productId\": \"$PRODUCT_ID\",
            \"quantity\": 80,
            \"unitPrice\": 95,
            \"taxRate\": 18,
            \"discountAmount\": 0
        }
    ],
    \"notes\": \"Test bill\"
}")
BILL_ID=$(extract_id "$BILL_RESPONSE")
if [ ! -z "$BILL_ID" ]; then
    print_success "Create Bill"
else
    print_error "Create Bill"
fi

# 2. List Bills
print_info "2. Testing: GET /bills"
LIST_BILLS=$(api_request GET "/bills?page=1&limit=10")
if echo "$LIST_BILLS" | grep -q "bills"; then
    print_success "List Bills"
else
    print_error "List Bills"
fi

# 3. Get Bill by ID
print_info "3. Testing: GET /bills/:id"
GET_BILL=$(api_request GET "/bills/$BILL_ID")
if echo "$GET_BILL" | grep -q "$BILL_ID"; then
    print_success "Get Bill by ID"
else
    print_error "Get Bill by ID"
fi

# 4. Update Bill
print_info "4. Testing: PUT /bills/:id"
UPDATE_BILL=$(api_request PUT "/bills/$BILL_ID" '{
    "notes": "Updated bill"
}')
if echo "$UPDATE_BILL" | grep -q "success"; then
    print_success "Update Bill"
else
    print_error "Update Bill"
fi

# 5. Approve Bill
print_info "5. Testing: POST /bills/:id/approve"
APPROVE_BILL=$(api_request POST "/bills/$BILL_ID/approve" '{}')
if echo "$APPROVE_BILL" | grep -q "success"; then
    print_success "Approve Bill"
else
    print_error "Approve Bill"
fi

# 6. Record Payment
print_info "6. Testing: POST /bills/:id/pay"
PAY_BILL=$(api_request POST "/bills/$BILL_ID/pay" '{
    "amount": 5000,
    "paymentMethod": "BANK_TRANSFER",
    "referenceNo": "TXN-12345"
}')
if echo "$PAY_BILL" | grep -q "success"; then
    print_success "Record Bill Payment"
else
    print_error "Record Bill Payment"
fi

# 7. Generate PDF
print_info "7. Testing: GET /bills/:id/pdf"
PDF_BILL=$(api_request GET "/bills/$BILL_ID/pdf")
if echo "$PDF_BILL" | grep -q "success"; then
    print_success "Generate Bill PDF"
else
    print_error "Generate Bill PDF"
fi

# 8. Get Pending Bills
print_info "8. Testing: GET /bills/pending"
PENDING_BILLS=$(api_request GET "/bills/pending")
if echo "$PENDING_BILLS" | grep -q "success"; then
    print_success "Get Pending Bills"
else
    print_error "Get Pending Bills"
fi

# 9. Get Bills by Vendor
print_info "9. Testing: GET /bills/vendor/:id"
VENDOR_BILLS=$(api_request GET "/bills/vendor/$VENDOR_ID")
if echo "$VENDOR_BILLS" | grep -q "success"; then
    print_success "Get Bills by Vendor"
else
    print_error "Get Bills by Vendor"
fi

# 10. Delete Bill (create new one first)
print_info "10. Testing: DELETE /bills/:id"
DELETE_BILL_RESPONSE=$(api_request POST "/bills" "{
    \"vendorId\": \"$VENDOR_ID\",
    \"items\": [
        {
            \"productId\": \"$PRODUCT_ID\",
            \"quantity\": 20,
            \"unitPrice\": 95,
            \"taxRate\": 18
        }
    ]
}")
DELETE_BILL_ID=$(extract_id "$DELETE_BILL_RESPONSE")
DELETE_BILL_RESULT=$(api_request DELETE "/bills/$DELETE_BILL_ID")
if echo "$DELETE_BILL_RESULT" | grep -q "success"; then
    print_success "Delete Bill"
else
    print_error "Delete Bill"
fi

# ========================================
# PURCHASE RETURNS (6 endpoints)
# ========================================

print_header "PURCHASE RETURNS - 6 Endpoints"

# 1. Create Purchase Return
print_info "1. Testing: POST /purchase-returns"
RETURN_RESPONSE=$(api_request POST "/purchase-returns" "{
    \"vendorId\": \"$VENDOR_ID\",
    \"warehouseId\": \"$WAREHOUSE_ID\",
    \"returnDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
    \"billId\": \"$BILL_ID\",
    \"reason\": \"Defective items\",
    \"items\": [
        {
            \"productId\": \"$PRODUCT_ID\",
            \"quantity\": 10,
            \"unitPrice\": 95,
            \"taxRate\": 18,
            \"returnReason\": \"Damaged during shipping\"
        }
    ],
    \"notes\": \"Test return\"
}")
RETURN_ID=$(extract_id "$RETURN_RESPONSE")
if [ ! -z "$RETURN_ID" ]; then
    print_success "Create Purchase Return"
else
    print_error "Create Purchase Return"
fi

# 2. List Purchase Returns
print_info "2. Testing: GET /purchase-returns"
LIST_RETURNS=$(api_request GET "/purchase-returns?page=1&limit=10")
if echo "$LIST_RETURNS" | grep -q "returns"; then
    print_success "List Purchase Returns"
else
    print_error "List Purchase Returns"
fi

# 3. Get Purchase Return by ID
print_info "3. Testing: GET /purchase-returns/:id"
GET_RETURN=$(api_request GET "/purchase-returns/$RETURN_ID")
if echo "$GET_RETURN" | grep -q "$RETURN_ID"; then
    print_success "Get Purchase Return by ID"
else
    print_error "Get Purchase Return by ID"
fi

# 4. Update Purchase Return
print_info "4. Testing: PUT /purchase-returns/:id"
UPDATE_RETURN=$(api_request PUT "/purchase-returns/$RETURN_ID" '{
    "notes": "Updated return"
}')
if echo "$UPDATE_RETURN" | grep -q "success"; then
    print_success "Update Purchase Return"
else
    print_error "Update Purchase Return"
fi

# 5. Approve Purchase Return
print_info "5. Testing: POST /purchase-returns/:id/approve"
APPROVE_RETURN=$(api_request POST "/purchase-returns/$RETURN_ID/approve" '{}')
if echo "$APPROVE_RETURN" | grep -q "success"; then
    print_success "Approve Purchase Return"
else
    print_error "Approve Purchase Return"
fi

# 6. Delete Purchase Return (create new one first)
print_info "6. Testing: DELETE /purchase-returns/:id"
DELETE_RETURN_RESPONSE=$(api_request POST "/purchase-returns" "{
    \"vendorId\": \"$VENDOR_ID\",
    \"warehouseId\": \"$WAREHOUSE_ID\",
    \"items\": [
        {
            \"productId\": \"$PRODUCT_ID\",
            \"quantity\": 5,
            \"unitPrice\": 95,
            \"taxRate\": 18
        }
    ]
}")
DELETE_RETURN_ID=$(extract_id "$DELETE_RETURN_RESPONSE")
DELETE_RETURN_RESULT=$(api_request DELETE "/purchase-returns/$DELETE_RETURN_ID")
if echo "$DELETE_RETURN_RESULT" | grep -q "success"; then
    print_success "Delete Purchase Return"
else
    print_error "Delete Purchase Return"
fi

# ========================================
# TEST SUMMARY
# ========================================

print_header "TEST SUMMARY"

echo -e "${BLUE}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
echo -e "${RED}Failed:${NC} $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}\n"
    exit 0
else
    echo -e "\n${RED}⚠ Some tests failed. Please check the output above.${NC}\n"
    exit 1
fi
