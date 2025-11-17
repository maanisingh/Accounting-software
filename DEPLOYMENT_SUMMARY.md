# ZirakBook Accounting Software - Deployment Summary

## Deployment Information
- **URL**: https://accounting.alexandratechlab.com
- **Project Name**: ZirakBook (Accounting Software)
- **Type**: React + Vite SPA
- **Deployment Date**: November 13, 2025

## Configuration Details

### Frontend
- **Location**: `/var/www/accounting`
- **Build Tool**: Vite 6.3.6
- **Framework**: React 19.1.0
- **Build Command**: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`

### API Configuration
- **Backend API URL**: https://accounting-api.alexandratechlab.com/api/v1/
- **Config File**: `/root/Accounting-software/src/Api/BaseUrl.jsx`

### Nginx Configuration
- **Config File**: `/etc/nginx/sites-available/accounting.alexandratechlab.com`
- **Document Root**: `/var/www/accounting`
- **Access Log**: `/var/log/nginx/accounting_access.log`
- **Error Log**: `/var/log/nginx/accounting_error.log`

### SSL Certificate
- **Certificate**: `/etc/letsencrypt/live/accounting.alexandratechlab.com/fullchain.pem`
- **Private Key**: `/etc/letsencrypt/live/accounting.alexandratechlab.com/privkey.pem`
- **Expires**: February 11, 2026
- **Auto-renewal**: Enabled via Certbot

## Build Fixes Applied

### Case Sensitivity Issues
1. Fixed import: `./Components/Company-Dashboard/Reports/liabilitydetails` → `Liabilitydetails`
2. Fixed import: `../../../assets/zirak.jpeg` → `Zirak.jpeg`
3. Fixed import: `./header.css` → `Header.css`

### Known Build Warnings
- Duplicate keys in object literals (non-blocking):
  - `CreateVoucher.jsx`: paidTo, receivedFrom
  - `AllAcounts.jsx`: gstin
  - `CustomersDebtors.jsx`: email
  - `MultiStepSalesForm.jsx`: manualQuotationRef
- Large chunk size warning (4.7MB main bundle)

## Port Usage
No backend port required (static site only)

## Features
- Complete accounting/bookkeeping system
- Multi-language support (English, Arabic)
- Inventory management
- Sales & Purchase tracking
- Customer/Vendor management
- Reports & Analytics
- Invoice generation
- GST/Tax management

## Verification
```bash
# Test HTTPS
curl -I https://accounting.alexandratechlab.com

# Check Nginx status
systemctl status nginx

# View logs
tail -f /var/log/nginx/accounting_access.log
tail -f /var/log/nginx/accounting_error.log
```

## Notes
- The application requires a backend API for full functionality
- Backend API should be deployed at: https://accounting-api.alexandratechlab.com
- Current backend configuration points to external API endpoint
- Consider deploying the Accounting-Prisma backend for complete functionality

## Maintenance

### Update Deployment
```bash
cd /root/Accounting-software
git pull
npm install
NODE_OPTIONS="--max-old-space-size=4096" npm run build
cp -r dist/* /var/www/accounting/
```

### Renew SSL (automatic)
Certbot will auto-renew. Manual renewal:
```bash
certbot renew
systemctl reload nginx
```

## Project Structure
- **Repository**: https://github.com/ap8114/Accounting-software
- **Source**: `/root/Accounting-software`
- **Deployment**: `/var/www/accounting`
