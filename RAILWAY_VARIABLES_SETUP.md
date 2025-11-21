# 🚀 Railway Environment Variables - Quick Setup

**Status:** PostgreSQL ✅ Connected | JWT_SECRET ❌ Missing

---

## ⚡ 2-Minute Fix

You need to add **4 environment variables** to your Railway backend service.

---

## 📋 Step-by-Step Guide

### Step 1: Open Variables Tab

```
Railway Dashboard
└── Your ZirakBook Project
    └── "Accounting-software" service (click on it)
        └── Variables tab (click on it)
```

### Step 2: Add These 4 Variables

For **each variable** below:
1. Click **[+ New Variable]**
2. Enter the **Variable Name**
3. Enter the **Value** (copy exactly from below)
4. Click **Add**

---

## 📝 Variables to Add

### 1. JWT_SECRET
```
Name:  JWT_SECRET
Value: xEIEYT16k92X5j/cVVG0ZlyujIZI8UCoVKcAHOOja3A=
```
**Purpose:** Secret key for JWT token generation (authentication)

---

### 2. JWT_EXPIRY
```
Name:  JWT_EXPIRY
Value: 7d
```
**Purpose:** JWT token expiration time (7 days)

---

### 3. NODE_ENV
```
Name:  NODE_ENV
Value: production
```
**Purpose:** Node.js environment mode

---

### 4. PORT
```
Name:  PORT
Value: 8020
```
**Purpose:** Port for the Express server

---

## ✅ Verification Checklist

After adding all 4 variables, your Variables tab should show:

- [x] `DATABASE_URL` (Referenced from PostgreSQL) ✅ Already added
- [ ] `JWT_SECRET` = xEIEYT16k92X5j/cVVG0ZlyujIZI8UCoVKcAHOOja3A=
- [ ] `JWT_EXPIRY` = 7d
- [ ] `NODE_ENV` = production
- [ ] `PORT` = 8020

**Total: 5 variables**

---

## 🔄 Step 3: Redeploy

After adding all variables:

1. Click **"Deployments"** tab
2. Click **"Redeploy"** button
3. Wait ~2 minutes
4. Check deploy logs

---

## ✅ Success Indicators

### In Deploy Logs you should see:

```
✅ Starting ZirakBook Backend...
✅ DATABASE_URL is set
✅ Running database migrations...
✅ Database migrations completed
✅ Starting Express server...
✅ Server listening on port 8020
```

### In Railway Dashboard:

```
Backend Service Status: Active (green circle)
```

---

## 🚨 If You Still See Errors

### Error: "JWT_SECRET is not defined"
- Double-check JWT_SECRET value was copied exactly
- Make sure there are no extra spaces
- Redeploy after adding the variable

### Error: "Port already in use"
- Normal - Railway handles this automatically
- Just wait for deployment to complete

### Database connection errors
- Should not happen since DATABASE_URL is working
- If it does, check PostgreSQL service is Active

---

## 📸 Visual Reference

```
Railway Variables Tab
┌──────────────────────────────────────────────────────────┐
│  Environment Variables                 [+ New Variable]  │
├──────────────────────────────────────────────────────────┤
│  DATABASE_URL                                            │
│  Referenced from PostgreSQL                              │
│                                                          │
│  JWT_SECRET                                              │
│  xEIEYT16k92X5j/cVVG0ZlyujIZI8UCoVKcAHOOja3A=          │
│                                                          │
│  JWT_EXPIRY                                              │
│  7d                                                      │
│                                                          │
│  NODE_ENV                                                │
│  production                                              │
│                                                          │
│  PORT                                                    │
│  8020                                                    │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Why These Variables Are Needed

| Variable | Used For | Impact if Missing |
|----------|----------|-------------------|
| `DATABASE_URL` | PostgreSQL connection | ✅ Already added - app crashes without it |
| `JWT_SECRET` | Token signing/verification | ❌ Current error - authentication fails |
| `JWT_EXPIRY` | Token lifetime | Default fallback exists but should be set |
| `NODE_ENV` | Environment mode | Affects logging, error handling |
| `PORT` | Server port | Railway auto-assigns but good to set |

---

## 📦 Complete Environment

After this setup, your backend will have:

✅ **Database Connection:** PostgreSQL via DATABASE_URL
✅ **Authentication:** JWT with secure secret
✅ **Production Mode:** Optimized for production
✅ **Proper Port:** Configured for Railway

---

## ⏱️ Time Estimate

- Adding 4 variables: **1-2 minutes**
- Redeployment: **2-3 minutes**
- **Total: ~5 minutes**

---

## 🔗 Quick Links

- Railway Dashboard: https://railway.app
- Your Project: Check Railway for project link
- Documentation: See backend/RAILWAY_DATABASE_SETUP.md

---

**Ready?** Go add those 4 variables and redeploy! 🚀

Your deployment will succeed after this!
