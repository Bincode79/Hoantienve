# AeroRefund (HoanTienVe365) - VPS Deployment Guide

## Tổng quan

Thư mục này chứa toàn bộ scripts và cấu hình cần thiết để triển khai AeroRefund lên VPS với Nginx, PM2, SSL.

## Cấu trúc thư mục

```
deploy/
├── README.md                   # Hướng dẫn triển khai (file này)
├── deploy.sh                   # Script deploy chính (chạy trên VPS)
├── setup_vps.sh               # Script cài đặt VPS lần đầu (chạy với sudo)
├── auto_deploy.sh             # Auto-deploy từ local qua SSH (Linux/macOS)
├── auto_deploy.ps1            # Auto-deploy từ local qua SSH (Windows PowerShell)
├── manual_deploy_via_browser.sh # Deploy thủ công qua Hostinger Browser Terminal
├── install_aapanel.sh         # aaPanel control panel installation
├── hoantienve.service         # Systemd service file (backup option cho PM2)
├── .env.production.example    # Template biến môi trường production
└── nginx/
    └── hoantienve.conf        # Nginx configuration template
```

## Yêu cầu

- **OS**: Ubuntu 22.04 LTS (hoặc 20.04)
- **RAM**: Tối thiểu 1GB (2GB khuyến nghị)
- **CPU**: 1 vCPU
- **Domain**: Cần có domain trỏ về VPS
- **Database**: Neon PostgreSQL (Cloud)

## Chi phí ước tính

| Service | Chi phí/tháng |
|---|---|
| VPS (1GB RAM) | $5-10 |
| Domain | $10-15/năm |
| Neon PostgreSQL (Free tier) | $0 |
| SSL (Let's Encrypt) | $0 |
| **Tổng** | **~$5-10/tháng** |

---

## Hướng dẫn triển khai

### Bước 1: Thiết lập VPS lần đầu

SSH vào VPS và chạy script setup:

```bash
# SSH vào VPS
ssh root@your-vps-ip

# Chạy script setup (thay your-domain.com bằng domain của bạn)
bash /path/to/deploy/setup_vps.sh your-domain.com

# Hoặc không có domain, setup step-by-step:
bash /path/to/deploy/setup_vps.sh
```

Script sẽ tự động cài đặt:
- Node.js 20 LTS
- PM2 Process Manager
- Nginx
- Certbot (SSL)
- Firewall (UFW)
- Tạo user và thư mục

### Bước 2: Upload source code lên VPS

```bash
# Trên máy local, clone repo vào VPS
ssh www-hoantienve@your-vps-ip
cd /var/www/hoantienve/source

# Clone repo (thay URL bằng repo của bạn)
git clone https://github.com/your-repo/hoantienve.git .

# Checkout branch main
git checkout main
```

### Bước 3: Cấu hình Environment Variables

```bash
# Tạo file .env từ template
cd /var/www/hoantienve/source
cp .env.production.example .env

# Copy ecosystem.config.js vào source
cp /path/to/deploy/ecosystem.config.js ./

# Chỉnh sửa .env
nano .env
```

**Các biến cần thiết:**

```env
APP_URL="https://your-domain.com"
NODE_ENV="production"
PORT=3000

# Database - Neon PostgreSQL
DATABASE_URL="postgresql://user:password@ep-xxx.xxx.aws.neon.tech/neondb?sslmode=require"

# JWT Authentication
JWT_SECRET="generate-a-64-character-random-string"
JWT_EXPIRES_IN="7d"

# Firebase (nếu có)
FIREBASE_SERVICE_ACCOUNT="..."
VITE_FCM_VAPID_KEY="..."
```

### Bước 4: Cài đặt dependencies và build

```bash
cd /var/www/hoantienve/source
npm install
npm run build
```

### Bước 5: Copy build files

```bash
# Copy files ra thư mục frontend
rm -rf /var/www/hoantienve/frontend/*
cp -r /var/www/hoantienve/source/dist/* /var/www/hoantienve/frontend/
sudo chown -R www-data:www-data /var/www/hoantienve/frontend
```

### Bước 6: Copy và cấu hình Nginx

```bash
# Copy Nginx config
sudo cp /path/to/deploy/nginx/hoantienve.conf /etc/nginx/sites-available/hoantienve

# Thay YOUR_DOMAIN bằng domain thật của bạn
sudo nano /etc/nginx/sites-available/hoantienve

# Enable site
sudo ln -sf /etc/nginx/sites-available/hoantienve /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test và reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 7: Khởi động ứng dụng với PM2

```bash
cd /var/www/hoantienve/source
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Chạy lệnh output để enable auto-start
```

### Bước 8: Cài đặt SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d your-domain.com
```

Certbot sẽ tự động:
- Lấy SSL certificate
- Cập nhật Nginx config cho HTTPS
- Thiết lập auto-renewal

### Bước 9: Kiểm tra

```bash
# Kiểm tra PM2 status
pm2 status

# Kiểm tra logs
pm2 logs hoantienve-api --lines 50

# Kiểm tra Nginx
sudo systemctl status nginx

# Health check
curl http://localhost
curl http://localhost:3000/api/data/health
```

---

## Các phương án triển khai

### Phương án 1: Auto-Deploy từ Local (Khuyến nghị - Linux/macOS)

Deploy toàn bộ hệ thống từ máy local qua SSH:

```bash
# Linux/macOS
cd f:/Hoantienve/deploy
chmod +x auto_deploy.sh
./auto_deploy.sh                    # Full deployment
./auto_deploy.sh --skip-setup       # Skip VPS setup (đã setup rồi)
./auto_deploy.sh --skip-backup      # Skip backup (không khuyến nghị)
./auto_deploy.sh --rollback         # Rollback về backup trước
```

### Phương án 2: Auto-Deploy từ Local (Windows PowerShell)

```powershell
# Windows
cd f:\Hoantienve\deploy
.\auto_deploy.ps1
```

### Phương án 3: Deploy thủ công qua Hostinger Browser Terminal

```bash
# Copy TOÀN BỘ nội dung file manual_deploy_via_browser.sh
# Paste vào Hostinger Terminal và nhấn Enter
```

### Phương án 4: CI/CD với GitHub Actions (Tự động khi push)

Xem phần **CI/CD với GitHub Actions** bên dưới.

### Phương án 5: Git pull trên VPS (Nhanh nhất - sau lần setup đầu)

```bash
# SSH vào VPS
ssh root@187.127.107.99

# Pull code mới và restart
cd /var/www/hoantienve/source
git pull
npm install
npm run build
pm2 restart hoantienve-api
```

---

## Sử dụng Deploy Script (chạy trên VPS)

Sau khi đã setup lần đầu, deploy script cho phép cập nhật code nhanh chóng:

```bash
# SSH vào VPS, cd vào thư mục source
cd /var/www/hoantienve/source

# Full deployment (backup + git pull + npm install + build + restart)
bash /var/www/hoantienve/deploy/deploy.sh

# Skip backup (không khuyến nghị)
bash /var/www/hoantienve/deploy/deploy.sh skip-backup

# Rollback to previous version
bash /var/www/hoantienve/deploy/deploy.sh --rollback
```

**Lưu ý:** Copy script deploy vào VPS (nếu chưa có):

```bash
# Trên VPS
cp /var/www/hoantienve/source/deploy/deploy.sh /var/www/hoantienve/
chmod +x /var/www/hoantienve/deploy.sh
```

---

## CI/CD với GitHub Actions

### Bước 1: Cấu hình GitHub Secrets

Trong repo GitHub, vào **Settings > Secrets and variables > Actions** và thêm:

| Secret Name | Mô tả | Ví dụ |
|---|---|---|
| `VPS_HOST` | IP hoặc hostname VPS | `123.45.67.89` |
| `VPS_USER` | SSH username | `www-hoantienve` |
| `VPS_SSH_KEY` | Private SSH key | `-----BEGIN RSA...` |
| `VITE_API_URL` | Production API URL | `https://your-domain.com` |
| `VITE_FIREBASE_*` | Firebase client keys | (từ Firebase Console) |
| `VITE_SUPABASE_*` | Supabase keys (nếu có) | (từ Supabase Dashboard) |

### Bước 2: Cấu hình SSH Key

```bash
# Trên máy local, tạo SSH key pair (nếu chưa có)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key lên VPS
ssh-copy-id www-hoantienve@your-vps-ip

# Export private key (để thêm vào GitHub Secrets)
cat ~/.ssh/id_rsa
```

### Bước 3: Trigger Deployment

Push code lên branch `main`:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

GitHub Actions sẽ tự động:
1. Lint & Type Check
2. Build frontend với environment variables
3. Deploy lên VPS qua SSH
4. Restart PM2 và reload Nginx

---

## Các lệnh hữu ích

### PM2

```bash
pm2 status                    # Xem trạng thái app
pm2 logs hoantienve-api       # Xem logs realtime
pm2 logs hoantienve-api --lines 100  # Xem 100 dòng log cuối
pm2 monit                     # Monitoring dashboard
pm2 restart hoantienve-api    # Restart app
pm2 stop hoantienve-api       # Stop app
pm2 delete hoantienve-api     # Xóa app khỏi PM2
pm2 save                      # Lưu trạng thái PM2
pm2 startup                   # Setup auto-start
```

### Nginx

```bash
sudo systemctl status nginx   # Xem trạng thái
sudo systemctl reload nginx   # Reload config
sudo systemctl restart nginx # Restart
sudo nginx -t                # Test config
sudo certbot --nginx -d your-domain.com  # Renew SSL
```

### Logs

```bash
# PM2 logs
pm2 logs --nostream --lines 100

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /var/log/hoantienve/combined.log
```

---

## Troubleshooting

### App không khởi động được

```bash
# Xem logs
pm2 logs hoantienve-api

# Kiểm tra .env file
cat /var/www/hoantienve/source/.env

# Kiểm tra port 3001
lsof -i :3001
netstat -tlnp | grep 3001
```

### Database connection failed

```bash
# Kiểm tra DATABASE_URL trong .env
cat /var/www/hoantienve/source/.env | grep DATABASE_URL

# Test connection
psql "postgresql://user:password@host/db?sslmode=require"
```

### SSL certificate hết hạn

```bash
# Renew certificate
sudo certbot renew

# Force renew
sudo certbot renew --force-renewal
```

### Nginx 502 Bad Gateway

```bash
# Kiểm tra PM2 có đang chạy không
pm2 status

# Restart PM2
pm2 restart hoantienve-api

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### PM2 process không khởi động sau reboot

```bash
# Generate startup command
pm2 startup

# Chạy lệnh được output ( ví dụ: systemd)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u www-hoantienve --hp /home/www-hoantienve

# Save current state
pm2 save
```

---

## Backup & Recovery

### Backup Database (Neon)

Neon tự động backup. Để restore:

1. Vào Neon Dashboard
2. Chọn Branch > Backups
3. Click Restore

### Backup Code

```bash
# Trên VPS
tar -czvf backup_$(date +%Y%m%d).tar.gz \
  /var/www/hoantienve/source \
  /var/www/hoantienve/frontend \
  /var/www/hoantienve/.env
```

---

## Security Checklist

- [ ] Firewall enabled (UFW)
- [ ] SSH key-based authentication (no password)
- [ ] SSH port changed (hoặc fail2ban)
- [ ] .env file không commit lên git
- [ ] SSL certificate installed
- [ ] Nginx security headers enabled
- [ ] PM2 auto-restart enabled
- [ ] Regular system updates enabled
- [ ] Backup strategy in place
