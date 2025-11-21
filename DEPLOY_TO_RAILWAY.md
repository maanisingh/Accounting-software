# 🚀 Deploy ZirakBook to Railway - Step by Step Guide

## ✅ Prerequisites Complete
- ✅ Code pushed to GitHub: https://github.com/maanisingh/Accounting-software
- ✅ Backend and Frontend ready to deploy
- ✅ All configuration files in place

## 📦 What We're Deploying

1. **Backend API** (Express + Prisma + PostgreSQL)
   - Location: `/backend` folder
   - Port: 8003
   - Database: PostgreSQL

2. **Frontend** (React + Vite + TypeScript)
   - Location: Root folder
   - Build: Static files
   - Serves from: `/dist` folder

---

## 🎯 Deployment Steps

### Step 1: Create New Railway Project

1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Click **"Deploy from GitHub repo"**
4. Select: **maanisingh/Accounting-software**

### Step 2: Deploy Backend Service

Railway will detect your repo. Now configure the backend:

1. **Click "Add Service"** → **"GitHub Repo"**
2. Select the same repo: `maanisingh/Accounting-software`
3. **Important Settings:**
   - **Name:** ZirakBook-Backend
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `node src/server.js`

4. **Add Environment Variables** (in Variables tab):

```env
NODE_ENV=production
PORT=${{PORT}}
API_VERSION=v1

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your_super_secret_jwt_key_change_this_now
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_too
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_ATTEMPTS=5
```

### Step 3: Add PostgreSQL Database

1. In your project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically create the database
3. Go back to **Backend service** → **Variables**
4. Add this variable:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

### Step 4: Run Database Migration

After the backend deploys successfully:

1. Go to **Backend service** → **Settings**
2. Update **Start Command** to:
   ```bash
   npx prisma db push && node src/server.js
   ```
3. Click **"Deploy"** to redeploy

This will create all database tables on first run.

### Step 5: Deploy Frontend Service

1. **Click "New Service"** → **"GitHub Repo"**
2. Select: `maanisingh/Accounting-software`
3. **Important Settings:**
   - **Name:** ZirakBook-Frontend
   - **Root Directory:** `/` (leave empty or use root)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node server.js`

4. **Add Environment Variables:**
   ```env
   VITE_API_URL=${{ZirakBook-Backend.RAILWAY_PUBLIC_DOMAIN}}
   ```

### Step 6: Get Your URLs

After both services deploy:

1. **Backend URL:** Click on Backend service → Settings → Generate Domain
   - Example: `https://zirakbook-backend-production.up.railway.app`

2. **Frontend URL:** Click on Frontend service → Settings → Generate Domain
   - Example: `https://zirakbook-frontend-production.up.railway.app`

3. **Update CORS:** Go back to Backend → Variables → Update:
   ```
   CORS_ORIGIN=https://zirakbook-frontend-production.up.railway.app
   ```

---

## 🧪 Testing Your Deployment

### Test Backend

```bash
# Health check
curl https://your-backend-url.up.railway.app/api/health

# API info
curl https://your-backend-url.up.railway.app/api

# Register a test user
curl -X POST https://your-backend-url.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123456",
    "confirmPassword": "Admin@123456",
    "name": "Admin User",
    "role": "SUPERADMIN"
  }'
```

### Test Frontend

1. Open: `https://your-frontend-url.up.railway.app`
2. You should see the ZirakBook login page
3. Try logging in with the user you created

---

## 🎨 Optional: Custom Domain

To add a custom domain like `zirakbook.com`:

1. Go to Frontend service → Settings → Domains
2. Click **"Custom Domain"**
3. Add your domain: `zirakbook.com`
4. Add DNS records as Railway instructs
5. Repeat for backend: `api.zirakbook.com`

---

## 📊 Railway Project Structure

```
ZirakBook Project
├── PostgreSQL Database
│   └── Provides: DATABASE_URL
│
├── Backend Service (Node.js)
│   ├── GitHub: maanisingh/Accounting-software
│   ├── Root: /backend
│   ├── Port: 8003
│   └── URL: https://zirakbook-backend-xxxxx.up.railway.app
│
└── Frontend Service (Static)
    ├── GitHub: maanisingh/Accounting-software
    ├── Root: /
    ├── Build: npm run build
    └── URL: https://zirakbook-frontend-xxxxx.up.railway.app
```

---

## 🔧 Troubleshooting

### Backend Won't Start

**Issue:** Port binding error
**Solution:** Make sure you're using `process.env.PORT` in code

**Issue:** Prisma client not found
**Solution:** Add to Build Command: `npx prisma generate`

**Issue:** Database connection error
**Solution:** Verify `DATABASE_URL` variable is set to `${{Postgres.DATABASE_URL}}`

### Frontend Build Fails

**Issue:** Memory error during build
**Solution:** Add to Variables: `NODE_OPTIONS=--max-old-space-size=4096`

**Issue:** API calls failing
**Solution:** Check `VITE_API_URL` points to backend domain (with https://)

### Database Tables Missing

**Issue:** Tables not created
**Solution:** Run `npx prisma db push` via Start Command or Railway CLI

---

## 💡 Pro Tips

1. **Watch Build Logs:** Click on deployment → View Logs to see real-time progress
2. **Environment Variables:** Use Railway's variable referencing: `${{ServiceName.VARIABLE}}`
3. **Auto Deploy:** Every push to `main` branch will trigger auto-deployment
4. **Rollback:** Click on any previous deployment to rollback instantly
5. **Health Checks:** Railway automatically monitors your service health

---

## 🎯 Expected Results

After successful deployment:

✅ Backend API running on Railway
✅ Frontend app running on Railway
✅ PostgreSQL database connected
✅ All 19+ API endpoints working
✅ Authentication & authorization functional
✅ Auto-deploy on GitHub push
✅ HTTPS enabled by default
✅ Zero-downtime deployments

---

## 📞 Need Help?

- **Railway Docs:** https://docs.railway.app
- **GitHub Repo:** https://github.com/maanisingh/Accounting-software
- **Railway Dashboard:** https://railway.app/dashboard

---

**Current Status:** ✅ Code ready, waiting for Railway deployment

**Estimated Time:** 10-15 minutes for full deployment
