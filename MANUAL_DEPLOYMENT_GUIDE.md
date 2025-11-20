# ZirakBook Full Stack - Manual Deployment Guide

## ✅ What You Have

1. **Backend Code** - ✅ Ready on GitHub
   - Repo: https://github.com/maanisingh/zirakbook-accounting-backend
   - 19 API endpoints working
   - Quality score: 92.75%
   - Currently running on: https://zirakbook.alexandratechlab.com

2. **Railway Project** - ✅ Already exists
   - Project URL: https://railway.app/project/0836917a-c662-433c-9224-26815edee4e4
   - PostgreSQL Database ✅ provisioned
   - Backend API service created
   - Frontend service created

## 🚀 Manual Deployment Steps

### PART 1: Deploy Backend to Railway

#### Step 1: Access Railway Dashboard
```
Go to: https://railway.app/project/0836917a-c662-433c-9224-26815edee4e4
```

#### Step 2: Connect Backend API Service

1. **Click on "Backend API" card**
2. **Go to "Settings" tab**
3. **Under "Source" section:**
   - Click "Connect Repo" button
   - Authorize GitHub if needed
   - Select repository: `maanisingh/zirakbook-accounting-backend`
   - Branch: `main`
   - Root Directory: `/` (leave empty)
4. **Click "Deploy"**

Railway will automatically detect Node.js and start building.

#### Step 3: Add Environment Variables

While it's building, click on "Variables" tab and add these one by one:

```env
NODE_ENV=production
PORT=8000
API_VERSION=v1

# Database - Use this exact format
DATABASE_URL=${{PostgreSQL Database.DATABASE_URL}}

# JWT Secrets - IMPORTANT: Generate new ones for production!
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long_abc123
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_also_32_characters_minimum_xyz789
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_ATTEMPTS=5
```

**How to add variables:**
- Click "+ New Variable"
- Enter "Variable Name" (e.g., NODE_ENV)
- Enter "Value" (e.g., production)
- Click "Add"
- Repeat for all variables

#### Step 4: Configure Build & Start Commands

1. **Go to "Settings" tab**
2. **Under "Deploy" section:**
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npx prisma db push && node src/server.js`
3. **Click "Save"**

#### Step 5: Wait for Deployment

Watch the "Deployments" tab for:
- ✅ Build started
- ✅ Installing dependencies
- ✅ Running Prisma generate
- ✅ Starting server
- ✅ Deployment live

This takes 2-5 minutes.

#### Step 6: Get Your Backend URL

1. Go to "Settings" tab
2. Under "Domains" section
3. Copy the Railway-provided URL (looks like: `https://backend-production-abc123.up.railway.app`)
4. Or click "Generate Domain" if none exists

#### Step 7: Test Backend

```bash
# Replace with your actual URL
BACKEND_URL="https://your-backend-url.up.railway.app"

# Health check
curl $BACKEND_URL/api/health

# API info
curl $BACKEND_URL/api

# Expected response:
# {"success":true,"message":"ZirakBook API is running","timestamp":"..."}
```

---

### PART 2: Create Frontend (React + Vite)

Since you need a frontend, let's create one:

#### Step 1: Create Frontend Locally

```bash
cd /root/zirabook-accounting-full

# Create React app with Vite
npm create vite@latest frontend -- --template react-ts

cd frontend
npm install

# Install additional dependencies
npm install axios react-router-dom @tanstack/react-query zustand
npm install -D @types/node tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p
```

#### Step 2: Create Basic Frontend Structure

**File: `src/config/api.ts`**
```typescript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8020';

export const api = {
  auth: {
    login: `${API_URL}/api/v1/auth/login`,
    register: `${API_URL}/api/v1/auth/register`,
    me: `${API_URL}/api/v1/auth/me`,
    logout: `${API_URL}/api/v1/auth/logout`,
  },
  users: {
    list: `${API_URL}/api/v1/users`,
  }
};
```

**File: `src/pages/Login.tsx`**
```typescript
import { useState } from 'react';
import axios from 'axios';
import { api } from '../config/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(api.auth.login, { email, password });
      localStorage.setItem('token', response.data.data.tokens.accessToken);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">ZirakBook Login</h1>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
```

#### Step 3: Push Frontend to GitHub

```bash
cd /root/zirabook-accounting-full/frontend

git init
git add .
git commit -m "Initial ZirakBook frontend"
git remote add origin https://github.com/maanisingh/zirakbook-accounting-frontend.git
git branch -M main
git push -u origin main
```

Create the repo on GitHub first:
```bash
gh repo create zirakbook-accounting-frontend --public --description "ZirakBook Accounting - React Frontend"
```

#### Step 4: Deploy Frontend to Railway

1. **Go back to Railway project**
2. **Click on "Frontend" service**
3. **Connect to GitHub:**
   - Select: `maanisingh/zirakbook-accounting-frontend`
   - Branch: `main`
4. **Add Environment Variable:**
   ```
   VITE_API_URL=${{Backend API.RAILWAY_PUBLIC_DOMAIN}}
   ```
5. **Deploy!**

---

### PART 3: Alternative - Deploy Frontend to Netlify (Easier)

If Railway frontend is complex, use Netlify:

#### Step 1: Build Frontend
```bash
cd /root/zirabook-accounting-full/frontend
npm run build
```

#### Step 2: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist --site zirakbook-accounting

# Follow prompts to create new site
```

Or use Netlify Dashboard:
1. Go to: https://app.netlify.com
2. Click "Add new site" → "Import existing project"
3. Connect GitHub repo: `maanisingh/zirakbook-accounting-frontend`
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Environment variable: `VITE_API_URL=https://your-backend-url.up.railway.app`
7. Deploy!

---

## 🎯 Quick Deploy Option (Use Current Backend)

If you want to deploy just the frontend to an existing backend:

### Option 1: Use alexandratechlab.com Backend

Your backend is already running at:
```
https://zirakbook.alexandratechlab.com
```

Just create frontend with:
```
VITE_API_URL=https://zirakbook.alexandratechlab.com
```

### Option 2: Keep Both

- Backend: https://zirakbook.alexandratechlab.com (current)
- Backend: https://zirakbook-railway.up.railway.app (new Railway)
- Frontend: Deploy anywhere and point to either backend

---

## 📋 Deployment Checklist

### Backend (Railway)
- [ ] Service connected to GitHub repo
- [ ] All environment variables added
- [ ] Build command configured
- [ ] Start command configured
- [ ] Deployment successful
- [ ] Health endpoint responding
- [ ] Database migrations completed
- [ ] Public URL obtained

### Frontend
- [ ] Frontend code created
- [ ] GitHub repo created and pushed
- [ ] Railway/Netlify deployment configured
- [ ] Environment variables set (VITE_API_URL)
- [ ] Build successful
- [ ] Login page works
- [ ] API calls working

---

## 🔧 Troubleshooting

### Backend Won't Deploy
1. Check build logs in Railway
2. Verify DATABASE_URL format: `${{PostgreSQL Database.DATABASE_URL}}`
3. Make sure package.json scripts exist
4. Check Prisma schema is valid

### Frontend Can't Connect to Backend
1. Verify CORS is enabled (CORS_ORIGIN=*)
2. Check VITE_API_URL is correct
3. Make sure backend is deployed and running
4. Test backend URL directly with curl

### Database Migrations Fail
1. Run manually: In Railway, click service → "Shell"
2. Execute: `npx prisma db push`
3. Or update start command to include migrations

---

## 🎉 Success Criteria

After deployment, you should be able to:

✅ Access backend API: `https://your-backend.up.railway.app/api/health`
✅ Access frontend: `https://your-frontend.netlify.app` or Railway URL
✅ Login to the application
✅ Create users
✅ Access dashboard
✅ All 19 API endpoints working

---

## 📞 Support

- **Backend Repo:** https://github.com/maanisingh/zirakbook-accounting-backend
- **Current Production:** https://zirakbook.alexandratechlab.com
- **Railway Project:** https://railway.app/project/0836917a-c662-433c-9224-26815edee4e4

---

**Ready to deploy! Follow the steps above and you'll have a full stack app running in 15-20 minutes.** 🚀
