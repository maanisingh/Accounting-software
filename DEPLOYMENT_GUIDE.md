# ZirakBook - Deployment Guide for alexandratechlab.com

## 🚀 Quick Deployment to alexandratechlab.com Subdomain

This guide walks through deploying ZirakBook backend to a subdomain like `zirakbook.alexandratechlab.com` or `accounting.alexandratechlab.com`.

---

## Prerequisites

- Root or sudo access to alexandratechlab.com server
- Node.js 18+ installed
- PostgreSQL 14+ installed
- PM2 installed globally (`npm install -g pm2`)
- Nginx installed
- Certbot installed (for SSL)

---

## Step 1: Choose Subdomain

Pick a subdomain for the API backend:
- `zirakbook.alexandratechlab.com`
- `accounting.alexandratechlab.com`
- `api.alexandratechlab.com/zirakbook`

For this guide, we'll use `zirakbook.alexandratechlab.com`.

---

## Step 2: Set Up DNS

Add an A record pointing to your server IP:

```
Type: A
Name: zirakbook
Value: YOUR_SERVER_IP
TTL: 3600
```

Wait for DNS propagation (5-30 minutes).

---

## Step 3: Deploy Backend Code

```bash
# Navigate to deployment directory
cd /var/www

# Clone the repository
git clone https://github.com/maanisingh/Accounting-software.git zirakbook
cd zirakbook/backend

# Install dependencies
npm install --production

# Set up environment variables
cat > .env << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=8020
API_VERSION=v1

# Database Configuration
DATABASE_URL="postgresql://accounting_user:YOUR_DB_PASSWORD@localhost:5432/zirakbook_prod"

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_min_32_chars
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_super_secure_refresh_token_secret_key
REFRESH_TOKEN_EXPIRY=7d

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# CORS Configuration
CORS_ORIGIN=https://zirakbook.alexandratechlab.com
EOF

# Set proper permissions
chmod 600 .env

# Run Prisma migrations
npx prisma generate
npx prisma migrate deploy

# Seed test data (optional, for first-time setup)
node seed_test_data.js
```

---

## Step 4: Set Up PostgreSQL Database

```bash
# Create production database
sudo -u postgres psql << 'EOF'
CREATE DATABASE zirakbook_prod;
CREATE USER accounting_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE zirakbook_prod TO accounting_user;
\c zirakbook_prod
GRANT ALL ON SCHEMA public TO accounting_user;
EOF
```

---

## Step 5: Configure PM2

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'zirakbook-api',
    script: 'src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8020
    },
    error_file: '/var/log/pm2/zirakbook-error.log',
    out_file: '/var/log/pm2/zirakbook-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M'
  }]
};
EOF

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# (Follow the command output instructions)

# Check status
pm2 status
pm2 logs zirakbook-api --lines 50
```

---

## Step 6: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/zirakbook

# Add this configuration:
```

```nginx
server {
    listen 80;
    server_name zirakbook.alexandratechlab.com;

    # Redirect HTTP to HTTPS (will be configured in next step)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zirakbook.alexandratechlab.com;

    # SSL certificates (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/zirakbook.alexandratechlab.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/zirakbook.alexandratechlab.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/zirakbook-access.log;
    error_log /var/log/nginx/zirakbook-error.log;

    # Proxy settings
    location / {
        proxy_pass http://localhost:8020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:8020/api/health;
        access_log off;
    }

    # API documentation (if you add Swagger later)
    location /api/docs {
        proxy_pass http://localhost:8020/api/docs;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/zirakbook /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## Step 7: Set Up SSL with Certbot

```bash
# Install Certbot (if not already installed)
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d zirakbook.alexandratechlab.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect option (2) to force HTTPS

# Certbot will automatically update Nginx configuration

# Verify certificate auto-renewal
sudo certbot renew --dry-run

# Check Nginx configuration
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 8: Verify Deployment

### Test Backend Health
```bash
curl https://zirakbook.alexandratechlab.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "ZirakBook API is running",
  "timestamp": "2025-11-21T09:30:00.000Z",
  "environment": "production"
}
```

### Test Authentication
```bash
# Login
curl -X POST https://zirakbook.alexandratechlab.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123"
  }'
```

### Check PM2 Status
```bash
pm2 status
pm2 logs zirakbook-api --lines 20
```

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/zirakbook-access.log
sudo tail -f /var/log/nginx/zirakbook-error.log
```

---

## Step 9: Set Up Monitoring & Backups

### PM2 Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Database Backups
```bash
# Create backup script
sudo nano /usr/local/bin/backup-zirakbook-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/zirakbook"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD=YOUR_DB_PASSWORD pg_dump -U accounting_user -h localhost zirakbook_prod | gzip > $BACKUP_DIR/zirakbook_$TIMESTAMP.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "zirakbook_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/zirakbook_$TIMESTAMP.sql.gz"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-zirakbook-db.sh

# Set up daily cron job
sudo crontab -e
# Add this line:
0 2 * * * /usr/local/bin/backup-zirakbook-db.sh >> /var/log/zirakbook-backup.log 2>&1
```

---

## Step 10: Testing with Hoppscotch

1. Open Hoppscotch (https://hoppscotch.io)

2. Import the collection:
   - File: `backend/ZirakBook_Hoppscotch_Collection.json`

3. Update base URL in all requests:
   - Change `http://localhost:8020` to `https://zirakbook.alexandratechlab.com`

4. Follow the testing guide:
   - See `backend/HOPPSCOTCH_SETUP_GUIDE.md`

---

## Troubleshooting

### Backend Not Starting
```bash
# Check PM2 logs
pm2 logs zirakbook-api --err --lines 50

# Check if port is in use
sudo netstat -tlnp | grep 8020

# Restart PM2
pm2 restart zirakbook-api
```

### Database Connection Errors
```bash
# Test database connection
PGPASSWORD=YOUR_PASSWORD psql -U accounting_user -h localhost -d zirakbook_prod -c "SELECT 1;"

# Check Prisma connection
cd /var/www/zirakbook/backend
npx prisma db push
```

### Nginx 502 Bad Gateway
```bash
# Check if backend is running
curl http://localhost:8020/api/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/zirakbook-error.log

# Verify proxy settings
sudo nginx -t
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew manually if needed
sudo certbot renew --force-renewal -d zirakbook.alexandratechlab.com
```

---

## Useful Commands

### Update Code
```bash
cd /var/www/zirakbook/backend
git pull origin main
npm install --production
npx prisma generate
npx prisma migrate deploy
pm2 restart zirakbook-api
```

### View Logs
```bash
# PM2 logs
pm2 logs zirakbook-api
pm2 logs zirakbook-api --err
pm2 logs zirakbook-api --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/zirakbook-access.log
sudo tail -f /var/log/nginx/zirakbook-error.log

# Application logs
tail -f /var/log/pm2/zirakbook-out.log
tail -f /var/log/pm2/zirakbook-error.log
```

### Performance Monitoring
```bash
# PM2 monitoring
pm2 monit

# System resources
pm2 status
htop
```

---

## Security Checklist

- [ ] Strong database password set
- [ ] JWT secrets are long and random (min 32 chars)
- [ ] .env file permissions set to 600
- [ ] Firewall configured (UFW/iptables)
- [ ] SSH key-only authentication enabled
- [ ] Regular security updates applied
- [ ] Database backups automated
- [ ] SSL certificate auto-renewal tested
- [ ] PM2 logs rotated
- [ ] CORS properly configured

---

## Next Steps

1. **Frontend Deployment**
   - Deploy React/Next.js frontend to subdomain
   - Update API base URL to `https://zirakbook.alexandratechlab.com`

2. **Additional Configuration**
   - Set up email notifications (SMTP)
   - Configure Redis for caching
   - Add rate limiting
   - Set up monitoring (UptimeRobot, etc.)

3. **Documentation**
   - API documentation with Swagger
   - User guide for frontend
   - Admin manual

---

## Production URLs

Once deployed, your ZirakBook API will be available at:

- **API Base**: `https://zirakbook.alexandratechlab.com/api/v1`
- **Health Check**: `https://zirakbook.alexandratechlab.com/api/health`
- **API Docs**: `https://zirakbook.alexandratechlab.com/api/docs` (when added)

---

## Support

For issues:
1. Check logs: `pm2 logs zirakbook-api`
2. Verify health: `curl https://zirakbook.alexandratechlab.com/api/health`
3. Review Nginx logs: `sudo tail -f /var/log/nginx/zirakbook-error.log`

---

*Deployment guide for ZirakBook Accounting System*
*Last updated: November 21, 2025*
