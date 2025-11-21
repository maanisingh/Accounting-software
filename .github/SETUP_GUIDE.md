# 🚀 GitHub Actions Setup Guide - ZirakBook Accounting

This guide will help you set up the automated CI/CD pipeline for ZirakBook Accounting.

## ✅ Prerequisites

- [x] GitHub repository created
- [x] Railway account set up
- [x] Backend and Frontend services created on Railway

---

## 📝 Step 1: Configure GitHub Secrets

### Get Your Railway Token

1. Go to [Railway Dashboard](https://railway.app)
2. Click your profile → **Account Settings**
3. Navigate to **Tokens** tab
4. Click **Create Token**
5. Name it: `GitHub Actions - ZirakBook`
6. Copy the token (save it somewhere safe - you'll only see it once!)

### Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these secrets:

| Secret Name | Value | Where to Get It |
|------------|-------|-----------------|
| `RAILWAY_TOKEN` | `your-railway-token-here` | Railway Dashboard → Account → Tokens |
| `DATABASE_URL` | `postgresql://...` | Railway → Database Service → Connect → Connection String |

### Screenshot Reference:
```
GitHub → Settings → Secrets and variables → Actions → New repository secret
┌─────────────────────────────────────┐
│ Name: RAILWAY_TOKEN                 │
│ Secret: ••••••••••••••••••••        │
│                                     │
│ [Add secret]                        │
└─────────────────────────────────────┘
```

---

## 🔧 Step 2: Verify Railway Configuration

### Backend Service Configuration

In Railway Dashboard:

1. Select your **Backend API** service
2. Go to **Settings**
3. Verify these environment variables exist:

```env
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=your-jwt-secret-here
NODE_ENV=production
PORT=8020
```

4. In **Deploy** section:
   - ✅ Auto-deploy: **Enabled**
   - ✅ Branch: `main`
   - ✅ Source: GitHub

### Frontend Service Configuration

1. Select your **Frontend** service
2. Verify environment variables:

```env
NODE_ENV=production
VITE_API_URL=https://your-backend-url.railway.app
```

3. Deploy settings:
   - ✅ Auto-deploy: **Enabled**
   - ✅ Branch: `main`

---

## 🎯 Step 3: Test the Pipeline

### Test Automatic Deployment

1. Make a small change to your code:
   ```bash
   cd backend
   echo "# Test CI/CD" >> README.md
   git add .
   git commit -m "test: Verify CI/CD pipeline"
   git push origin main
   ```

2. Watch the magic happen:
   - Go to GitHub → **Actions** tab
   - You should see workflows running:
     - ✅ Backend CI/CD Pipeline
     - ✅ PR Quality Checks
     - ✅ Frontend CI/CD Pipeline

3. Check Railway:
   - New deployment should start automatically
   - Monitor build logs for any issues

### Test Pull Request Workflow

1. Create a new branch:
   ```bash
   git checkout -b test-pr
   echo "# Test PR" >> README.md
   git add .
   git commit -m "test: PR quality checks"
   git push origin test-pr
   ```

2. Create a Pull Request on GitHub

3. Watch quality checks run automatically:
   - ✅ Backend Quality Gate
   - ✅ Frontend Quality Gate
   - ✅ Bundle Size Check
   - ✅ Security Audit

---

## 🏥 Step 4: Test Deployment Doctor (Auto-Heal)

The Deployment Doctor automatically fixes common deployment issues!

### Manual Test:

1. Go to GitHub → **Actions**
2. Select **Deployment Doctor** workflow
3. Click **Run workflow**
4. Select branch: `main`
5. Click **Run workflow**

### What It Does:

- ✅ Checks for missing `nixpacks.toml`
- ✅ Fixes `railway.toml` conflicts
- ✅ Creates missing configuration files
- ✅ Updates package.json scripts
- ✅ Auto-commits fixes
- ✅ Triggers redeployment

---

## 🤖 Step 5: Enable Auto-Fix (Optional)

The Auto-Fix workflow runs weekly to keep dependencies updated.

### It automatically:
- Updates dependencies (patch versions)
- Fixes security vulnerabilities
- Formats code
- Regenerates Prisma client
- Commits and pushes changes

### Enable it:

Already enabled! It runs:
- ✅ Every Monday at 9 AM UTC
- ✅ On every push to main
- ✅ Manually via workflow dispatch

---

## 📊 Step 6: Add Status Badges (Optional)

Add these to your `README.md`:

```markdown
## Build Status

[![Backend CI/CD](https://github.com/maanisingh/Accounting-software/actions/workflows/backend-deploy.yml/badge.svg)](https://github.com/maanisingh/Accounting-software/actions/workflows/backend-deploy.yml)

[![Frontend CI/CD](https://github.com/maanisingh/Accounting-software/actions/workflows/frontend-deploy.yml/badge.svg)](https://github.com/maanisingh/Accounting-software/actions/workflows/frontend-deploy.yml)

[![PR Quality Checks](https://github.com/maanisingh/Accounting-software/actions/workflows/pr-quality-check.yml/badge.svg)](https://github.com/maanisingh/Accounting-software/actions/workflows/pr-quality-check.yml)
```

---

## ✅ Verification Checklist

- [ ] Railway token added to GitHub Secrets
- [ ] Database URL added to GitHub Secrets
- [ ] Railway auto-deploy enabled for main branch
- [ ] Test push triggers deployment
- [ ] Test PR triggers quality checks
- [ ] Deployment Doctor workflow works
- [ ] Status badges added to README (optional)

---

## 🎉 You're Done!

Your repository now has:

✅ **Automatic deployments** on every push to main
✅ **Quality checks** on every pull request
✅ **Self-healing** deployment via Deployment Doctor
✅ **Auto-updates** for dependencies weekly
✅ **Auto-merge** for safe dependency updates

### What Happens Now:

1. **Push to main** → Automatic deployment to Railway
2. **Create PR** → Quality checks run automatically
3. **Deployment fails** → Deployment Doctor auto-fixes
4. **Dependencies outdated** → Dependabot creates PRs
5. **Security issues** → Auto-fix applies patches

**Zero-touch deployments with automatic recovery!** 🎊

---

## 🐛 Troubleshooting

### Railway Token Not Working:
```bash
# Verify token format (should be long alphanumeric string)
# Re-generate token in Railway if needed
# Update GitHub secret with new token
```

### Workflows Not Running:
```bash
# Check GitHub Actions is enabled:
# Settings → Actions → General → Allow all actions
```

### Deployment Doctor Not Fixing Issues:
```bash
# Check workflow permissions:
# Settings → Actions → General → Workflow permissions
# Select: Read and write permissions
```

### Dependabot PRs Not Auto-Merging:
```bash
# Ensure workflow permissions include:
# - pull-requests: write
# - contents: write
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Railway Documentation](https://docs.railway.app)
- [Workflow Files](./workflows/README.md)

---

**Need Help?** Create an issue in the repository!

**Last Updated:** November 21, 2025
