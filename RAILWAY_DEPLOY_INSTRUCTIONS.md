# ZirakBook - Railway Deployment Instructions

## ✅ Current Status

**GitHub Repository:** https://github.com/maanisingh/zirakbook-accounting-backend

**Railway Project:** Already created!
- Project ID: `0836917a-c662-433c-9224-26815edee4e4`
- Project Name: **ZirakBook Accounting**

**Existing Services:**
1. ✅ PostgreSQL Database
2. ✅ Backend API (needs GitHub connection)
3. ✅ Frontend (needs setup)

## 🚀 Quick Deploy Steps (Railway Dashboard)

### Step 1: Access Your Project
1. Go to: https://railway.app/project/0836917a-c662-433c-9224-26815edee4e4
2. You'll see your "ZirakBook Accounting" project

### Step 2: Connect Backend API to GitHub

1. **Click on "Backend API" service**
2. **Go to Settings tab**
3. **Under "Source" section:**
   - Click "Connect Repo"
   - Select: `maanisingh/zirakbook-accounting-backend`
   - Branch: `main`
   - Root Directory: leave empty (or enter `/` if required)
4. **Click "Connect"**

Railway will automatically:
- Detect it's a Node.js project
- Install dependencies
- Run `npx prisma generate` (from railway.toml)
- Start the server

### Step 3: Configure Environment Variables

Click on "Backend API" → "Variables" tab and add:

```env
# Core Settings
NODE_ENV=production
PORT=${{PORT}}
API_VERSION=v1

# Database (automatically provided by Railway)
DATABASE_URL=${{PostgreSQL Database.DATABASE_URL}}

# JWT Secrets (IMPORTANT: Change these!)
JWT_SECRET=zirakbook_production_jwt_secret_2024_change_this_to_something_very_secure
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=zirakbook_production_refresh_secret_2024_also_change_this_value
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=*

# Redis (Optional - add if you add Redis service)
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
REDIS_DB=0

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_ATTEMPTS=5
```

### Step 4: Deploy!

After connecting the repo and setting variables:
1. Railway will automatically trigger a deployment
2. Watch the build logs in real-time
3. Once complete, you'll get a public URL like:
   `https://zirakbook-backend-production.up.railway.app`

### Step 5: Run Database Migrations

After first deployment:
1. Go to "Backend API" service
2. Click "Settings" → "Deploy"
3. Update the **Start Command** to:
   ```
   npx prisma db push && node src/server.js
   ```
4. Or run manually via Railway CLI (if you get it working):
   ```bash
   railway run npx prisma db push
   ```

### Step 6: Test the Deployment

```bash
# Health check
curl https://your-railway-url.up.railway.app/api/health

# API info
curl https://your-railway-url.up.railway.app/api

# Register a user
curl -X POST https://your-railway-url.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
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

## 🎨 Frontend Deployment (Next)

Once backend is working:

### Option 1: Add Frontend to Same Project

1. **Create a new React/Vite frontend** in a separate repo
2. **In Railway Dashboard:**
   - Go to your project
   - Click "+ New" → "GitHub Repo"
   - Select your frontend repo
3. **Configure environment variables:**
   ```env
   VITE_API_URL=${{Backend API.RAILWAY_PUBLIC_DOMAIN}}
   ```
4. **Deploy!**

### Option 2: Use Existing Frontend Service

1. Click on "Frontend" service in your project
2. Connect it to your frontend GitHub repo
3. Configure build settings
4. Deploy

## 🔧 Troubleshooting

### Build Fails
**Check:** Make sure `package.json` has:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "build": "npx prisma generate"
  }
}
```

### Database Connection Error
**Solution:**
- Railway automatically provides `DATABASE_URL`
- Use: `${{PostgreSQL Database.DATABASE_URL}}` in variables
- Make sure PostgreSQL service is running

### Port Issues
**Solution:**
- Railway sets `PORT` automatically
- Use: `process.env.PORT` in your code
- Don't hardcode port numbers

### Migrations Not Running
**Solution:**
1. Go to service Settings → Deploy
2. Set Start Command: `npx prisma db push && node src/server.js`
3. Or use Build Command: `npx prisma generate && npx prisma db push`

## 📊 Railway Dashboard Quick Access

| What | Where |
|------|-------|
| **Project Dashboard** | https://railway.app/project/0836917a-c662-433c-9224-26815edee4e4 |
| **Backend Logs** | Project → Backend API → Deployments → Latest |
| **Environment Variables** | Backend API → Variables |
| **Database Console** | PostgreSQL Database → Data |
| **Custom Domain** | Backend API → Settings → Domains |

## 🎯 What to Expect

After successful deployment:

✅ **Backend API**
- URL: `https://[your-service].up.railway.app`
- Health: `https://[your-service].up.railway.app/api/health`
- Endpoints: All 19 auth endpoints working
- Database: PostgreSQL connected
- Auto-redeploy: On every GitHub push

✅ **Automatic Features**
- SSL certificate (Railway provides)
- Auto-scaling
- Zero-downtime deployments
- Build logs
- Monitoring

## 🔐 Security Notes

1. **Change JWT Secrets** - Don't use the default values!
2. **Update CORS_ORIGIN** - Set to your frontend domain in production
3. **Database Backups** - Railway provides automatic backups
4. **Environment Variables** - Never commit secrets to Git

## 📞 Support

- **Railway Docs:** https://docs.railway.com
- **GitHub Repo:** https://github.com/maanisingh/zirakbook-accounting-backend
- **Current Production:** https://zirakbook.alexandratechlab.com

---

## Alternative: Deploy via CLI (If Token Works)

If you can authenticate the CLI:

```bash
# Set token
export RAILWAY_TOKEN=d3ebdd3f-d6c6-4f82-b7c4-fa22611380b8

# Navigate to project
cd /root/zirabook-accounting-full/backend

# Deploy
railway up

# Check status
railway status

# View logs
railway logs
```

---

**Status:** Ready for deployment via Railway Dashboard 🚀
**Estimated Time:** 5-10 minutes for full deployment
