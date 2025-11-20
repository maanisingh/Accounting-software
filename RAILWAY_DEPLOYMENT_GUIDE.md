# ZirakBook - Railway Deployment Guide

## ✅ What's Already Done

1. **✅ Code pushed to GitHub**
   - Repository: https://github.com/maanisingh/zirakbook-accounting-backend
   - Branch: main
   - All code committed and pushed

2. **✅ Backend Production Ready**
   - 19 API endpoints working
   - Quality score: 92.75%
   - Currently running on: https://zirakbook.alexandratechlab.com

## 🚂 Deploy to Railway (2 Options)

### Option 1: Deploy via Railway Dashboard (Recommended - Easiest)

1. **Go to Railway Dashboard**
   ```
   https://railway.app/dashboard
   ```

2. **Click "New Project"**

3. **Select "Deploy from GitHub repo"**

4. **Connect your GitHub account** (if not already connected)

5. **Select repository:** `maanisingh/zirakbook-accounting-backend`

6. **Railway will auto-detect Node.js** and start deployment

7. **Add Environment Variables** (Click on your service → Variables tab):
   ```env
   NODE_ENV=production
   PORT=8000
   API_VERSION=v1

   # Database (Use Railway's PostgreSQL plugin)
   DATABASE_URL=<Railway will provide this>

   # JWT Secrets
   JWT_SECRET=zirakbook_jwt_secret_2024_very_secure_key_change_in_production_32chars_minimum
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=zirakbook_refresh_secret_2024_very_secure_key_change_production_32chars
   JWT_REFRESH_EXPIRES_IN=7d

   # Security
   BCRYPT_ROUNDS=12
   CORS_ORIGIN=*

   # Redis (Optional - use Railway's Redis plugin)
   REDIS_HOST=<Railway will provide>
   REDIS_PORT=<Railway will provide>
   REDIS_PASSWORD=<Railway will provide>
   REDIS_DB=0

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   RATE_LIMIT_AUTH_MAX_ATTEMPTS=5
   ```

8. **Add PostgreSQL Database**
   - Click "+ New" → "Database" → "Add PostgreSQL"
   - Railway will automatically set `DATABASE_URL`

9. **Add Redis (Optional)**
   - Click "+ New" → "Database" → "Add Redis"
   - Railway will automatically set Redis variables

10. **Deploy!**
    - Railway will automatically build and deploy
    - You'll get a public URL like: `https://zirakbook-production.up.railway.app`

### Option 2: Deploy via Railway CLI

1. **Login to Railway**
   ```bash
   railway login
   ```
   This will open a browser window for authentication.

2. **Initialize Railway Project**
   ```bash
   cd /root/zirabook-accounting-full/backend
   railway init
   ```

3. **Link to your project** (after creating it in dashboard)
   ```bash
   railway link <project-id>
   ```

4. **Add PostgreSQL**
   ```bash
   railway add --plugin postgresql
   ```

5. **Add Redis** (Optional)
   ```bash
   railway add --plugin redis
   ```

6. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=<your-secret>
   # ... add all other variables
   ```

7. **Deploy**
   ```bash
   railway up
   ```

## 📋 Post-Deployment Checklist

After Railway deployment:

1. **Run Database Migrations**
   ```bash
   # Via Railway CLI
   railway run npx prisma generate
   railway run npx prisma db push
   ```

   Or via Railway Dashboard:
   - Go to your service
   - Click "Settings" → "Deploy"
   - Add this to the deploy command: `npx prisma generate && npx prisma db push && node src/server.js`

2. **Test the Deployment**
   ```bash
   # Health check
   curl https://your-railway-url.up.railway.app/api/health

   # Register a user
   curl -X POST https://your-railway-url.up.railway.app/api/v1/auth/register \\
     -H "Content-Type: application/json" \\
     -d '{
       "companyId": "test-company-id",
       "email": "test@example.com",
       "password": "Test@123456",
       "confirmPassword": "Test@123456",
       "name": "Test User",
       "phone": "1234567890",
       "role": "ACCOUNTANT"
     }'
   ```

3. **Create Test Company** (via Railway CLI or psql)
   ```bash
   railway run npx prisma studio
   # Then create a company via Prisma Studio UI
   ```

4. **Set up Custom Domain** (Optional)
   - In Railway Dashboard → Your Service → Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

## 🔧 Troubleshooting

### Issue: Build Fails

**Solution:** Make sure `package.json` has these scripts:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "build": "npx prisma generate",
    "dev": "nodemon src/server.js"
  }
}
```

### Issue: Database Connection Fails

**Solution:**
1. Make sure PostgreSQL plugin is added
2. `DATABASE_URL` is automatically set by Railway
3. Check if migrations ran: `railway logs`

### Issue: Port not found

**Solution:** Railway automatically sets `PORT` environment variable. Make sure your `server.js` uses:
```javascript
const PORT = process.env.PORT || 8003;
```

## 📊 Railway Configuration Files

Railway supports these optional config files:

### `railway.toml` (Create this in project root)
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npx prisma generate && npx prisma db push && node src/server.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### `nixpacks.toml` (Alternative)
```toml
[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npx prisma generate"]

[start]
cmd = "npx prisma db push && node src/server.js"
```

## 🌐 Expected URLs

After deployment, you'll have:

```
Railway URL: https://zirakbook-production.up.railway.app
API Health: https://zirakbook-production.up.railway.app/api/health
API Docs: https://zirakbook-production.up.railway.app/api
Auth: https://zirakbook-production.up.railway.app/api/v1/auth/*
Users: https://zirakbook-production.up.railway.app/api/v1/users/*
```

## ✅ Deployment Checklist

- [ ] Railway account created/logged in
- [ ] PostgreSQL database added
- [ ] Redis added (optional)
- [ ] All environment variables set
- [ ] Database migrations ran successfully
- [ ] Health endpoint responding
- [ ] Test user registration working
- [ ] Test user login working
- [ ] JWT tokens working
- [ ] Protected endpoints requiring auth
- [ ] Custom domain configured (optional)

## 📞 Support

**GitHub Repo:** https://github.com/maanisingh/zirakbook-accounting-backend
**Railway Dashboard:** https://railway.app/dashboard
**Current Production:** https://zirakbook.alexandratechlab.com

---

**Status:** Ready for Railway deployment 🚀
