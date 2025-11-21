#!/bin/bash

# =============================================================================
# ZiraBook Accounting System - Reports Module Testing Script
# Tests all 45 report endpoints
# =============================================================================

BASE_URL="http://localhost:5000/api/v1"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print colored output
print_test() {
    echo -e "${BLUE}[TEST $1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((PASSED_TESTS++))
}

print_fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((FAILED_TESTS++))
}

print_section() {
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}========================================${NC}"
}

# Function to make API call
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3

    if [ "$method" == "GET" ]; then
        curl -s -X GET "${BASE_URL}${endpoint}" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json"
    else
        curl -s -X "$method" "${BASE_URL}${endpoint}" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

# Function to test endpoint
test_endpoint() {
    local test_name=$1
    local endpoint=$2
    local expected_field=$3

    ((TOTAL_TESTS++))
    print_test "$TOTAL_TESTS" "$test_name"

    response=$(api_call "GET" "$endpoint")

    if echo "$response" | grep -q "\"success\":true"; then
        if [ -n "$expected_field" ]; then
            if echo "$response" | grep -q "$expected_field"; then
                print_success "$test_name"
            else
                print_fail "$test_name - Expected field '$expected_field' not found"
                echo "Response: $response" | head -c 200
            fi
        else
            print_success "$test_name"
        fi
    else
        print_fail "$test_name"
        echo "Response: $response" | head -c 200
    fi
}

# =============================================================================
# MAIN SCRIPT
# =============================================================================

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║     ZiraBook Accounting System - Reports Module Test Suite       ║"
echo "║                    Testing 45 Report Endpoints                    ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Login and get token
print_section "AUTHENTICATION"
print_test "1" "Logging in to get access token"

LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@zirabook.com",
        "password": "Admin@123"
    }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get authentication token!${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Successfully authenticated${NC}"
echo "Token: ${TOKEN:0:20}..."

# =============================================================================
# FINANCIAL REPORTS (15 endpoints)
# =============================================================================

print_section "FINANCIAL REPORTS (15 endpoints)"

test_endpoint "Balance Sheet" \
    "/reports/balance-sheet?period=THIS_MONTH" \
    "totalAssets"

test_endpoint "Profit & Loss Statement" \
    "/reports/profit-loss?period=THIS_MONTH" \
    "totalRevenue"

test_endpoint "Cash Flow Statement" \
    "/reports/cash-flow?period=THIS_MONTH" \
    "netCashFlow"

test_endpoint "Trial Balance" \
    "/reports/trial-balance?period=THIS_MONTH" \
    "totalDebits"

test_endpoint "General Ledger" \
    "/reports/general-ledger?period=THIS_MONTH" \
    "General Ledger"

test_endpoint "Day Book" \
    "/reports/day-book?period=TODAY" \
    "Day Book"

test_endpoint "Bank Book" \
    "/reports/bank-book?period=THIS_MONTH" \
    "Bank Book"

test_endpoint "Cash Book" \
    "/reports/cash-book?period=THIS_MONTH" \
    "Cash Book"

test_endpoint "Accounts Receivable" \
    "/reports/receivables" \
    "totalReceivable"

test_endpoint "Accounts Payable" \
    "/reports/payables" \
    "totalPayable"

test_endpoint "Aging Receivables" \
    "/reports/aging-receivables" \
    "totalReceivable"

test_endpoint "Aging Payables" \
    "/reports/aging-payables" \
    "totalPayable"

test_endpoint "Journal Entries Report" \
    "/reports/journal-entries?period=THIS_MONTH&page=1&limit=10" \
    "Journal Entries"

test_endpoint "Audit Trail" \
    "/reports/audit-trail?period=THIS_MONTH&page=1&limit=10" \
    "Audit Trail"

# Test Account Ledger (requires accountId - will create test later)
((TOTAL_TESTS++))
print_test "$TOTAL_TESTS" "Account Ledger (skipped - requires accountId)"
echo -e "${YELLOW}⚠ SKIP:${NC} Account Ledger - requires valid accountId"

# =============================================================================
# SALES REPORTS (8 endpoints)
# =============================================================================

print_section "SALES REPORTS (8 endpoints)"

test_endpoint "Sales Summary" \
    "/reports/sales-summary?period=THIS_MONTH" \
    "totalSales"

test_endpoint "Detailed Sales" \
    "/reports/sales-detailed?period=THIS_MONTH&page=1&limit=10" \
    "Detailed Sales"

test_endpoint "Sales by Customer" \
    "/reports/sales-by-customer?period=THIS_MONTH" \
    "Sales by Customer"

test_endpoint "Sales by Product" \
    "/reports/sales-by-product?period=THIS_MONTH" \
    "Sales by Product"

test_endpoint "Sales by Date" \
    "/reports/sales-by-date?period=THIS_MONTH" \
    "Sales by Date"

test_endpoint "Sales Trends" \
    "/reports/sales-trends?period=THIS_YEAR&groupBy=MONTH" \
    "Sales Trends"

test_endpoint "Sales Returns" \
    "/reports/sales-returns?period=THIS_MONTH" \
    "Sales Returns"

test_endpoint "Sales Tax Report" \
    "/reports/sales-tax?period=THIS_MONTH" \
    "totalTaxCollected"

# =============================================================================
# PURCHASE REPORTS (8 endpoints)
# =============================================================================

print_section "PURCHASE REPORTS (8 endpoints)"

test_endpoint "Purchases Summary" \
    "/reports/purchases-summary?period=THIS_MONTH" \
    "totalPurchases"

test_endpoint "Detailed Purchases" \
    "/reports/purchases-detailed?period=THIS_MONTH&page=1&limit=10" \
    "Detailed Purchases"

test_endpoint "Purchases by Vendor" \
    "/reports/purchases-by-vendor?period=THIS_MONTH" \
    "Purchases by Vendor"

test_endpoint "Purchases by Product" \
    "/reports/purchases-by-product?period=THIS_MONTH" \
    "Purchases by Product"

test_endpoint "Pending Purchase Orders" \
    "/reports/purchases-pending" \
    "totalOrders"

test_endpoint "Purchase Returns" \
    "/reports/purchases-returns?period=THIS_MONTH" \
    "Purchase Returns"

test_endpoint "Purchase Tax Report" \
    "/reports/purchases-tax?period=THIS_MONTH" \
    "totalTaxPaid"

test_endpoint "Vendor Payments History" \
    "/reports/vendor-payments?period=THIS_MONTH" \
    "totalPayments"

# =============================================================================
# INVENTORY REPORTS (8 endpoints)
# =============================================================================

print_section "INVENTORY REPORTS (8 endpoints)"

test_endpoint "Inventory Summary" \
    "/reports/inventory-summary" \
    "totalValue"

test_endpoint "Inventory Valuation" \
    "/reports/inventory-valuation" \
    "totalValue"

test_endpoint "Inventory Movement" \
    "/reports/inventory-movement?period=THIS_MONTH&page=1&limit=10" \
    "Inventory Movement"

test_endpoint "Inventory Aging" \
    "/reports/inventory-aging" \
    "Inventory Aging"

test_endpoint "Low Stock Items" \
    "/reports/inventory-low-stock" \
    "Low Stock"

test_endpoint "Reorder Report" \
    "/reports/inventory-reorder" \
    "Reorder Level"

test_endpoint "Stock by Warehouse" \
    "/reports/inventory-warehouse" \
    "totalValue"

test_endpoint "Dead/Slow-Moving Stock" \
    "/reports/inventory-dead?daysThreshold=90" \
    "Dead"

# =============================================================================
# TAX REPORTS (6 endpoints)
# =============================================================================

print_section "TAX REPORTS (6 endpoints)"

test_endpoint "Tax Summary" \
    "/reports/tax-summary?period=THIS_MONTH" \
    "netTaxLiability"

test_endpoint "GST Report" \
    "/reports/tax-gst?period=THIS_MONTH" \
    "netGST"

test_endpoint "VAT Report" \
    "/reports/tax-vat?period=THIS_MONTH" \
    "netVAT"

test_endpoint "Input Tax Credit" \
    "/reports/tax-input?period=THIS_MONTH" \
    "totalITCClaimed"

test_endpoint "Output Tax Liability" \
    "/reports/tax-output?period=THIS_MONTH" \
    "totalTaxLiability"

test_endpoint "Tax Filing Data" \
    "/reports/tax-filing?period=THIS_MONTH" \
    "Tax Filing"

# =============================================================================
# TEST SUMMARY
# =============================================================================

print_section "TEST SUMMARY"

echo ""
echo "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
else
    echo -e "${GREEN}Failed:       $FAILED_TESTS${NC}"
fi

PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
echo ""
echo -e "Pass Rate:    ${BLUE}${PASS_RATE}%${NC}"

echo ""
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                   ALL TESTS PASSED! 🎉                            ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              SOME TESTS FAILED - REVIEW LOGS ABOVE                ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
