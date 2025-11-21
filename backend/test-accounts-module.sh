#!/bin/bash

###############################################################################
# ZirakBook Accounting System - Accounts Module Testing Script
# Tests all 28 endpoints of the Accounts Module
#
# Prerequisites:
# 1. Server must be running on http://localhost:5000
# 2. You must have a valid authentication token
# 3. Company, vendor, customer, and invoice/bill must exist
#
# Usage:
#   chmod +x test-accounts-module.sh
#   ./test-accounts-module.sh
###############################################################################

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API base URL
BASE_URL="http://localhost:5000/api/v1"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Global variables to store created resource IDs
TOKEN=""
COMPANY_ID=""
ACCOUNT_ID_CASH=""
ACCOUNT_ID_BANK=""
ACCOUNT_ID_AR=""
ACCOUNT_ID_AP=""
ACCOUNT_ID_SALES=""
JOURNAL_ENTRY_ID=""
PAYMENT_ID=""
RECEIPT_ID=""
VENDOR_ID=""
CUSTOMER_ID=""
BILL_ID=""
INVOICE_ID=""

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    echo -e "${RED}  Response: $2${NC}"
    ((FAILED_TESTS++))
}

increment_test() {
    ((TOTAL_TESTS++))
}

make_request() {
    local method=$1
    local endpoint=$2
    local data=$3

    if [ -z "$data" ]; then
        curl -s -X $method \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint"
    else
        curl -s -X $method \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint"
    fi
}

###############################################################################
# Setup and Authentication
###############################################################################

setup_test_environment() {
    print_header "SETTING UP TEST ENVIRONMENT"

    # Login to get token
    echo "Logging in..."
    LOGIN_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@zirakbook.com",
            "password": "Admin@123"
        }' \
        "$BASE_URL/auth/login")

    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

    if [ -z "$TOKEN" ]; then
        echo -e "${RED}Failed to obtain authentication token!${NC}"
        echo "Response: $LOGIN_RESPONSE"
        echo -e "${YELLOW}Please ensure:${NC}"
        echo "1. Server is running on http://localhost:5000"
        echo "2. Default admin user exists with email: admin@zirakbook.com, password: Admin@123"
        exit 1
    fi

    echo -e "${GREEN}✓ Successfully authenticated${NC}"

    # Get company ID from token or user info
    USER_INFO=$(make_request "GET" "/users/profile")
    COMPANY_ID=$(echo $USER_INFO | grep -o '"companyId":"[^"]*' | cut -d'"' -f4)

    echo -e "${GREEN}✓ Company ID: $COMPANY_ID${NC}"

    # Get or create vendor for payment testing
    echo "Getting vendor..."
    VENDORS=$(make_request "GET" "/vendors?limit=1")
    VENDOR_ID=$(echo $VENDORS | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

    if [ -z "$VENDOR_ID" ]; then
        echo "Creating test vendor..."
        VENDOR_RESPONSE=$(make_request "POST" "/vendors" '{
            "name": "Test Vendor for Accounts",
            "email": "vendor@test.com",
            "phone": "1234567890",
            "address": "Test Address"
        }')
        VENDOR_ID=$(echo $VENDOR_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    fi
    echo -e "${GREEN}✓ Vendor ID: $VENDOR_ID${NC}"

    # Get or create customer for receipt testing
    echo "Getting customer..."
    CUSTOMERS=$(make_request "GET" "/customers?limit=1")
    CUSTOMER_ID=$(echo $CUSTOMERS | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

    if [ -z "$CUSTOMER_ID" ]; then
        echo "Creating test customer..."
        CUSTOMER_RESPONSE=$(make_request "POST" "/customers" '{
            "name": "Test Customer for Accounts",
            "email": "customer@test.com",
            "phone": "0987654321",
            "address": "Test Address"
        }')
        CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    fi
    echo -e "${GREEN}✓ Customer ID: $CUSTOMER_ID${NC}"

    echo -e "\n${GREEN}Environment setup complete!${NC}\n"
}

###############################################################################
# Chart of Accounts Tests (8 endpoints)
###############################################################################

test_chart_of_accounts() {
    print_header "CHART OF ACCOUNTS TESTS (8 endpoints)"

    # Test 1: Get account types
    increment_test
    print_test "$TOTAL_TESTS" "GET /accounts/types - Get all account types"
    RESPONSE=$(make_request "GET" "/accounts/types")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved account types"
    else
        print_error "Failed to get account types" "$RESPONSE"
    fi

    # Test 2: Create Cash account
    increment_test
    print_test "$TOTAL_TESTS" "POST /accounts - Create Cash account (ASSET)"
    RESPONSE=$(make_request "POST" "/accounts" '{
        "accountName": "Cash",
        "accountType": "ASSET",
        "description": "Cash account for testing",
        "openingBalance": 50000,
        "openingBalanceType": "DEBIT"
    }')
    ACCOUNT_ID_CASH=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$ACCOUNT_ID_CASH" ]; then
        print_success "Created Cash account: $ACCOUNT_ID_CASH"
    else
        print_error "Failed to create Cash account" "$RESPONSE"
    fi

    # Test 3: Create Bank account
    increment_test
    print_test "$TOTAL_TESTS" "POST /accounts - Create Bank account (ASSET)"
    RESPONSE=$(make_request "POST" "/accounts" '{
        "accountName": "Bank Account - Test",
        "accountType": "ASSET",
        "accountNumber": "1010",
        "description": "Bank account for testing",
        "openingBalance": 100000,
        "openingBalanceType": "DEBIT"
    }')
    ACCOUNT_ID_BANK=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$ACCOUNT_ID_BANK" ]; then
        print_success "Created Bank account: $ACCOUNT_ID_BANK"
    else
        print_error "Failed to create Bank account" "$RESPONSE"
    fi

    # Test 4: Create Accounts Receivable
    increment_test
    print_test "$TOTAL_TESTS" "POST /accounts - Create Accounts Receivable (ASSET)"
    RESPONSE=$(make_request "POST" "/accounts" '{
        "accountName": "Accounts Receivable",
        "accountType": "ASSET",
        "accountNumber": "1200",
        "openingBalance": 25000,
        "openingBalanceType": "DEBIT"
    }')
    ACCOUNT_ID_AR=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$ACCOUNT_ID_AR" ]; then
        print_success "Created AR account: $ACCOUNT_ID_AR"
    else
        print_error "Failed to create AR account" "$RESPONSE"
    fi

    # Test 5: Create Accounts Payable
    increment_test
    print_test "$TOTAL_TESTS" "POST /accounts - Create Accounts Payable (LIABILITY)"
    RESPONSE=$(make_request "POST" "/accounts" '{
        "accountName": "Accounts Payable",
        "accountType": "LIABILITY",
        "accountNumber": "2000",
        "openingBalance": 15000,
        "openingBalanceType": "CREDIT"
    }')
    ACCOUNT_ID_AP=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$ACCOUNT_ID_AP" ]; then
        print_success "Created AP account: $ACCOUNT_ID_AP"
    else
        print_error "Failed to create AP account" "$RESPONSE"
    fi

    # Test 6: Create Sales Revenue account
    increment_test
    print_test "$TOTAL_TESTS" "POST /accounts - Create Sales Revenue (REVENUE)"
    RESPONSE=$(make_request "POST" "/accounts" '{
        "accountName": "Sales Revenue",
        "accountType": "REVENUE",
        "accountNumber": "4000",
        "openingBalance": 0,
        "openingBalanceType": "CREDIT"
    }')
    ACCOUNT_ID_SALES=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$ACCOUNT_ID_SALES" ]; then
        print_success "Created Sales account: $ACCOUNT_ID_SALES"
    else
        print_error "Failed to create Sales account" "$RESPONSE"
    fi

    # Test 7: Get all accounts
    increment_test
    print_test "$TOTAL_TESTS" "GET /accounts - List all accounts"
    RESPONSE=$(make_request "GET" "/accounts")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        ACCOUNT_COUNT=$(echo $RESPONSE | grep -o '"id":"[^"]*' | wc -l)
        print_success "Retrieved $ACCOUNT_COUNT accounts"
    else
        print_error "Failed to get accounts" "$RESPONSE"
    fi

    # Test 8: Get account by ID
    increment_test
    print_test "$TOTAL_TESTS" "GET /accounts/:id - Get account details with balance"
    RESPONSE=$(make_request "GET" "/accounts/$ACCOUNT_ID_CASH")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved account details"
    else
        print_error "Failed to get account details" "$RESPONSE"
    fi

    # Test 9: Update account
    increment_test
    print_test "$TOTAL_TESTS" "PUT /accounts/:id - Update account"
    RESPONSE=$(make_request "PUT" "/accounts/$ACCOUNT_ID_CASH" '{
        "description": "Updated cash account description"
    }')
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Updated account successfully"
    else
        print_error "Failed to update account" "$RESPONSE"
    fi

    # Test 10: Get account tree
    increment_test
    print_test "$TOTAL_TESTS" "GET /accounts/tree - Get account hierarchy"
    RESPONSE=$(make_request "GET" "/accounts/tree")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved account tree"
    else
        print_error "Failed to get account tree" "$RESPONSE"
    fi

    # Test 11: Deactivate account
    increment_test
    print_test "$TOTAL_TESTS" "POST /accounts/:id/activate - Deactivate account"
    RESPONSE=$(make_request "POST" "/accounts/$ACCOUNT_ID_SALES/activate" '{
        "isActive": false
    }')
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Deactivated account"
    else
        print_error "Failed to deactivate account" "$RESPONSE"
    fi

    # Test 12: Reactivate account
    increment_test
    print_test "$TOTAL_TESTS" "POST /accounts/:id/activate - Reactivate account"
    RESPONSE=$(make_request "POST" "/accounts/$ACCOUNT_ID_SALES/activate" '{
        "isActive": true
    }')
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Reactivated account"
    else
        print_error "Failed to reactivate account" "$RESPONSE"
    fi
}

###############################################################################
# Journal Entry Tests (8 endpoints)
###############################################################################

test_journal_entries() {
    print_header "JOURNAL ENTRY TESTS (8 endpoints)"

    # Test 1: Create journal entry
    increment_test
    print_test "$TOTAL_TESTS" "POST /journal-entries - Create journal entry"
    RESPONSE=$(make_request "POST" "/journal-entries" '{
        "entryDate": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "description": "Test journal entry for sales transaction",
        "entryType": "MANUAL",
        "lines": [
            {
                "accountId": "'$ACCOUNT_ID_CASH'",
                "transactionType": "DEBIT",
                "amount": 5000,
                "description": "Cash received"
            },
            {
                "accountId": "'$ACCOUNT_ID_SALES'",
                "transactionType": "CREDIT",
                "amount": 5000,
                "description": "Sales revenue"
            }
        ]
    }')
    JOURNAL_ENTRY_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$JOURNAL_ENTRY_ID" ]; then
        print_success "Created journal entry: $JOURNAL_ENTRY_ID"
    else
        print_error "Failed to create journal entry" "$RESPONSE"
    fi

    # Test 2: Get all journal entries
    increment_test
    print_test "$TOTAL_TESTS" "GET /journal-entries - List entries with pagination"
    RESPONSE=$(make_request "GET" "/journal-entries?page=1&limit=10")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved journal entries"
    else
        print_error "Failed to get journal entries" "$RESPONSE"
    fi

    # Test 3: Get journal entry by ID
    increment_test
    print_test "$TOTAL_TESTS" "GET /journal-entries/:id - Get entry with lines"
    RESPONSE=$(make_request "GET" "/journal-entries/$JOURNAL_ENTRY_ID")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved journal entry details"
    else
        print_error "Failed to get journal entry" "$RESPONSE"
    fi

    # Test 4: Update journal entry (before posting)
    increment_test
    print_test "$TOTAL_TESTS" "PUT /journal-entries/:id - Update entry"
    RESPONSE=$(make_request "PUT" "/journal-entries/$JOURNAL_ENTRY_ID" '{
        "description": "Updated test journal entry description"
    }')
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Updated journal entry"
    else
        print_error "Failed to update journal entry" "$RESPONSE"
    fi

    # Test 5: Get pending entries
    increment_test
    print_test "$TOTAL_TESTS" "GET /journal-entries/pending - Get unposted entries"
    RESPONSE=$(make_request "GET" "/journal-entries/pending")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved pending entries"
    else
        print_error "Failed to get pending entries" "$RESPONSE"
    fi

    # Test 6: Post journal entry
    increment_test
    print_test "$TOTAL_TESTS" "POST /journal-entries/:id/post - Post entry (finalize)"
    RESPONSE=$(make_request "POST" "/journal-entries/$JOURNAL_ENTRY_ID/post")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Posted journal entry"
    else
        print_error "Failed to post journal entry" "$RESPONSE"
    fi

    # Test 7: Get entries by account
    increment_test
    print_test "$TOTAL_TESTS" "GET /journal-entries/account/:id - Get entries for account"
    RESPONSE=$(make_request "GET" "/journal-entries/account/$ACCOUNT_ID_CASH")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved entries for account"
    else
        print_error "Failed to get entries by account" "$RESPONSE"
    fi

    # Test 8: Create another journal entry for deletion test
    increment_test
    print_test "$TOTAL_TESTS" "POST /journal-entries - Create entry for deletion"
    RESPONSE=$(make_request "POST" "/journal-entries" '{
        "entryDate": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "description": "Entry to be deleted",
        "lines": [
            {
                "accountId": "'$ACCOUNT_ID_BANK'",
                "transactionType": "DEBIT",
                "amount": 1000
            },
            {
                "accountId": "'$ACCOUNT_ID_CASH'",
                "transactionType": "CREDIT",
                "amount": 1000
            }
        ]
    }')
    TEMP_ENTRY_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$TEMP_ENTRY_ID" ]; then
        # Delete it immediately
        DELETE_RESPONSE=$(make_request "DELETE" "/journal-entries/$TEMP_ENTRY_ID")
        if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
            print_success "Deleted journal entry before posting"
        else
            print_error "Failed to delete journal entry" "$DELETE_RESPONSE"
        fi
    else
        print_error "Failed to create entry for deletion" "$RESPONSE"
    fi
}

###############################################################################
# Payment Tests (6 endpoints)
###############################################################################

test_payments() {
    print_header "PAYMENT TESTS (6 endpoints)"

    # First, create a bill for payment testing
    echo "Creating test bill..."
    BILL_RESPONSE=$(make_request "POST" "/bills" '{
        "vendorId": "'$VENDOR_ID'",
        "billDate": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "dueDate": "'$(date -u -d '+30 days' +%Y-%m-%dT%H:%M:%S.000Z)'",
        "items": [
            {
                "productId": null,
                "description": "Test Item for Payment",
                "quantity": 10,
                "unitPrice": 100,
                "taxRate": 18,
                "discountAmount": 0,
                "amount": 1000
            }
        ],
        "notes": "Test bill for payment"
    }')
    BILL_ID=$(echo $BILL_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✓ Created bill: $BILL_ID${NC}\n"

    # Test 1: Get pending bills
    increment_test
    print_test "$TOTAL_TESTS" "GET /payments/pending - Get bills pending payment"
    RESPONSE=$(make_request "GET" "/payments/pending")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved pending bills"
    else
        print_error "Failed to get pending bills" "$RESPONSE"
    fi

    # Test 2: Create payment
    increment_test
    print_test "$TOTAL_TESTS" "POST /payments - Record payment to vendor"
    RESPONSE=$(make_request "POST" "/payments" '{
        "vendorId": "'$VENDOR_ID'",
        "billId": "'$BILL_ID'",
        "paymentDate": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "paymentMethod": "BANK_TRANSFER",
        "amount": 500,
        "accountId": "'$ACCOUNT_ID_BANK'",
        "referenceNo": "PMT-TEST-001",
        "notes": "Partial payment test"
    }')
    PAYMENT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$PAYMENT_ID" ]; then
        print_success "Created payment: $PAYMENT_ID"
    else
        print_error "Failed to create payment" "$RESPONSE"
    fi

    # Test 3: Get all payments
    increment_test
    print_test "$TOTAL_TESTS" "GET /payments - List all payments"
    RESPONSE=$(make_request "GET" "/payments")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved payments"
    else
        print_error "Failed to get payments" "$RESPONSE"
    fi

    # Test 4: Get payment by ID
    increment_test
    print_test "$TOTAL_TESTS" "GET /payments/:id - Get payment details"
    RESPONSE=$(make_request "GET" "/payments/$PAYMENT_ID")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved payment details"
    else
        print_error "Failed to get payment details" "$RESPONSE"
    fi

    # Test 5: Get payments by vendor
    increment_test
    print_test "$TOTAL_TESTS" "GET /payments/vendor/:id - Get payments by vendor"
    RESPONSE=$(make_request "GET" "/payments/vendor/$VENDOR_ID")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved vendor payments"
    else
        print_error "Failed to get vendor payments" "$RESPONSE"
    fi

    # Test 6: Create another payment for deletion
    increment_test
    print_test "$TOTAL_TESTS" "DELETE /payments/:id - Delete payment (reverse journal)"
    RESPONSE=$(make_request "POST" "/payments" '{
        "vendorId": "'$VENDOR_ID'",
        "paymentDate": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "paymentMethod": "CASH",
        "amount": 100,
        "accountId": "'$ACCOUNT_ID_CASH'",
        "notes": "Payment to be deleted"
    }')
    TEMP_PAYMENT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$TEMP_PAYMENT_ID" ]; then
        DELETE_RESPONSE=$(make_request "DELETE" "/payments/$TEMP_PAYMENT_ID")
        if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
            print_success "Deleted payment and reversed journal"
        else
            print_error "Failed to delete payment" "$DELETE_RESPONSE"
        fi
    else
        print_error "Failed to create payment for deletion" "$RESPONSE"
    fi
}

###############################################################################
# Receipt Tests (6 endpoints)
###############################################################################

test_receipts() {
    print_header "RECEIPT TESTS (6 endpoints)"

    # First, create an invoice for receipt testing
    echo "Creating test invoice..."
    INVOICE_RESPONSE=$(make_request "POST" "/invoices" '{
        "customerId": "'$CUSTOMER_ID'",
        "invoiceDate": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "dueDate": "'$(date -u -d '+30 days' +%Y-%m-%dT%H:%M:%S.000Z)'",
        "items": [
            {
                "productId": null,
                "description": "Test Item for Receipt",
                "quantity": 5,
                "unitPrice": 200,
                "taxRate": 18,
                "discountAmount": 0,
                "amount": 1000
            }
        ],
        "notes": "Test invoice for receipt"
    }')
    INVOICE_ID=$(echo $INVOICE_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✓ Created invoice: $INVOICE_ID${NC}\n"

    # Test 1: Get pending invoices
    increment_test
    print_test "$TOTAL_TESTS" "GET /receipts/pending - Get invoices pending payment"
    RESPONSE=$(make_request "GET" "/receipts/pending")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved pending invoices"
    else
        print_error "Failed to get pending invoices" "$RESPONSE"
    fi

    # Test 2: Create receipt
    increment_test
    print_test "$TOTAL_TESTS" "POST /receipts - Record receipt from customer"
    RESPONSE=$(make_request "POST" "/receipts" '{
        "customerId": "'$CUSTOMER_ID'",
        "invoiceId": "'$INVOICE_ID'",
        "receiptDate": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "paymentMethod": "BANK_TRANSFER",
        "amount": 600,
        "accountId": "'$ACCOUNT_ID_BANK'",
        "referenceNo": "REC-TEST-001",
        "notes": "Partial receipt test"
    }')
    RECEIPT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$RECEIPT_ID" ]; then
        print_success "Created receipt: $RECEIPT_ID"
    else
        print_error "Failed to create receipt" "$RESPONSE"
    fi

    # Test 3: Get all receipts
    increment_test
    print_test "$TOTAL_TESTS" "GET /receipts - List all receipts"
    RESPONSE=$(make_request "GET" "/receipts")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved receipts"
    else
        print_error "Failed to get receipts" "$RESPONSE"
    fi

    # Test 4: Get receipt by ID
    increment_test
    print_test "$TOTAL_TESTS" "GET /receipts/:id - Get receipt details"
    RESPONSE=$(make_request "GET" "/receipts/$RECEIPT_ID")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved receipt details"
    else
        print_error "Failed to get receipt details" "$RESPONSE"
    fi

    # Test 5: Get receipts by customer
    increment_test
    print_test "$TOTAL_TESTS" "GET /receipts/customer/:id - Get receipts by customer"
    RESPONSE=$(make_request "GET" "/receipts/customer/$CUSTOMER_ID")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Retrieved customer receipts"
    else
        print_error "Failed to get customer receipts" "$RESPONSE"
    fi

    # Test 6: Create another receipt for deletion
    increment_test
    print_test "$TOTAL_TESTS" "DELETE /receipts/:id - Delete receipt (reverse journal)"
    RESPONSE=$(make_request "POST" "/receipts" '{
        "customerId": "'$CUSTOMER_ID'",
        "receiptDate": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "paymentMethod": "CASH",
        "amount": 100,
        "accountId": "'$ACCOUNT_ID_CASH'",
        "notes": "Receipt to be deleted"
    }')
    TEMP_RECEIPT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$TEMP_RECEIPT_ID" ]; then
        DELETE_RESPONSE=$(make_request "DELETE" "/receipts/$TEMP_RECEIPT_ID")
        if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
            print_success "Deleted receipt and reversed journal"
        else
            print_error "Failed to delete receipt" "$DELETE_RESPONSE"
        fi
    else
        print_error "Failed to create receipt for deletion" "$RESPONSE"
    fi
}

###############################################################################
# Main Test Execution
###############################################################################

main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   ZirakBook Accounts Module - Comprehensive Test Suite    ║"
    echo "║                    28 Endpoints Test                       ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"

    # Setup
    setup_test_environment

    # Run all test suites
    test_chart_of_accounts
    test_journal_entries
    test_payments
    test_receipts

    # Print summary
    print_header "TEST SUMMARY"
    echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"

    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}\n"
        exit 0
    else
        echo -e "\n${RED}✗ SOME TESTS FAILED${NC}\n"
        exit 1
    fi
}

# Run main function
main
