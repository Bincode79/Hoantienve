#!/bin/bash
# =============================================================================
# AeroRefund (HoanTienVe365) - DEPLOY THỦ CÔNG HOÀN CHỈNH
# =============================================================================
# Chạy TỪ MÁY LOCAL qua SSH:
#   chmod +x manual_deploy_full.sh
#   ./manual_deploy_full.sh
#
# Hoặc copy toàn bộ nội dung và paste vào Hostinger Browser Terminal
# =============================================================================
#
# TRƯỚC KHI CHẠY - Cần chuẩn bị:
#   1. Mở port 22, 80, 443 trong Hostinger Firewall Rules
#   2. Có DATABASE_URL từ Neon (https://console.neon.tech)
# =============================================================================

set -e

# =============================================================================
# CẤU HÌNH - SỬA CÁC GIÁ TRỊ BÊN DƯỚI NẾU CẦN
# =============================================================================
REMOTE_USER="root"
REMOTE_HOST="187.127.107.99"
REMOTE_PORT="22"
DOMAIN="hoanvemaybay.com"
REMOTE_DIR="/var/www/hoantienve"
LOG_DIR="/var/log/hoantienve"
BACKUP_DIR="/var/backups/hoantienve"

# Database - Neon PostgreSQL
# Lấy từ: https://console.neon.tech > Project > Connection Details
DATABASE_URL="postgresql://neondb_owner:npg_vlDeXE5wKG4y@ep-divine-snow-a1kczhs4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# FCM & AI (Bổ sung nếu có)
FIREBASE_SERVICE_ACCOUNT='' # Dán JSON service account vào đây
GEMINI_API_KEY=''           # Dán API key vào đây

# =============================================================================
# HÀM TIỆN ÍCH
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
log_success() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅${NC} $1"; }
log_error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌${NC} $1" >&2; }
log_warning() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"; }
log_header() {
    echo ""
    echo -e "${CYAN}==============================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}==============================================${NC}"
}

# SSH helper
ssh_run() {
    ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "$1"
}

ssh_run_script() {
    ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" bash -s -- "$DATABASE_URL" "$DOMAIN" "$REMOTE_DIR" "$LOG_DIR" << 'ENDSSH'
set -e

DATABASE_URL="$1"
DOMAIN="$2"
REMOTE_DIR="$3"
LOG_DIR="$4"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
log_success() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅${NC} $1"; }
log_error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌${NC} $1" >&2; }
log_warning() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"; }
log_header() {
    echo ""
    echo -e "${CYAN}==============================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}==============================================${NC}"
}

# =============================================================================
# 1. CÀI ĐẶT NODE.JS 20
# =============================================================================
log_header "1/12: Cài đặt Node.js 20"
export DEBIAN_FRONTEND=noninteractive
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v && npm -v
log_success "Node.js $(node -v) và npm $(npm -v) đã cài"

# =============================================================================
# 2. CÀI PM2
# =============================================================================
log_header "2/12: Cài đặt PM2"
npm install -g pm2
pm2 install pm2-logrotate 2>/dev/null || true
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
log_success "PM2 $(pm2 --version) đã cài"

# =============================================================================
# 3. CÀI NGINX
# =============================================================================
log_header "3/12: Cài đặt Nginx"
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
log_success "Nginx đã cài và khởi động"

# =============================================================================
# 4. TẠO THƯ MỤC
# =============================================================================
log_header "4/12: Tạo thư mục"
mkdir -p "$REMOTE_DIR/source"
mkdir -p "$REMOTE_DIR/frontend"
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p /var/www/acme-challenge
log_success "Thư mục đã tạo"

# =============================================================================
# 5. CLONE CODE TỪ GITHUB
# =============================================================================
log_header "5/12: Clone code từ GitHub"
cd "$REMOTE_DIR"
if [ -d "source/.git" ]; then
    log "Repo đã tồn tại, update..."
    cd source && git pull
else
    log "Clone repo mới..."
    rm -rf source
    git clone --depth 1 https://github.com/Bincode79/Hoantienve.git source
    cd source
fi
log_success "Code đã sẵn sàng ($(git rev-parse --short HEAD))"

# =============================================================================
# 6. TẠO FILE .ENV
# =============================================================================
log_header "6/12: Tạo file .env"

if [ "$DATABASE_URL" = "CHƯA_SET_DATABASE_URL" ] || [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL chưa được set!"
    log_error "Vui lòng chỉnh sửa script và thay DATABASE_URL bằng connection string từ Neon"
    log_error "Lấy từ: https://console.neon.tech > Project > Connection Details"
    exit 1
fi

JWT_SECRET=$(openssl rand -hex 64)

cat > "$REMOTE_DIR/source/.env" << EOF
# Application
APP_URL="https://${DOMAIN}"
NODE_ENV="production"
PORT=3001

# Neon PostgreSQL Database
DATABASE_URL="${DATABASE_URL}"

# JWT Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN="7d"

# Firebase Cloud Messaging (Dán JSON vào đây nếu có)
FIREBASE_SERVICE_ACCOUNT='${FIREBASE_SERVICE_ACCOUNT}'

# Gemini AI (Dán API key vào đây nếu có)
GEMINI_API_KEY='${GEMINI_API_KEY}'
EOF

chmod 600 "$REMOTE_DIR/source/.env"
log_success ".env đã tạo"

# =============================================================================
# 7. CÀI ĐẶT DEPENDENCIES
# =============================================================================
log_header "7/12: Cài đặt npm dependencies"
cd "$REMOTE_DIR/source"
npm install 2>&1 | tail -3
log_success "Dependencies đã cài"

# =============================================================================
# 8. BUILD
# =============================================================================
log_header "8/12: Build frontend"
npm run build 2>&1 | tail -5

if [ ! -d "dist" ]; then
    log_error "Build thất bại - thư mục dist không tồn tại"
    exit 1
fi
log_success "Build hoàn tất"

# =============================================================================
# 9. COPY FRONTEND
# =============================================================================
log_header "9/12: Copy frontend"
rm -rf "$REMOTE_DIR/frontend/*"
cp -r "$REMOTE_DIR/source/dist/"* "$REMOTE_DIR/frontend/"
chmod -R 755 "$REMOTE_DIR/frontend"
log_success "Frontend đã copy"

# =============================================================================
# 10. CẤU HÌNH PM2 ECOSYSTEM
# =============================================================================
log_header "10/12: Cấu hình PM2"

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

chmod 644 "$REMOTE_DIR/source/ecosystem.config.js"
log_success "PM2 ecosystem config đã tạo"

# =============================================================================
# 11. CẤU HÌNH NGINX
# =============================================================================
log_header "11/12: Cấu hình Nginx"

cat > /etc/nginx/sites-available/hoantienve << NGINXEOF
# Upstream backend
upstream hoantienve_backend {
    server 127.0.0.1:3001;
    keepalive 64;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_conn_zone \$binary_remote_addr zone=addr:10m;

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/acme-challenge;
        try_files \$uri =404;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_protocols TLSv1.2 TLSv1.3;

    root ${REMOTE_DIR}/frontend;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        limit_conn addr 30;
        proxy_pass http://hoantienve_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    location /health {
        proxy_pass http://hoantienve_backend/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        access_log off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~ /\. { deny all; access_log off; }
    location ~* \.(env|log|sh|sql|bak)$ { deny all; access_log off; }

    access_log /var/log/nginx/hoantienve_access.log combined buffer=16k;
    error_log /var/log/nginx/hoantienve_error.log warn;
}
NGINXEOF

ln -sf /etc/nginx/sites-available/hoantienve /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

if ! nginx -t; then
    log_error "Nginx config test failed"
    exit 1
fi

systemctl reload nginx
log_success "Nginx đã cấu hình"

# =============================================================================
# 12. SEED DATABASE - TẠO TÀI KHOẢN
# =============================================================================
log_header "12/12: Seed Database (tạo tài khoản)"

# Tạo script seed
cat > /tmp/seed_db.sh << 'SEEDEOF'
#!/bin/bash
export DATABASE_URL="$1"
cd /var/www/hoantienve/source

# Bcrypt hash for Admin@123 (cost 12)
ADMIN_HASH='$2b$12$1HHbEdTN4GBES95ezdtKi.FCQKVuf1k5eV3xVw6eFTjiVomYD0vOO'
# Bcrypt hash for User@123 (cost 12)
USER_HASH='$2b$12$WHxEmpdB2mpqr4fxQ3IuDuEGHUVdq28hlIplMWIICGw6DHsgKIeZa'

echo "🔄 Đang seed database..."

# Tạo bảng users
npx tsx -e "
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function seed() {
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

  // Admin accounts
  const admins = [
    { sdt: '0999999999', email: 'admin@app.aerorefund.local', name: 'Nguyễn Văn Minh' },
    { sdt: '0383165313', email: 'admin2@app.aerorefund.local', name: 'Trần Thị Lan' },
    { sdt: '0968686868', email: 'admin3@app.aerorefund.local', name: 'Lê Hoàng Nam' },
    { sdt: '0912345678', email: 'admin4@app.aerorefund.local', name: 'Phạm Văn Đức' },
    { sdt: '0977777777', email: 'admin5@app.aerorefund.local', name: 'Ngô Thị Hương' },
    { sdt: '0988888888', email: 'admin6@app.aerorefund.local', name: 'Đặng Minh Tuấn' },
  ];

  for (const a of admins) {
    await pool.query(\`
      INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
      VALUES (\$1, \$2, \$3, \$4, 'admin', 'active')
      ON CONFLICT (sdt) DO UPDATE SET password_hash=\$3, display_name=\$4, role='admin', status='active'
    \`, [a.sdt, a.email, process.env.ADMIN_HASH || '$2b$12$1HHbEdTN4GBES95ezdtKi.FCQKVuf1k5eV3xVw6eFTjiVomYD0vOO', a.name]);
    console.log('Admin: ' + a.sdt + ' - ' + a.name);
  }

  // User accounts
  const users = [
    { sdt: '0901001001', email: 'user1@app.aerorefund.local', name: 'Phạm Thị Mai' },
    { sdt: '0902002002', email: 'user2@app.aerorefund.local', name: 'Hoàng Đức Anh' },
  ];

  for (const u of users) {
    await pool.query(\`
      INSERT INTO public.users (sdt, email, password_hash, display_name, role, status)
      VALUES (\$1, \$2, \$3, \$4, 'user', 'active')
      ON CONFLICT (sdt) DO UPDATE SET password_hash=\$3, display_name=\$4, role='user', status='active'
    \`, [u.sdt, u.email, process.env.USER_HASH || '$2b$12$WHxEmpdB2mpqr4fxQ3IuDuEGHUVdq28hlIplMWIICGw6DHsgKIeZa', u.name]);
    console.log('User: ' + u.sdt + ' - ' + u.name);
  }

  console.log('✅ Database seeded thành công!');
  await pool.end();
}

seed().catch(e => { console.error('❌ Lỗi:', e.message); process.exit(1); });
"
SEEDEOF

chmod +x /tmp/seed_db.sh
bash /tmp/seed_db.sh "$DATABASE_URL"

# =============================================================================
# KHỞI ĐỘNG PM2
# =============================================================================
log_header "Khởi động PM2"
cd "$REMOTE_DIR/source"
pm2 delete hoantienve-api 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup 2>/dev/null || true

sleep 3
pm2_status=$(pm2 list | grep hoantienve-api || echo "")
if echo "$pm2_status" | grep -q "online"; then
    log_success "PM2 đang chạy ✅"
else
    log_warning "PM2 có thể chưa online, kiểm tra log..."
    pm2 logs hoantienve-api --lines 10 --nostream
fi

# =============================================================================
# HEALTH CHECK
# =============================================================================
log_header "Health Check"
sleep 3
for i in 1 2 3 4 5; do
    if curl -sf http://localhost:3001/ > /dev/null 2>&1; then
        log_success "Health check passed (attempt $i)"
        break
    fi
    if [ $i -eq 5 ]; then
        log_warning "Health check chưa pass, xem log..."
        pm2 logs hoantienve-api --lines 20 --nostream
    else
        echo "  ⏳ Attempt $i/5 - đang chờ..."
        sleep 2
    fi
done

# =============================================================================
# HOÀN TẤT
# =============================================================================
log_header "DEPLOY HOÀN TẤT!"
echo ""
echo "=============================================="
echo "  🌐 Website: https://$DOMAIN"
echo "  🔌 API:     https://$DOMAIN/api"
echo "  💾 Database: Neon PostgreSQL (Connected)"
echo ""
echo "  TÀI KHOẢN ĐĂNG NHẬP:"
echo "  ----------------------------------------"
echo "  Admin:"
echo "    SĐT:    0999999999"
echo "    Mật khẩu: Admin@123"
echo ""
echo "  User:"
echo "    SĐT:    0901001001"
echo "    Mật khẩu: User@123"
echo "=============================================="
echo ""
echo "  LỆNH HỮU ÍCH:"
echo "  pm2 status           - Xem trạng thái"
echo "  pm2 logs hoantienve-api - Xem logs"
echo "  pm2 restart hoantienve-api - Restart"
echo ""
echo "  CÀI SSL (sau khi có domain):"
echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "=============================================="

ENDSSH
}

# =============================================================================
# BẮT ĐẦU DEPLOY
# =============================================================================

echo ""
echo "=============================================="
echo "   AeroRefund - Deploy Thủ Công Hoàn Chỉnh"
echo "   Target: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
echo ""

# Kiểm tra kết nối SSH
log "Kiểm tra kết nối SSH..."
if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH OK'" 2>/dev/null; then
    log_error "Không thể kết nối SSH đến $REMOTE_HOST:$REMOTE_PORT"
    log_error "Vui lòng kiểm tra:"
    log_error "  1. VPS đang chạy"
    log_error "  2. Port $REMOTE_PORT đã mở trong Firewall"
    log_error "  3. SSH key đã được thêm vào VPS"
    exit 1
fi
log_success "Kết nối SSH OK"

# Kiểm tra DATABASE_URL
if [ "$DATABASE_URL" = "CHƯA_SET_DATABASE_URL" ]; then
    log_error "=============================================="
    log_error "CẦN THIẾT: Chỉnh sửa DATABASE_URL trong script!"
    log_error ""
    log_error "Lấy DATABASE_URL từ:"
    log_error "  https://console.neon.tech"
    log_error "  > Project > Connection Details > Connection string"
    log_error ""
    log_error "Format: postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require"
    log_error ""
    log_error "Sau đó sửa dòng:"
    log_error '  DATABASE_URL="CHƯA_SET_DATABASE_URL"'
    log_error "thành:"
    log_error '  DATABASE_URL="postgresql://..."'
    log_error "=============================================="
    exit 1
fi

log_success "DATABASE_URL đã được cấu hình"
log "Bắt đầu deploy..."
echo ""

# Chạy deploy script trên VPS
ssh_run_script

echo ""
log_success "Deploy thủ công hoàn tất!"
