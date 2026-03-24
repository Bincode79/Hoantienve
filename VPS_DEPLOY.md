# VPS Deployment Guide - AeroRefund (HoanTienVe365)

This guide provides step-by-step instructions for deploying the HoanTienVe365 application to a Linux VPS (Ubuntu/Debian) with high performance and security.

## 🚀 One-Click Deployment (Recommended)

The project includes an advanced auto-deployment script that handles everything:
- VPS initial setup (Node.js, Nginx, PM2, Firewall)
- Automated code transfer & building
- SSL (HTTPS) certificate setup
- Database migrations
- Health checks & Rollback protection

### Instructions:
1. Ensure you have SSH access to your VPS (`root` user).
2. Run the following command from your local project root:

```powershell
# On Windows (Local)
bash deploy/auto_deploy.sh
```

---

## 🛠 Manual Configuration Details

If you prefer to configure the VPS yourself, ensure the following components are correctly set up:

### 1. Environment Variables (`.env`)
Create a `.env` file in the project root on your VPS:
```ini
# Application
APP_URL="https://hoanvemaybay.com"
NODE_ENV="production"
PORT=3001

# Database (Neon PostgreSQL Cloud)
DATABASE_URL="postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require"

# JWT Auth
JWT_SECRET="<your-secure-random-secret>"
JWT_EXPIRES_IN="7d"

# Optional Services
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
GEMINI_API_KEY="your-gemini-key"
```

### 2. PM2 Process Manager
The application uses PM2 to ensure the backend stays online 24/7.

**Start the app:**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
```

**Monitor logs:**
```bash
pm2 logs hoantienve-api
```

### 3. Nginx Reverse Proxy
Nginx acts as the front layer, handling HTTPS and serving static files.
A pre-configured template is available at `deploy/nginx/hoantienve.conf`.

**Key features of our configuration:**
- HTTP to HTTPS redirect
- Gzip/Brotli compression
- Security headers (HSTS, CSP, etc.)
- API rate limiting (protects against DDoS)
- PM2 metrics dashboard

---

## 🛡️ Security Best Practices

1. **Firewall (UFW)**: Keep only ports 22, 80, and 443 open.
2. **Fail2Ban**: Automatically enabled via `setup_vps.sh` to prevent brute-force attacks.
3. **Automatic Updates**: Configured to install security patches automatically.
4. **Regular Backups**: A cron job runs daily at 2 AM (`/usr/local/bin/backup-hoantienve.sh`).

---

## 🏥 Troubleshooting

- **Check API status**: Visit `https://yourdomain.com/api/health`
- **Check PM2 status**: Run `pm2 status` on the server
- **View Nginx logs**: `tail -f /var/log/nginx/hoantienve_error.log`
- **Database Connection**: Ensure the VPS IP is allowed in your Neon project's dashboard.

---
*Created with ❤️ for AeroRefund Deployment*
