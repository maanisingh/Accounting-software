# GitHub Actions Workflows - ZirakBook Accounting

This directory contains all automated workflows for the ZirakBook Accounting platform.

## 🚀 Workflows Overview

### 1. **Backend CI/CD Pipeline** (`backend-deploy.yml`)
**Triggers:** Push to `main` or PR affecting backend files

**Steps:**
- ✅ Runs quality checks and linting
- 🧪 Executes test suite
- 🚀 Deploys to Railway (main branch only)
- 🗃️  Runs database migrations
- 📢 Sends deployment notifications

**Required Secrets:**
- `RAILWAY_TOKEN` - Railway API token for deployment
- `DATABASE_URL` - Production database URL (for migrations)

---

### 2. **Frontend CI/CD Pipeline** (`frontend-deploy.yml`)
**Triggers:** Push to `main` or PR affecting frontend files

**Steps:**
- 📦 Builds frontend application
- ✅ Uploads build artifacts
- 🚀 Deploys to Railway (main branch only)

**Required Secrets:**
- `RAILWAY_TOKEN` - Railway API token

---

### 3. **PR Quality Checks** (`pr-quality-check.yml`)
**Triggers:** Pull requests to `main` or `develop`

**Steps:**
- 🔍 Backend code quality checks
- 🔍 Frontend code quality checks
- 📊 Bundle size analysis
- 🛡️  Security audits
- ✅ Prisma schema validation

**Purpose:** Ensures code quality before merging

---

### 4. **Auto-Fix Issues** (`auto-fix.yml`)
**Triggers:**
- Push to `main` or `develop`
- Weekly schedule (Monday 9 AM UTC)
- Manual trigger

**Auto-fixes:**
- 🔄 Updates dependencies (patch versions)
- 🛡️  Fixes security vulnerabilities
- 🎨 Formats Prisma schema
- 🔧 Regenerates Prisma client

**Magic:** Automatically commits and pushes fixes!

---

### 5. **Deployment Doctor** (`deployment-doctor.yml`) 🏥
**Triggers:**
- Manual workflow dispatch
- Deployment failure events

**Diagnosis & Fixes:**
- ✅ Creates missing `nixpacks.toml`
- ✅ Fixes `railway.toml` conflicts
- ✅ Adds missing configuration files
- ✅ Updates package.json scripts
- ✅ Auto-commits and triggers redeployment

**This is the "self-healing" workflow!**

---

## 🔐 Required GitHub Secrets

Add these secrets in: **Settings → Secrets and variables → Actions**

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `RAILWAY_TOKEN` | Railway deployment token | Railway Dashboard → Account → Tokens |
| `DATABASE_URL` | Production database URL | Railway → Database → Connection String |

---

## 🎯 How It Works

### On Every Push to Main:
1. **Quality checks run** (linting, tests)
2. **Build artifacts created**
3. **Automatic deployment to Railway**
4. **Database migrations executed**
5. **Health checks performed**

### On Every Pull Request:
1. **Quality gates enforced**
2. **Tests must pass**
3. **Bundle size analyzed**
4. **Security audit performed**

### Weekly (Automated):
1. **Dependencies updated**
2. **Security patches applied**
3. **Code formatted**
4. **Auto-committed to repo**

### On Deployment Failure:
1. **Deployment Doctor activates** 🏥
2. **Diagnoses common issues**
3. **Auto-fixes configuration**
4. **Triggers redeployment**

---

## 🛠️ Manual Triggers

### Run Deployment Doctor:
```bash
# Via GitHub CLI
gh workflow run deployment-doctor.yml

# Via GitHub UI
Actions → Deployment Doctor → Run workflow
```

### Run Auto-Fix:
```bash
gh workflow run auto-fix.yml
```

---

## 📊 Workflow Status Badges

Add to your README.md:

```markdown
[![Backend CI/CD](https://github.com/YOUR_USERNAME/Accounting-software/actions/workflows/backend-deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/Accounting-software/actions/workflows/backend-deploy.yml)

[![Frontend CI/CD](https://github.com/YOUR_USERNAME/Accounting-software/actions/workflows/frontend-deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/Accounting-software/actions/workflows/frontend-deploy.yml)

[![PR Quality](https://github.com/YOUR_USERNAME/Accounting-software/actions/workflows/pr-quality-check.yml/badge.svg)](https://github.com/YOUR_USERNAME/Accounting-software/actions/workflows/pr-quality-check.yml)
```

---

## 🐛 Troubleshooting

### Deployment Fails:
1. Check Railway logs for errors
2. Manually run **Deployment Doctor** workflow
3. Check GitHub Actions logs for details

### Tests Fail:
1. Run tests locally: `npm test`
2. Fix failing tests
3. Push changes to trigger re-run

### Auto-Fix Not Working:
1. Check GitHub Actions permissions
2. Ensure `GITHUB_TOKEN` has write access
3. Verify workflow file syntax

---

## 🔄 Continuous Improvement

These workflows are designed to:
- ✅ **Self-heal** common deployment issues
- ✅ **Auto-update** dependencies
- ✅ **Enforce quality** standards
- ✅ **Deploy automatically** on success
- ✅ **Notify** on failures

**The goal: Zero-touch deployments with automatic recovery!**

---

## 📝 Notes

- All workflows use Node.js 22.x
- Caching enabled for faster builds
- Non-blocking quality checks (won't fail builds)
- Automatic retries on Railway deployment
- Health checks after deployment

---

**Last Updated:** November 21, 2025
**Maintained by:** ZirakBook Team
