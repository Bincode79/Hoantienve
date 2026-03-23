#!/bin/bash
# =============================================================================
# DEPLOY THỦ CÔNG - Chạy trong Hostinger Browser Terminal
# =============================================================================
# Cách dùng:
# 1. Mở Hostinger -> VPS 1519321 -> Terminal
# 2. Copy TOÀN BỘ nội dung file này và paste vào terminal
# 3. Nhấn Enter
# =============================================================================

set -e
DOMAIN="hoanvemaybay.com"
REMOTE_DIR="/var/www/hoantienve"
# Thay DATABASE_URL bằng connection string Neon của bạn
DATABASE_URL="postgresql://neondb_owner:npg_vlDeXE5wKG4y@ep-divine-snow-a1kczhs4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo "=========================================="
echo "  HoanTienVe - Manual Deploy"
echo "=========================================="

# 1. Cài Node.js 20
echo "[1/8] Installing Node.js 20..."
export DEBIAN_FRONTEND=noninteractive
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v && npm -v

# 2. Cài PM2
echo "[2/8] Installing PM2..."
npm install -g pm2
pm2 install pm2-logrotate 2>/dev/null || true

# 3. Tạo thư mục
echo "[3/8] Creating directories..."
mkdir -p ${REMOTE_DIR}/source ${REMOTE_DIR}/frontend /var/log/hoantienve

# 4. Clone code từ GitHub
echo "[4/8] Cloning from GitHub..."
cd ${REMOTE_DIR}
rm -rf source
git clone --depth 1 https://github.com/Bincode79/Hoantienve.git source
cd source

# 5. Tạo file .env
echo "[5/8] Creating .env..."
JWT_SECRET=$(openssl rand -hex 64)
cat > .env << EOF
APP_URL="https://${DOMAIN}"
NODE_ENV="production"
PORT=3001
DATABASE_URL="${DATABASE_URL}"
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN="7d"
FIREBASE_SERVICE_ACCOUNT=
GEMINI_API_KEY=
EOF
chmod 600 .env

# 6. Build
echo "[6/8] Installing deps & building..."
npm install
npm run build

# 7. Copy frontend
echo "[7/8] Copying frontend..."
rm -rf ${REMOTE_DIR}/frontend/*
cp -r dist/* ${REMOTE_DIR}/frontend/
chmod -R 755 ${REMOTE_DIR}/frontend

# 8. Cấu hình PM2 ecosystem
cat > ecosystem.config.js << 'PM2EOF'
export default {
  apps: [{
    name: 'hoantienve-api',
    script: 'tsx',
    args: 'server.ts',
    cwd: '/var/www/hoantienve/source',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env_production: { NODE_ENV: 'production', PORT: 3001 },
    error_file: '/var/log/hoantienve/error.log',
    out_file: '/var/log/hoantienve/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
PM2EOF

# 9. Cấu hình Nginx
echo "[8/8] Configuring Nginx..."
cat > /etc/nginx/sites-available/hoantienve << 'NGINXEOF'
upstream hoantienve_backend {
    server 127.0.0.1:3001;
    keepalive 64;
}
server {
    listen 80;
    listen [::]:80;
    server_name hoanvemaybay.com www.hoanvemaybay.com 187.127.107.99;
    root /var/www/hoantienve/frontend;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://hoantienve_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/hoantienve /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 10. Khởi động PM2
pm2 delete hoantienve-api 2>/dev/null || true
cd /var/www/hoantienve/source
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup 2>/dev/null || true

echo ""
echo "=========================================="
echo "  DEPLOY HOÀN TẤT!"
echo "=========================================="
echo "  Website: http://${DOMAIN}"
echo "  PM2: pm2 list"
echo "  Logs: pm2 logs hoantienve-api"
echo "=========================================="
