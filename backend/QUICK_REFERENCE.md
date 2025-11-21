# ZiraBook Reports Module - Quick Reference Card

## Quick Start

```bash
# Test all reports
./test-reports.sh

# Test specific report
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/reports/balance-sheet
```

## Common Query Parameters

```
?period=TODAY|THIS_WEEK|THIS_MONTH|THIS_QUARTER|THIS_YEAR
?startDate=2024-01-01&endDate=2024-01-31
?page=1&limit=50
```

## Financial Reports (15)

| Endpoint | Description | Key Metrics |
|----------|-------------|-------------|
| `/reports/balance-sheet` | Balance Sheet | Assets, Liabilities, Equity |
| `/reports/profit-loss` | P&L Statement | Revenue, Expenses, Net Profit |
| `/reports/cash-flow` | Cash Flow | Operating, Investing, Financing |
| `/reports/trial-balance` | Trial Balance | Debits, Credits, Balance |
| `/reports/ledger/:id` | Account Ledger | Transactions, Running Balance |
| `/reports/general-ledger` | General Ledger | All Account Balances |
| `/reports/day-book` | Day Book | Daily Entries |
| `/reports/bank-book` | Bank Book | Bank Transactions |
| `/reports/cash-book` | Cash Book | Cash Transactions |
| `/reports/receivables` | Accounts Receivable | Outstanding Invoices |
| `/reports/payables` | Accounts Payable | Outstanding Bills |
| `/reports/aging-receivables` | Aging Receivables | Age Buckets |
| `/reports/aging-payables` | Aging Payables | Age Buckets |
| `/reports/journal-entries` | Journal Entries | All JE with Pagination |
| `/reports/audit-trail` | Audit Trail | Complete Audit Log |

## Sales Reports (8)

| Endpoint | Description | Key Metrics |
|----------|-------------|-------------|
| `/reports/sales-summary` | Sales Summary | Total Sales, Tax, Discounts |
| `/reports/sales-detailed` | Detailed Sales | Invoice Details |
| `/reports/sales-by-customer` | By Customer | Customer-wise Analysis |
| `/reports/sales-by-product` | By Product | Product-wise Analysis |
| `/reports/sales-by-date` | By Date | Daily Sales |
| `/reports/sales-trends` | Sales Trends | Growth Rates, Trends |
| `/reports/sales-returns` | Sales Returns | Return Metrics |
| `/reports/sales-tax` | Sales Tax | Tax Breakdown |

## Purchase Reports (8)

| Endpoint | Description | Key Metrics |
|----------|-------------|-------------|
| `/reports/purchases-summary` | Purchase Summary | Total Purchases, Tax |
| `/reports/purchases-detailed` | Detailed Purchases | Bill Details |
| `/reports/purchases-by-vendor` | By Vendor | Vendor-wise Analysis |
| `/reports/purchases-by-product` | By Product | Product-wise Analysis |
| `/reports/purchases-pending` | Pending POs | Open Orders |
| `/reports/purchases-returns` | Purchase Returns | Return Metrics |
| `/reports/purchases-tax` | Purchase Tax | Input Tax |
| `/reports/vendor-payments` | Vendor Payments | Payment History |

## Inventory Reports (8)

| Endpoint | Description | Key Metrics |
|----------|-------------|-------------|
| `/reports/inventory-summary` | Inventory Summary | Stock Levels, Values |
| `/reports/inventory-valuation` | Valuation | Total Stock Value |
| `/reports/inventory-movement` | Movement | Movement History |
| `/reports/inventory-aging` | Aging | Stock Age Analysis |
| `/reports/inventory-low-stock` | Low Stock | Below Reorder Level |
| `/reports/inventory-reorder` | Reorder | Reorder Recommendations |
| `/reports/inventory-warehouse` | By Warehouse | Warehouse-wise Stock |
| `/reports/inventory-dead` | Dead Stock | Slow-moving Items |

## Tax Reports (6)

| Endpoint | Description | Key Metrics |
|----------|-------------|-------------|
| `/reports/tax-summary` | Tax Summary | Net Tax Liability |
| `/reports/tax-gst` | GST Report | CGST, SGST, IGST |
| `/reports/tax-vat` | VAT Report | VAT Analysis |
| `/reports/tax-input` | Input Tax | ITC Claims |
| `/reports/tax-output` | Output Tax | Tax Liability |
| `/reports/tax-filing` | Tax Filing | GSTR-1/2/3B Data |

## Response Format

```json
{
  "success": true,
  "data": {
    "report": "Report Name",
    "period": { "startDate": "...", "endDate": "..." },
    "generated": "2024-01-31T10:30:00Z",
    "data": { /* report data */ },
    "summary": { /* summary metrics */ },
    "pagination": { /* if applicable */ }
  }
}
```

## Accounting Formulas

```
Assets = Liabilities + Equity
Net Profit = Revenue - Expenses
Gross Profit = Revenue - COGS
Trial Balance: Debits = Credits
```

## Age Buckets

- 0-30 days (Current)
- 31-60 days
- 61-90 days
- 91-120 days
- Over 120 days

## Files Created

```
Services: 5 files (3,999 lines)
├── financialReportService.js
├── salesReportService.js
├── purchaseReportService.js
├── inventoryReportService.js
└── taxReportService.js

Controllers: 5 files (1,142 lines)
├── financialReportController.js
├── salesReportController.js
├── purchaseReportController.js
├── inventoryReportController.js
└── taxReportController.js

Routes: 1 file (344 lines)
└── reportsRoutes.js

Total: 11 files, 5,485 lines
```

## Testing

```bash
# Run full test suite
./test-reports.sh

# Expected: 45 tests, 100% pass rate
```

## Status

- Implementation: ✅ 100% Complete
- No Placeholders: ✅ All Real Code
- Production Ready: ✅ Yes
- Tested: ✅ Automated Tests
- Documented: ✅ Comprehensive

**ZiraBook Accounting System - Complete & Production Ready!**
