# 🔍 Railway Backend - Debug Steps

## Current Issue
Deployment shows as "completed" but backend returns 404

---

## 🎯 Step-by-Step Debug

### 1. Check Service is Actually Running

In Railway Dashboard → Backend Service:

**Look for these indicators:**
- Green circle/checkmark = Running ✅
- Red circle = Crashed ❌
- Yellow/building icon = Building ⏳

### 2. Check Deployment Logs

**Click:** Deployments tab → Latest deployment → View Logs

**Look for:**

**✅ Success Messages (Good):**
```
✓ Build completed successfully
✓ Starting deployment...
✓ Deployment successful
Server is running on port 8003
```

**❌ Error Messages (Need to fix):**
```
Error: Cannot find module 'express'
Error: DATABASE_URL is not defined
Error: listen EADDRINUSE: address already in use
Error: P1001: Can't reach database server
Application crashed
```

### 3. Check Service URL

In Railway Dashboard → Backend Service → Settings:

**Is there a domain/URL shown?**
- Should be: `backend-api-production-dd10.up.railway.app`

**If NO URL shown:**
- Click "Generate Domain" or "Add Domain"
- Railway will create public URL

### 4. Verify Root Directory

**Settings → Root Directory:**
- Should be: `backend`
- NOT empty
- NOT `/backend`
- Just: `backend`

### 5. Check Start Command

**Settings → Start Command:**

**Try one of these:**
```
node src/server.js
```

OR if you need database migration:
```
npx prisma db push && node src/server.js
```

### 6. Verify package.json Location

The file should be at: `backend/package.json`

**In your GitHub repo, verify:**
```
/backend/package.json  ✅ (correct)
/package.json          ❌ (wrong location for backend)
```

### 7. Check Environment Variable: PORT

**Variables tab:**
- Make sure `PORT` is NOT hardcoded
- Should be: `${{PORT}}` (Railway auto-assigns)
- OR just don't set it (Railway provides automatically)

---

## 🐛 Common Issues & Quick Fixes

### Issue 1: "Application not found"

**This means Railway can't find the service.**

**Fix:**
1. Check if service has a public domain
2. Settings → Networking → Generate Domain
3. Wait 1 minute, test again

### Issue 2: Build succeeds but service crashes

**Check logs for error messages.**

**Common causes:**
- Missing DATABASE_URL
- Wrong PORT configuration
- Missing dependencies
- Syntax errors in code

**Fix:**
1. Check environment variables
2. Verify all required vars are set
3. Check logs for specific error
4. Redeploy after fixing

### Issue 3: 502 Bad Gateway

**Service is starting but crashing.**

**Fix:**
1. Check logs for crash reason
2. Usually database connection issue
3. Verify DATABASE_URL is set correctly
4. Make sure Postgres service is running

### Issue 4: Build never completes

**Stuck on "Building..."**

**Fix:**
1. Check package.json exists
2. Verify dependencies install correctly
3. May need to cancel and redeploy

---

## 📋 Quick Checklist

Copy this and check in Railway:

**Settings:**
- [ ] Root Directory = `backend`
- [ ] Start Command = `node src/server.js`
- [ ] Public domain generated
- [ ] Service shows green/running

**Variables:**
- [ ] NODE_ENV = production
- [ ] DATABASE_URL = ${{Postgres.DATABASE_URL}}
- [ ] JWT_SECRET = (your secret)
- [ ] JWT_REFRESH_SECRET = (your secret)
- [ ] CORS_ORIGIN = (frontend URL)

**Deployment:**
- [ ] Latest deployment shows "Deployed"
- [ ] Logs show "Server running on port..."
- [ ] No error messages in logs
- [ ] Service status is green/running

---

## 🔄 If All Else Fails: Redeploy from Scratch

1. **Delete current backend service** (in Railway)
2. **Create new service:**
   - Click "New" → "GitHub Repo"
   - Select: maanisingh/Accounting-software
   - Root Directory: `backend`
   - Start Command: `node src/server.js`
3. **Add all environment variables** (copy from checklist above)
4. **Link to PostgreSQL database**
5. **Deploy**
6. **Wait 3-5 minutes**
7. **Test:** `curl https://[new-url]/api/health`

---

## 📞 What to Check RIGHT NOW

**Go to Railway Dashboard and answer these:**

1. **What color is the service indicator?**
   - Green = running
   - Red = crashed
   - Yellow = building

2. **What do the logs say?**
   - Click on service → View Logs
   - Share the last 10-20 lines

3. **Is there a public domain?**
   - Settings → Networking
   - Should show: backend-api-production-dd10.up.railway.app

4. **What's the deployment status?**
   - Deployments tab
   - Should say: "Deployed" (not "Building" or "Failed")

---

**Please share:**
- Service status (green/red/yellow)
- Last 10 lines of deployment logs
- Any error messages you see

Then I can help fix the specific issue!

