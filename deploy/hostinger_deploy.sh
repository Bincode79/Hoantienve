#!/bin/bash
# =============================================================================
# AeroRefund - DEPLOY THỦ CÔNG QUA HOSTINGER TERMINAL
# =============================================================================
# CÁCH DÙNG:
#   1. Mở Hostinger > VPS > Thiết bị đầu cuối
#   2. Copy TOÀN BỘ nội dung file này
#   3. Paste vào terminal và nhấn Enter
# =============================================================================

set -e

# =============================================================================
# CẤU HÌNH
# =============================================================================
DATABASE_URL="postgresql://neondb_owner:npg_vlDeXE5wKG4y@ep-divine-snow-a1kczhs4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
REMOTE_DIR="/var/www/hoantienve"
LOG_DIR="/var/log/hoantienve"
BACKUP_DIR="/var/backups/hoantienve"
DOMAIN="hoanvemaybay.com"

# FCM & AI (Bổ sung nếu có)
FIREBASE_SERVICE_ACCOUNT='' # Dán JSON service account vào đây
GEMINI_API_KEY=''           # Dán API key vào đây

# =============================================================================
# HÀM TIỆN ÍCH
# =============================================================================
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }
ok() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1"; }
fail() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1" >&2; }
warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ $1"; }

# =============================================================================
# 1. CÀI NODE.JS 20
# =============================================================================
echo ""
echo "=============================================="
echo " [1/11] Cài Node.js 20..."
echo "=============================================="
export DEBIAN_FRONTEND=noninteractive
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt-get install -y nodejs > /dev/null 2>&1
ok "Node.js $(node -v) / npm $(npm -v)"

# =============================================================================
# 2. CÀI PM2
# =============================================================================
echo ""
echo "=============================================="
echo " [2/11] Cài PM2..."
echo "=============================================="
npm install -g pm2 > /dev/null 2>&1
pm2 install pm2-logrotate 2>/dev/null || true
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
ok "PM2 $(pm2 --version)"

# =============================================================================
# 3. CÀI NGINX
# =============================================================================
echo ""
echo "=============================================="
echo " [3/11] Cài Nginx..."
echo "=============================================="
apt-get install -y nginx > /dev/null 2>&1
systemctl start nginx
systemctl enable nginx
ok "Nginx $(nginx -v 2>&1)"

# =============================================================================
# 4. TẠO THƯ MỤC
# =============================================================================
echo ""
echo "=============================================="
echo " [4/11] Tạo thư mục..."
echo "=============================================="
mkdir -p "$REMOTE_DIR/source" "$REMOTE_DIR/frontend" "$LOG_DIR" "$BACKUP_DIR" /var/www/acme-challenge
ok "Thư mục đã tạo"

# =============================================================================
# 5. CLONE/PULL CODE
# =============================================================================
echo ""
echo "=============================================="
echo " [5/11] Clone code từ GitHub..."
echo "=============================================="
cd "$REMOTE_DIR"
if [ -d "source/.git" ]; then
    log "Update repo hiện tại..."
    cd source && git pull
else
    log "Clone repo mới..."
    rm -rf source
    git clone --depth 1 https://github.com/Bincode79/Hoantienve.git source
    cd source
fi
ok "Code: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"

# =============================================================================
# 6. TẠO .ENV
# =============================================================================
echo ""
echo "=============================================="
echo " [6/11] Tạo file .env..."
echo "=============================================="
JWT_SECRET=$(openssl rand -hex 64)
cat > "$REMOTE_DIR/source/.env" << EOF
APP_URL="https://${DOMAIN}"
NODE_ENV="production"
PORT=3001
DATABASE_URL="${DATABASE_URL}"
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN="7d"
# Firebase Cloud Messaging (Dán JSON vào đây nếu có)
FIREBASE_SERVICE_ACCOUNT='${FIREBASE_SERVICE_ACCOUNT}'

# Gemini AI (Dán API key vào đây nếu có)
GEMINI_API_KEY='${GEMINI_API_KEY}'
EOF
chmod 600 "$REMOTE_DIR/source/.env"
ok ".env đã tạo"

# =============================================================================
# 7. CÀI DEPENDENCIES
# =============================================================================
echo ""
echo "=============================================="
echo " [7/11] Cài npm dependencies..."
echo "=============================================="
cd "$REMOTE_DIR/source"
npm install 2>&1 | tail -3
ok "Dependencies đã cài"

# =============================================================================
# 8. BUILD
# =============================================================================
echo ""
echo "=============================================="
echo " [8/11] Build frontend..."
echo "=============================================="
npm run build 2>&1 | tail -5
if [ ! -d "dist" ]; then
    fail "Build thất bại!"
    exit 1
fi
ok "Build thành công!"

# =============================================================================
# 9. COPY FRONTEND
# =============================================================================
echo ""
echo "=============================================="
echo " [9/11] Copy frontend..."
echo "=============================================="
rm -rf "$REMOTE_DIR/frontend/"*
cp -r "$REMOTE_DIR/source/dist/"* "$REMOTE_DIR/frontend/"
chmod -R 755 "$REMOTE_DIR/frontend"
ok "Frontend đã copy"

# =============================================================================
# 10. CẤU HÌNH PM2
# =============================================================================
echo ""
echo "=============================================="
echo " [10/11] Cấu hình PM2..."
echo "=============================================="
cat > "$REMOTE_DIR/source/ecosystem.config.js" << 'PM2EOF'
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
    env: { NODE_ENV: 'development', PORT: 3001 },
    env_production: { NODE_ENV: 'production', PORT: 3001, NODE_OPTIONS: '--max-old-space-size=650' },
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
chmod 644 "$REMOTE_DIR/source/ecosystem.config.js"
ok "PM2 ecosystem config đã tạo"

# =============================================================================
# 11. SEED DATABASE
# =============================================================================
echo ""
echo "=============================================="
echo " [11/11] Seed database (tạo tài khoản)..."
echo "=============================================="
export DATABASE_URL
export ADMIN_HASH='$2b$12$1HHbEdTN4GBES95ezdtKi.FCQKVuf1k5eV3xVw6eFTjiVomYD0vOO'
export USER_HASH='$2b$12$WHxEmpdB2mpqr4fxQ3IuDuEGHUVdq28hlIplMWIICGw6DHsgKIeZa'

node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function seed() {
  // Tạo bảng users
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sdt TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  \`);

  const admins = [
    { sdt: '0999999999', email: 'admin@app.aerorefund.local', name: 'Nguyễn Văn Minh' },
    { sdt: '0383165313', email: 'admin2@app.aerorefund.local', name: 'Trần Thị Lan' },
    { sdt: '0968686868', email: 'admin3@app.aerorefund.local', name: 'Lê Hoàng Nam' },
    { sdt: '0912345678', email: 'admin4@app.aerorefund.local', name: 'Phạm Văn Đức' },
    { sdt: '0977777777', email: 'admin5@app.aerorefund.local', name: 'Ngô Thị Hương' },
    { sdt: '0988888888', email: 'admin6@app.aerorefund.local', name: 'Đặng Minh Tuấn' },
  ];

  const users = [
    { sdt: '0901001001', email: 'user1@app.aerorefund.local', name: 'Phạm Thị Mai' },
    { sdt: '0902002002', email: 'user2@app.aerorefund.local', name: 'Hoàng Đức Anh' },
  ];

  for (const a of admins) {
    await pool.query(\`
      INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
      VALUES (\$1, \$2, \$3, \$4, 'admin', 'active')
      ON CONFLICT (sdt) DO UPDATE SET password_hash=\$3, display_name=\$4, role='admin', status='active'
    \`, [a.sdt, a.email, process.env.ADMIN_HASH, a.name]);
    console.log('Admin: ' + a.sdt + ' - ' + a.name);
  }

  for (const u of users) {
    await pool.query(\`
      INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
      VALUES (\$1, \$2, \$3, \$4, 'user', 'active')
      ON CONFLICT (sdt) DO UPDATE SET password_hash=\$3, display_name=\$4, role='user', status='active'
    \`, [u.sdt, u.email, process.env.USER_HASH, u.name]);
    console.log('User: ' + u.sdt + ' - ' + u.name);
  }

  console.log('✅ Database seeded!');
  await pool.end();
}

seed().catch(e => { console.error('❌ Lỗi:', e.message); process.exit(1); });
" 2>&1

if [ $? -eq 0 ]; then
    ok "Database seeded!"
else
    warn "Database seed có thể đã chạy rồi (không sao)"
fi

# =============================================================================
# KHỞI ĐỘNG PM2
# =============================================================================
echo ""
echo "=============================================="
echo " Khởi động PM2..."
echo "=============================================="
cd "$REMOTE_DIR/source"
pm2 delete hoantienve-api 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup 2>/dev/null || true
sleep 3

if pm2 list | grep -q "online"; then
    ok "PM2 đang chạy"
else
    warn "Kiểm tra log..."
    pm2 logs hoantienve-api --lines 10 --nostream 2>&1 | tail -10
fi

# =============================================================================
# CẤU HÌNH NGINX
# =============================================================================
echo ""
echo "=============================================="
echo " Cấu hình Nginx..."
echo "=============================================="
cat > /etc/nginx/sites-available/hoantienve << 'NGINXEOF'
upstream hoantienve_backend { server 127.0.0.1:3001; keepalive 64; }
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_conn_zone $binary_remote_addr zone=addr:10m;

server {
    listen 80;
    listen [::]:80;
    server_name srv1519321.hstgr.cloud www.srv1519321.hstgr.cloud;
    root /var/www/hoantienve/frontend;
    index index.html;

    gzip on; gzip_vary on; gzip_proxied any; gzip_comp_level 6; gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    location / { try_files $uri $uri/ /index.html; }
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
    }
    location /health {
        proxy_pass http://hoantienve_backend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|webp)$ { expires 1y; add_header Cache-Control "public, immutable"; access_log off; }
    location ~ /\. { deny all; access_log off; }
    location ~* \.(env|log|sh|sql|bak)$ { deny all; access_log off; }
    access_log /var/log/nginx/hoantienve_access.log combined buffer=16k;
    error_log /var/log/nginx/hoantienve_error.log warn;
}
NGINXEOF

ln -sf /etc/nginx/sites-available/hoantienve /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "Nginx đã cấu hình"

# =============================================================================
# HEALTH CHECK
# =============================================================================
echo ""
echo "=============================================="
echo " Health Check..."
echo "=============================================="
sleep 3
for i in 1 2 3 4 5; do
    if curl -sf http://localhost:3001/ > /dev/null 2>&1; then
        ok "Health check passed (attempt $i)"
        break
    fi
    if [ $i -eq 5 ]; then
        warn "Health check chưa pass - xem log:"
        pm2 logs hoantienve-api --lines 15 --nostream 2>&1 | tail -15
    else
        echo "  ⏳ Attempt $i/5..."
        sleep 2
    fi
done

# =============================================================================
# HOÀN TẤT
# =============================================================================
echo ""
echo "=============================================="
echo " 🎉 DEPLOY HOÀN TẤT!"
echo "=============================================="
echo ""
echo "  🌐 Website: http://srv1519321.hstgr.cloud"
echo "  🔌 API:     http://srv1519321.hstgr.cloud/api"
echo ""
echo "  📋 TÀI KHOẢN ĐĂNG NHẬP:"
echo "  ----------------------------------------"
echo "  Admin:  SĐT: 0999999999  |  Mật khẩu: Admin@123"
echo "  Admin:  SĐT: 0383165313  |  Mật khẩu: Admin@123"
echo "  User:   SĐT: 0901001001  |  Mật khẩu: User@123"
echo ""
echo "  📌 LỆNH HỮU ÍCH:"
echo "  pm2 status                  - Xem trạng thái"
echo "  pm2 logs hoantienve-api     - Xem logs"
echo "  pm2 restart hoantienve-api   - Restart app"
echo ""
echo "=============================================="
echo ""
