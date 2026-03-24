#!/bin/bash
# =============================================================================
# DEPLOY THỦ CÔNG - Chạy trong Hostinger Browser Terminal
# =============================================================================
# Cách dùng:
# 1. Mở Hostinger -> VPS -> Terminal
# 2. Copy TOÀN BỘ nội dung file này và paste vào terminal
# 3. Nhấn Enter
# =============================================================================
#
# Lần đầu chạy: Cài đặt hoàn chỉnh
# Lần sau chạy: Chỉ pull code mới và restart
# =============================================================================

set -e
DOMAIN="hoanvemaybay.com"
REMOTE_DIR="/var/www/hoantienve"

echo "=========================================="
echo "  HoanTienVe - Manual Deploy Script"
echo "  Domain: https://${DOMAIN}"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 1. Cài Node.js 20
echo "[1/9] Installing Node.js 20..."
export DEBIAN_FRONTEND=noninteractive
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v && npm -v

# 2. Cài PM2
echo "[2/9] Installing PM2..."
npm install -g pm2
pm2 install pm2-logrotate 2>/dev/null || true
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# 3. Tạo thư mục
echo "[3/9] Creating directories..."
mkdir -p ${REMOTE_DIR}/source ${REMOTE_DIR}/frontend /var/log/hoantienve /var/backups/hoantienve /var/www/acme-challenge

# 4. Clone code từ GitHub
echo "[4/9] Cloning from GitHub..."
cd ${REMOTE_DIR}
rm -rf source
git clone --depth 1 https://github.com/Bincode79/Hoantienve.git source
cd source

# 5. Tạo file .env (không hardcode DATABASE_URL)
echo "[5/9] Creating .env..."
JWT_SECRET=$(openssl rand -hex 64)
cat > .env << 'EOF'
# Application
APP_URL="https://${DOMAIN}"
NODE_ENV="production"
PORT=3001

# Neon PostgreSQL Database (Cloud)
# Lấy từ: https://console.neon.tech > your project > Connection Details
# Format: postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require
DATABASE_URL="postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require"

# JWT Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN="7d"

# Firebase (optional - for push notifications)
FIREBASE_SERVICE_ACCOUNT=

# Gemini AI (optional - for AI features)
GEMINI_API_KEY=
EOF
chmod 600 .env

# 6. Cài đặt dependencies & build
echo "[6/9] Installing deps & building..."
npm install
npm run build

# 7. Copy frontend
echo "[7/9] Copying frontend..."
rm -rf ${REMOTE_DIR}/frontend/*
cp -r dist/* ${REMOTE_DIR}/frontend/
chmod -R 755 ${REMOTE_DIR}/frontend

# 8. Cấu hình PM2 ecosystem (CommonJS - PM2 tương thích)
echo "[8/9] Configuring PM2 ecosystem..."
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'hoantienve-api',
    script: 'node_modules/.bin/tsx',
    args: 'server.ts',
    cwd: '/var/www/hoantienve/source',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '750M',
    node_args: '--max-old-space-size=650',
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      NODE_OPTIONS: '--max-old-space-size=650',
    },
    error_file: '/var/log/hoantienve/error.log',
    out_file: '/var/log/hoantienve/out.log',
    log_file: '/var/log/hoantienve/combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    kill_timeout: 8000,
    wait_ready: true,
    listen_timeout: 15000,
    shutdown_with_message: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
  }],
};
PM2EOF
chmod 644 ecosystem.config.js

# 9. Cấu hình Nginx (HTTP only - chưa có SSL)
echo "[9/9] Configuring Nginx (HTTP)..."
cat > /etc/nginx/sites-available/hoantienve << 'NGINXEOF'
upstream hoantienve_backend {
    server 127.0.0.1:3001;
    keepalive 64;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_conn_zone $binary_remote_addr zone=addr:10m;

server {
    listen 80;
    listen [::]:80;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;

    root /var/www/hoantienve/frontend;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        limit_conn addr 30;

        proxy_pass http://hoantienve_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_buffering off;
    }

    location /health {
        proxy_pass http://hoantienve_backend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        access_log off;
        allow all;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~ /\. {
        deny all;
        access_log off;
    }

    location ~* \.(env|log|sh|sql|bak|conf|key|crt|pem)$ {
        deny all;
        access_log off;
    }

    access_log /var/log/nginx/hoantienve_access.log combined buffer=16k;
    error_log /var/log/nginx/hoantienve_error.log warn;
}
NGINXEOF

sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" /etc/nginx/sites-available/hoantienve

ln -sf /etc/nginx/sites-available/hoantienve /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 10. Khởi động PM2
echo "[10/9] Starting PM2..."
pm2 delete hoantienve-api 2>/dev/null || true
cd /var/www/hoantienve/source
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup 2>/dev/null || true

# 11. (Tùy chọn) Cài SSL
echo ""
echo "=========================================="
echo "  LƯU Ý QUAN TRỌNG:"
echo "=========================================="
echo ""
echo "  1. CHỈNH SỬA .env ĐỂ THÊM DATABASE_URL:"
echo "     nano ${REMOTE_DIR}/source/.env"
echo "     Thay DATABASE_URL placeholder bằng connection string Neon thật"
echo ""
echo "  2. CÀI SSL (khuyến nghị):"
echo "     certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
echo "  3. SAU KHI CÀI SSL, RESTART PM2:"
echo "     pm2 restart hoantienve-api"
echo ""
echo "=========================================="
echo "  DEPLOY HOÀN TẤT!"
echo "=========================================="
echo "  Website: http://${DOMAIN}"
echo "  PM2: pm2 list"
echo "  Logs: pm2 logs hoantienve-api"
echo "  Deploy lại: cd ${REMOTE_DIR}/source && git pull && npm run build && pm2 restart hoantienve-api"
echo "=========================================="
