# Railway Database Seeding Instructions

## Current Situation

The enhanced database seed has been:
- ✅ Created locally (`backend/prisma/seed.js`)
- ✅ Tested locally (all users and demo data created successfully)
- ✅ Committed to git
- ✅ Pushed to Railway

**However**: Railway database does NOT have the new seeded users yet because Railway doesn't automatically run seed scripts on deployment.

## What the Seed Contains

### Users (10 total):
1. **superadmin@test.com** - SUPERADMIN (Platform Admin)
2. **companyadmin@test.com** - COMPANY_ADMIN (TechVision Inc)
3. **accountant@testcompany.com** - ACCOUNTANT (TechVision Inc)
4. **manager@testcompany.com** - MANAGER (TechVision Inc)
5. **sales@testcompany.com** - SALES_USER (TechVision Inc)
6. **admin@globalretail.com** - COMPANY_ADMIN (Global Retail Co)
7. **accountant@globalretail.com** - ACCOUNTANT (Global Retail Co)
8. **admin@mfgsolutions.com** - COMPANY_ADMIN (Manufacturing Solutions LLC)
9. **accountant@mfgsolutions.com** - ACCOUNTANT (Manufacturing Solutions LLC)

**All passwords**: `Test@123456`

### Demo Data:
- 3 Companies (TechVision, Global Retail, Manufacturing Solutions)
- 75 Chart of Accounts (25 per company)
- 30 Customers (10 per company)
- 15 Vendors (5 per company)
- 36 Products (12 per company)
- 6 Product Categories (2 per company)

## How to Apply Seed to Railway

### Option 1: Railway Dashboard (EASIEST)

1. Go to Railway Dashboard: https://railway.app/
2. Select your **Backend** service
3. Click on the **Settings** tab
4. Add a new **Build Command**:
   ```
   npm install && npm run prisma:generate && npx prisma migrate deploy && npx prisma db seed
   ```
5. Click **Deploy** to trigger a new deployment
6. Monitor the deployment logs to see seed output

### Option 2: Railway CLI (If Available)

```bash
# Login to Railway (if not already)
railway login

# Link to your project (if not already)
railway link

# Run the seed
railway run npx prisma db seed
```

### Option 3: Direct Database Access (Advanced)

If you have direct DATABASE_URL from Railway:

```bash
# Export Railway DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run migrations first
npx prisma migrate deploy

# Run seed
npx prisma db seed
```

## Verification After Seeding

### Test 1: Check User Count
```bash
curl -X POST https://accounting-software-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@test.com","password":"Test@123456"}'
```

Expected: Should return success with user token

### Test 2: Run Login Test Script
```bash
/tmp/test_all_logins.sh
```

Expected: All 9 users should login successfully (not "Invalid email or password")

### Test 3: Run Comprehensive Frontend Test
```bash
cd /root/zirabook-accounting-full
npx playwright test tests/comprehensive-login-and-page-analysis.spec.js --reporter=list
```

Expected: All tests should pass

## Current Test Results (Before Seed)

```
Testing: superadmin@test.com (SUPERADMIN - Platform)
  ❌ FAILED - Invalid email or password

Testing: companyadmin@test.com (COMPANY_ADMIN - TechVision)
  ❌ FAILED - Invalid email or password

... (all failing)
```

## Expected Test Results (After Seed)

```
Testing: superadmin@test.com (SUPERADMIN - Platform)
  ✅ SUCCESS - User: Super Admin, Role: SUPERADMIN

Testing: companyadmin@test.com (COMPANY_ADMIN - TechVision)
  ✅ SUCCESS - User: Company Admin, Role: COMPANY_ADMIN

... (all passing)
```

## Troubleshooting

### "prisma db seed command not found"
- Make sure package.json has the prisma.seed configuration
- Run `npm install` first

### "Database already contains data"
- Seed is idempotent - it checks for existing data
- If you see "✓ Existing user found" - seed is working correctly
- It won't duplicate data

### "Connection timeout"
- Railway database might be sleeping
- Wait a few seconds and try again

## Next Steps After Successful Seed

1. ✅ Verify all 9 users can login via API
2. ✅ Test frontend login with different roles
3. ✅ Run comprehensive page analysis test
4. ✅ Verify multi-tenant data isolation
5. ✅ Take screenshots of logged-in dashboards
6. ✅ Document what renders on each critical page

## Files Modified

- `backend/package.json` - Added prisma.seed configuration
- `backend/scripts/deploy-seed.sh` - Deployment seed script
- `backend/prisma/seed.js` - Enhanced seed (579 lines, 10 users, 3 companies)
