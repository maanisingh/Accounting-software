# ZirakBook - Production Deployment Guide

## Current Deployment Status

### Deployed Services
- **Frontend**: https://frontend-production-32b8.up.railway.app
- **Backend API**: https://accounting-software-production.up.railway.app
- **Database**: PostgreSQL on Railway (Private Network)

## Database Seeding for Production

### Important: Run Seed ONCE Only

The seed file (`backend/prisma/seed.js`) has been enhanced to create comprehensive demo data. Run it once to populate the database.

### Method 1: Run Seed via Railway CLI

```bash
# From backend directory
cd backend

# Set DATABASE_URL to production (get from Railway dashboard)
export DATABASE_URL="postgresql://..."

# Run seed
npm run prisma:seed
```

### Method 2: Run Seed via Railway Dashboard

1. Go to Railway Project > Backend Service
2. Click on "Settings" tab
3. Under "Deployment", find "Custom Start Command"
4. Temporarily change to: `npx prisma db seed && node src/server.js`
5. Trigger a redeploy
6. After seed completes, change back to: `node src/server.js`

### Method 3: Run Seed Locally Against Production DB

```bash
cd backend

# Copy DATABASE_URL from Railway environment variables
# Set it temporarily
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway"

# Run seed
npm run prisma:seed

# Verify
npx prisma studio
```

### What Gets Created

The seed creates:

#### Platform
- 1 Platform Company (ZirakBook Platform)
- 1 SUPERADMIN user

#### 3 Demo Companies
- TechVision Inc (Austin, TX)
- Global Retail Co (New York, NY)
- Manufacturing Solutions LLC (Detroit, MI)

#### Per Company
- 8 users (COMPANY_ADMIN, ACCOUNTANT, MANAGER, SALES_USER, etc.)
- 25 Chart of Accounts
- 10 Customers
- 5 Vendors
- 5 Categories
- 5 Brands
- 12 Products (10 goods + 2 services)

**Total Records Created:**
- 4 Companies
- 9 Users
- 75 Accounts (25 per company × 3)
- 30 Customers (10 per company × 3)
- 15 Vendors (5 per company × 3)
- 15 Categories
- 15 Brands
- 36 Products

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="30d"

# CORS
CORS_ORIGIN="https://frontend-production-32b8.up.railway.app"

# App
NODE_ENV="production"
PORT="3000"

# Redis (Optional, if using caching)
REDIS_URL="redis://..."
REDIS_ENABLED="false"
```

### Frontend (.env.production)

```bash
VITE_API_URL=https://accounting-software-production.up.railway.app/api/v1
```

## Railway Configuration

### Backend Service

**Build Command:**
```bash
cd backend && npm install && npx prisma generate
```

**Start Command:**
```bash
node src/server.js
```

**Root Directory:**
```
/
```

**Watch Paths:**
```
backend/**
```

### Frontend Service

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start
```

**Environment Variables:**
- `VITE_API_URL`: https://accounting-software-production.up.railway.app/api/v1

## Health Checks

### Backend Health Check
```bash
curl https://accounting-software-production.up.railway.app/health
```

Expected Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-24T...",
  "uptime": 12345,
  "environment": "production"
}
```

### Frontend Health Check
```bash
curl https://frontend-production-32b8.up.railway.app
```

Should return the HTML page.

### Database Connection Check
```bash
curl https://accounting-software-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@test.com","password":"Test@123456"}'
```

## Verification Steps

### 1. Verify Database Seeding

```bash
# Login to Railway project
railway login

# Connect to database
railway connect postgres

# In psql:
\dt                           # List tables
SELECT COUNT(*) FROM "User";  # Should return 9
SELECT COUNT(*) FROM "Company";  # Should return 4
SELECT COUNT(*) FROM "Customer";  # Should return 30
SELECT COUNT(*) FROM "Product";  # Should return 36

# Check users
SELECT email, role, status FROM "User";

# Exit
\q
```

### 2. Verify API Endpoints

```bash
# Test login
curl -X POST https://accounting-software-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@test.com","password":"Test@123456"}'

# Test with token (replace YOUR_TOKEN)
curl https://accounting-software-production.up.railway.app/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Verify Frontend

1. Open https://frontend-production-32b8.up.railway.app/login
2. Try logging in with: `superadmin@test.com` / `Test@123456`
3. Should redirect to `/dashboard`
4. Should see "Super Admin" name or dashboard content

### 4. Verify Multi-Tenant Isolation

1. Login as `companyadmin@test.com` / `Test@123456`
2. Navigate to Customers
3. Should see only TechVision Inc customers (10 customers)
4. Logout
5. Login as `admin@globalretail.com` / `Test@123456`
6. Navigate to Customers
7. Should see only Global Retail Co customers (different 10 customers)

## Troubleshooting

### Seed Fails with "User already exists"

The seed is idempotent - it checks for existing records before creating. This is expected if you've run it before.

If you need to re-seed:

```bash
# WARNING: This deletes all data!
cd backend
npx prisma migrate reset
npm run prisma:seed
```

### Backend Won't Start

1. Check Railway logs: `railway logs`
2. Verify DATABASE_URL is set
3. Verify Prisma client is generated: `npx prisma generate`
4. Check for build errors

### Frontend Shows 404

1. Verify build completed successfully
2. Check that `dist` folder was created
3. Verify server.js is serving from `dist`
4. Check Railway logs for frontend service

### Login Returns 401

1. Verify database was seeded
2. Check user exists: `SELECT * FROM "User" WHERE email = 'superadmin@test.com';`
3. Verify password is exactly `Test@123456` (case-sensitive)
4. Check JWT_SECRET is set in backend environment

### CORS Errors

1. Verify CORS_ORIGIN is set to frontend URL
2. Check backend logs for CORS errors
3. Ensure frontend is using correct API URL

### Multi-Tenant Isolation Not Working

1. Check middleware is applied to all routes
2. Verify `companyId` filter is in all database queries
3. Check user's `companyId` is set correctly
4. Review auth middleware implementation

## Database Migrations

### Running Migrations in Production

```bash
# From backend directory
cd backend

# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy
```

### Creating New Migrations

```bash
# In development
cd backend
npx prisma migrate dev --name description_of_change

# Commit migration files
git add prisma/migrations
git commit -m "Add migration: description_of_change"

# Deploy to production via Railway
# Railway will run: npx prisma migrate deploy
```

## Backup and Recovery

### Database Backup

```bash
# Connect to Railway database
railway connect postgres

# In Railway shell
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Download backup
railway down backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Upload backup
railway up backup.sql

# Connect and restore
railway connect postgres
psql $DATABASE_URL < backup.sql
```

## Monitoring

### Application Logs

```bash
# Backend logs
railway logs --service backend

# Frontend logs
railway logs --service frontend
```

### Performance Metrics

Check Railway dashboard for:
- CPU usage
- Memory usage
- Response times
- Error rates
- Database connection pool

## Security Checklist

- [ ] JWT secrets are strong and unique
- [ ] DATABASE_URL is in environment variables (not code)
- [ ] CORS_ORIGIN is set to frontend URL only
- [ ] HTTPS is enforced (Railway does this automatically)
- [ ] Rate limiting is enabled
- [ ] SQL injection protection (Prisma handles this)
- [ ] Password hashing is bcrypt with salt rounds >= 10
- [ ] Sensitive data is not logged
- [ ] Error messages don't leak sensitive information

## Scaling Considerations

### Database

- Monitor query performance
- Add indexes as needed
- Consider connection pooling
- Plan for database size growth

### Backend

- Railway auto-scales based on load
- Monitor memory usage
- Consider caching frequently accessed data
- Implement Redis for session storage

### Frontend

- Optimize bundle size
- Enable gzip compression
- Use CDN for static assets
- Implement lazy loading for routes

## Next Steps

1. **Run Database Seed** (if not done)
2. **Test All User Roles**
3. **Run Multi-Tenant Tests**
4. **Complete UI Testing**
5. **Set Up Monitoring**
6. **Configure Alerts**
7. **Document Workflows**
8. **Train Users**

## Support

- Railway Docs: https://docs.railway.app
- Prisma Docs: https://www.prisma.io/docs
- Check logs: `railway logs`
- Database console: `railway connect postgres`
