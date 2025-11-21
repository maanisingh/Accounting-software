# ✅ Ready to Deploy Zira to Railway!

## What Just Happened

Your code has been pushed to GitHub: **https://github.com/maanisingh/Accounting-software**

## 🚀 Deploy to Railway NOW (3 Easy Steps)

### Step 1: Go to Railway Dashboard
1. Open: **https://railway.app**
2. Sign in with your GitHub account (maanisingh)
3. Click **"New Project"**

### Step 2: Deploy Backend
1. Click **"Deploy from GitHub repo"**
2. Select: **maanisingh/Accounting-software**
3. Railway will detect your project

#### Configure Backend Service:
- Click **"Add variables"** and set:
  ```
  ROOT_PATH = backend
  ```

- Then add these environment variables:
  ```env
  NODE_ENV=production
  PORT=${{PORT}}
  JWT_SECRET=change_this_to_something_very_secure_12345
  JWT_EXPIRES_IN=15m
  JWT_REFRESH_SECRET=change_this_also_to_something_secure_67890
  JWT_REFRESH_EXPIRES_IN=7d
  BCRYPT_ROUNDS=12
  CORS_ORIGIN=*
  ```

#### Add Database:
1. Click **"+ New"** in your project
2. Select **"Database"** → **"Add PostgreSQL"**
3. Go back to Backend service → **Variables**
4. Add: `DATABASE_URL=${{Postgres.DATABASE_URL}}`

#### Update Build Settings:
- Go to Backend **Settings** → **Deploy**
- **Start Command**: `npx prisma db push && node src/server.js`

Click **"Deploy"** and wait ~3-5 minutes

### Step 3: Deploy Frontend
1. In same project, click **"+ New"** → **"GitHub Repo"**
2. Select **maanisingh/Accounting-software** again
3. Configure:
   - **Root Directory**: `/` (leave empty)
   - **Build Command**: `npm run build`
   - **Start Command**: `node server.js`

4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.up.railway.app
   ```
   (You'll get the backend URL after step 2 deploys)

Click **"Deploy"**

---

## 🎯 After Deployment

### Get Your URLs:
1. **Backend**: Click backend service → Settings → Generate Domain
2. **Frontend**: Click frontend service → Settings → Generate Domain

### Update CORS:
Go to Backend → Variables → Update:
```
CORS_ORIGIN=https://your-frontend-url.up.railway.app
```

### Test It:
```bash
# Test backend
curl https://your-backend-url.up.railway.app/api/health

# Test registration
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

Open your frontend URL and log in!

---

## 📊 What You Get

✅ Backend API (Express + Prisma + PostgreSQL)
✅ Frontend App (React + Vite + TypeScript)
✅ PostgreSQL Database
✅ Auto-deploy on every git push
✅ HTTPS certificates (automatic)
✅ Zero-downtime deployments
✅ Build logs & monitoring

---

## 🔧 If You Get Stuck

### Backend won't start?
- Check logs: Click on deployment → View Logs
- Common issue: Make sure `DATABASE_URL` is set

### Frontend won't build?
- Add: `NODE_OPTIONS=--max-old-space-size=4096`
- Check that `VITE_API_URL` points to backend

### Database tables missing?
- Backend logs should show `npx prisma db push` running
- If not, manually run in Railway terminal

---

## 🎉 That's It!

Your ZirakBook accounting software will be live at:
- **Backend**: `https://zirakbook-backend-xxxxx.up.railway.app`
- **Frontend**: `https://zirakbook-frontend-xxxxx.up.railway.app`

**Estimated deployment time**: 10-15 minutes total

---

**Need help?** Check Railway docs: https://docs.railway.app
