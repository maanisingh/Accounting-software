# 🗃️ Railway Database Setup - ZirakBook Backend

## 🚨 Issue: DATABASE_URL Missing

Your backend is failing with:
```
Error: Environment variable not found: DATABASE_URL
```

This is because the backend needs a PostgreSQL database connection string.

---

## ✅ Solution: Add PostgreSQL Database to Railway

### Step 1: Add PostgreSQL Database

1. Go to your Railway project: https://railway.app/project/[your-project-id]
2. Click **"+ New"** button (top right)
3. Select **"Database"**
4. Choose **"Add PostgreSQL"**
5. Railway will create and provision the database

### Step 2: Connect Database to Backend

Railway automatically creates these environment variables in the PostgreSQL service:
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`
- `DATABASE_URL` (full connection string)

You need to **reference** the database variables in your backend service:

1. Go to your **Backend API** service (Accounting-software)
2. Click **"Variables"** tab
3. Click **"+ New Variable"**
4. Click **"Add Reference"**
5. Select **PostgreSQL** service
6. Select **DATABASE_URL** variable
7. Click **"Add"**

This will automatically inject the database URL into your backend!

### Step 3: Add Other Required Variables

While in the Variables tab, add these:

| Variable Name | Value |
|--------------|-------|
| `DATABASE_URL` | Reference from PostgreSQL service |
| `JWT_SECRET` | Generate with: `openssl rand -base64 32` |
| `JWT_EXPIRY` | `7d` |
| `NODE_ENV` | `production` |
| `PORT` | `8020` |

### Step 4: Redeploy

After adding variables:
1. Click **"Deploy"** tab
2. Click **"Redeploy"** (or it will auto-deploy)
3. Watch the logs - should succeed now!

---

## 🎯 Quick Setup Commands

### Generate JWT Secret:

```bash
openssl rand -base64 32
```

Copy the output and use it as `JWT_SECRET` value.

---

## 📸 Visual Guide

### Adding PostgreSQL Database:

```
Railway Dashboard
┌─────────────────────────────────────┐
│ Your Project                        │
│                                     │
│ ┌─────────────┐  ┌──────────────┐ │
│ │ Backend API │  │   + New      │ │ ← Click here
│ │ (crashed)   │  │              │ │
│ └─────────────┘  └──────────────┘ │
│                                     │
│ Select: Database → PostgreSQL       │
└─────────────────────────────────────┘
```

### Referencing Database URL:

```
Backend API → Variables Tab
┌─────────────────────────────────────┐
│ + New Variable                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Variable Name: DATABASE_URL     │ │
│ │                                 │ │
│ │ ○ Raw Value                     │ │
│ │ ● Reference from Service        │ │ ← Select this
│ │                                 │ │
│ │ Service: PostgreSQL            │ │
│ │ Variable: DATABASE_URL         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Add Variable]                      │
└─────────────────────────────────────┘
```

---

## 🔧 Alternative: Use External Database

If you prefer to use an external database (like Neon, Supabase, etc.):

1. Get your database connection string
2. Format: `postgresql://user:password@host:port/database?sslmode=require`
3. Add to Railway as raw value:
   - Variable name: `DATABASE_URL`
   - Value: [your connection string]

---

## ✅ Verification

After setup, your backend logs should show:

```
✅ Prisma schema loaded from prisma/schema.prisma
✅ Datasource "db": PostgreSQL database
✅ Database migrations ran successfully
✅ Server starting on port 8020...
```

Instead of:

```
❌ Error: Environment variable not found: DATABASE_URL
```

---

## 🚨 Important Notes

1. **Never commit DATABASE_URL** to git
   - It's already in `.gitignore`
   - Always use Railway environment variables

2. **Migrations run automatically**
   - On every deployment via `nixpacks.toml`
   - Command: `npx prisma migrate deploy`

3. **Database persistence**
   - Railway PostgreSQL includes persistent storage
   - Data survives redeploys
   - Take backups regularly!

---

## 🐛 Troubleshooting

### Still seeing DATABASE_URL error?

1. **Check variable is set:**
   - Backend service → Variables tab
   - Look for `DATABASE_URL`
   - Should show: "Reference from PostgreSQL"

2. **Redeploy manually:**
   - Deploy tab → Click "Redeploy"

3. **Check database is running:**
   - PostgreSQL service should show "Active"
   - Not "Crashed" or "Deploying"

### Connection refused errors?

- Make sure DATABASE_URL includes `?sslmode=require` for external DBs
- Check firewall settings if using external database

### Migration errors?

```bash
# Reset migrations (CAUTION: Deletes data!)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name init
```

---

## 📚 Related Documentation

- [Railway Databases](https://docs.railway.app/databases/postgresql)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Environment Variables](https://docs.railway.app/develop/variables)

---

**Last Updated:** November 21, 2025
