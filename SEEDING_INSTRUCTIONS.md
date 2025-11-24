# Database Seeding Instructions for Railway Production

## Current Status

✅ **Backend**: Running at https://accounting-software-production.up.railway.app
✅ **Frontend**: Running at https://frontend-production-32b8.up.railway.app
✅ **Database**: PostgreSQL on Railway with old seed data

### Existing Data (OLD SEED)
- 1 Company: "ZirakBook Company"
- 1 User: admin@zirakbook.com (SUPERADMIN)
- 9 Chart of Accounts

### New Enhanced Seed Will Add
- 1 Platform Company: "ZirakBook Platform"
- 1 SUPERADMIN: superadmin@test.com
- 3 Demo Companies with full data
- 8 Users across companies
- 75+ Chart of Accounts
- 30 Customers
- 15 Vendors
- 15 Categories/Brands
- 36 Products

## Option 1: Keep Existing Data (Recommended for Testing)

The new seed file is designed to be idempotent - it will ADD new data without deleting existing data.

### Steps:

1. **Access Railway Project**
   ```bash
   # Login to Railway
   railway login

   # Link to project
   railway link
   ```

2. **Run Seed via Railway CLI**
   ```bash
   # Navigate to backend
   cd backend

   # Connect to Railway environment
   railway run npm run prisma:seed
   ```

3. **Verify Seeding**
   After seeding, you'll have:
   - Old admin@zirakbook.com (still works)
   - New superadmin@test.com (works)
   - New demo companies and users (work)

4. **Test Logins**
   - Old: admin@zirakbook.com / Admin123!
   - New: superadmin@test.com / Test@123456
   - New: companyadmin@test.com / Test@123456

## Option 2: Fresh Start (Clean Database)

⚠️ **WARNING**: This will DELETE ALL existing data!

Only use if you want to start completely fresh.

### Steps:

1. **Backup Existing Data** (if needed)
   ```bash
   railway connect postgres
   # In psql:
   \dt
   SELECT COUNT(*) FROM "User";
   \q
   ```

2. **Reset Database**
   ```bash
   cd backend
   railway run npx prisma migrate reset --force
   ```

3. **Run Seed**
   ```bash
   railway run npm run prisma:seed
   ```

4. **Verify**
   - Only new users will exist
   - Old admin@zirakbook.com will NOT work
   - All demo users will work

## Option 3: Manual Seeding via Railway Dashboard

1. Go to Railway Dashboard
2. Select your backend service
3. Click on "Settings"
4. Under "Deploy" section, find "Custom Start Command"
5. Temporarily change to:
   ```
   npx prisma db seed && node src/server.js
   ```
6. Save and trigger a redeploy
7. Watch logs to see seed running
8. Once completed, change start command back to:
   ```
   node src/server.js
   ```
9. Redeploy again

## Recommended Approach for Production

**For your situation, I recommend Option 1** because:
- ✅ Keeps existing admin user working
- ✅ Adds all new demo data
- ✅ No downtime
- ✅ Can be rolled back easily
- ✅ Safe for testing

### Execute Now:

```bash
# From root of project
cd /root/zirabook-accounting-full/backend

# Make sure Railway is configured
railway login
railway link

# Run seed
railway run npm run prisma:seed
```

### Expected Output:

```
╔════════════════════════════════════════════════════════════╗
║  ZirakBook Production Database Seeder                      ║
║  Multi-Tenant SaaS with Demo Data                          ║
╚════════════════════════════════════════════════════════════╝

📦 STEP 1: Creating Platform Company...
✅ Platform Company created: ZirakBook Platform

👤 STEP 2: Creating SUPERADMIN...
✅ SUPERADMIN created: superadmin@test.com

🏢 STEP 3: Creating Demo Companies...
✅ Company created: TechVision Inc
✅ Company created: Global Retail Co
✅ Company created: Manufacturing Solutions LLC

👥 STEP 4: Creating Users for Companies...
✅ User created: Company Admin (COMPANY_ADMIN)
✅ User created: Test Accountant (ACCOUNTANT)
... [more users]

📊 STEP 5: Creating Chart of Accounts...
✅ Created 25 accounts for TechVision Inc
... [more accounts]

👥 STEP 6: Creating Demo Customers...
✅ Created 10 customers for TechVision Inc
... [more customers]

🏭 STEP 7: Creating Demo Vendors...
✅ Created 5 vendors for TechVision Inc
... [more vendors]

📦 STEP 8: Creating Categories & Brands...
✅ Created 5 categories for TechVision Inc
... [more categories]

📦 STEP 9: Creating Demo Products...
✅ Created 12 products for TechVision Inc
... [more products]

╔════════════════════════════════════════════════════════════╗
║  ✅ Database Seeding Completed Successfully!               ║
╠════════════════════════════════════════════════════════════╣
║  LOGIN CREDENTIALS (All use password: Test@123456)        ║
║  ...                                                       ║
╚════════════════════════════════════════════════════════════╝
```

## After Seeding

### Test All Logins

1. **Old Admin** (should still work):
   - Email: admin@zirakbook.com
   - Password: Admin123!
   - Should redirect to /dashboard

2. **New SUPERADMIN**:
   - Email: superadmin@test.com
   - Password: Test@123456
   - Should redirect to /dashboard

3. **TechVision Admin**:
   - Email: companyadmin@test.com
   - Password: Test@123456
   - Should redirect to /company/dashboard

4. **Global Retail Admin**:
   - Email: admin@globalretail.com
   - Password: Test@123456
   - Should redirect to /company/dashboard

### Run Verification Tests

```bash
# From root of project
npx playwright test tests/verify-production-status.spec.js

# Should now show both old and new users exist

# Run multi-tenant tests
npx playwright test tests/multi-tenant-verification.spec.js
```

### Verify Data in Database

```bash
railway connect postgres

# In psql:
SELECT COUNT(*) FROM "Company";     # Should be 5 (1 old + 4 new)
SELECT COUNT(*) FROM "User";        # Should be 10 (1 old + 9 new)
SELECT COUNT(*) FROM "Customer";    # Should be 30
SELECT COUNT(*) FROM "Product";     # Should be 36
SELECT COUNT(*) FROM "Account";     # Should be ~84 (9 old + 75 new)

SELECT email, role, "companyId" FROM "User";  # See all users

\q
```

## Troubleshooting

### Seed Fails with "already exists"

This is normal! The seed checks for existing records. If you see:
```
⚠️  Platform Company already exists
⚠️  SUPERADMIN already exists
```

This means those records are already in the database (from a previous seed run).

### Seed Fails with Database Error

1. Check DATABASE_URL is correct:
   ```bash
   railway variables
   ```

2. Check database is accessible:
   ```bash
   railway connect postgres
   ```

3. Check Prisma schema is generated:
   ```bash
   npx prisma generate
   ```

### Old Admin Stops Working

If you accidentally ran Option 2 (reset):
- Old admin@zirakbook.com won't exist anymore
- Only new users will work
- This is expected behavior for a reset

To restore old admin, you'd need to:
1. Restore from backup, OR
2. Manually create the user in database

## Next Steps After Successful Seeding

1. ✅ Test all login credentials
2. ✅ Run multi-tenant verification tests
3. ✅ Test data isolation between companies
4. ✅ Complete UI testing for all pages
5. ✅ Generate production-ready report

## Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Check database connection: `railway connect postgres`
3. Verify environment variables: `railway variables`
4. Review seed file for errors
5. Check Prisma migrations: `npx prisma migrate status`

---

**Ready to seed? Execute Option 1 steps above!**
