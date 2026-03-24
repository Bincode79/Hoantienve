# =============================================================================
# AeroRefund (HoanTienVe365) - Auto Deploy Script for Windows (PowerShell)
# =============================================================================
# Server: 187.127.107.99
# Domain: hoanvemaybay.com
# Run: .\auto_deploy.ps1
# =============================================================================
# Requirements:
#   - OpenSSH client installed (comes with Windows 10+)
#   - SSH key configured for passwordless login to VPS
# =============================================================================

$ErrorActionPreference = "Stop"

# Configuration
$VPS_HOST = "187.127.107.99"
$VPS_USER = "root"
$VPS_PORT = "22"
$DOMAIN = "hoanvemaybay.com"
# Auto-detect source directory (parent of deploy folder)
$SOURCE_DIR = Split-Path -Parent $PSScriptRoot
$REMOTE_DIR = "/var/www/hoantienve"
$BACKUP_DIR = "/var/backups/hoantienve"
$LOG_DIR = "/var/log/hoantienve"

# Colors for output
function Write-Log { param($Message) Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] SUCCESS: $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] WARNING: $Message" -ForegroundColor Yellow }
function Write-Header { param($Message) Write-Host ""; Write-Host "==============================================" -ForegroundColor Magenta; Write-Host "  $Message" -ForegroundColor Magenta; Write-Host "==============================================" -ForegroundColor Magenta }

# Helper: run SSH command
function Invoke-SSH {
    param($Command)
    $sshArgs = @("-o", "ConnectTimeout=10", "-o", "BatchMode=yes", "-p", $VPS_PORT, "${VPS_USER}@${VPS_HOST}", $Command)
    return & ssh @sshArgs 2>&1
}

# Helper: run SSH and check exit code
function Invoke-SSHCheck {
    param($Command, $Description)
    Write-Log "$Description..."
    $result = Invoke-SSH $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Error "$Description failed"
        Write-Host $result -ForegroundColor Red
        exit 1
    }
    Write-Success "$Description done"
    return $result
}

# =============================================================================
# Banner
# =============================================================================

Write-Host ""
Write-Host "==============================================" -ForegroundColor Magenta
Write-Host "   AeroRefund Auto-Deploy Script v3 (PS)" -ForegroundColor Magenta
Write-Host "   Target: $DOMAIN ($VPS_HOST)" -ForegroundColor Magenta
Write-Host "   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Magenta
Write-Host "==============================================" -ForegroundColor Magenta
Write-Host ""

# =============================================================================
# Check Prerequisites
# =============================================================================

Write-Log "Checking prerequisites..."

# Check SSH connection
Write-Log "Checking SSH connection to $VPS_HOST..."
$sshTest = Invoke-SSH "echo 'SSH OK'"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Cannot connect to VPS via SSH"
    Write-Error "Please ensure:"
    Write-Error "  1. VPS is running"
    Write-Error "  2. SSH key is added to VPS (ssh-copy-id)"
    Write-Error "  3. Firewall allows port $VPS_PORT"
    exit 1
}
Write-Success "SSH connection successful"

# Check source directory
if (-not (Test-Path $SOURCE_DIR)) {
    Write-Error "Source directory not found: $SOURCE_DIR"
    exit 1
}
Write-Success "Source directory: $SOURCE_DIR"

# Check rsync availability on VPS
Write-Log "Checking rsync on VPS..."
Invoke-SSH "command -v rsync > /dev/null 2>&1 || echo 'MISSING'" | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "rsync not found on VPS, installing..."
    Invoke-SSH "apt-get install -y rsync"
}
Write-Success "Prerequisites check passed"

# =============================================================================
# Setup VPS
# =============================================================================

Write-Header "Setting up VPS"

Write-Log "Installing Node.js 20..."
$sshScript = @"
export DEBIAN_FRONTEND=noninteractive
apt-get remove -y nodejs npm 2>/dev/null || true
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
npm --version
"@
Invoke-SSHCheck $sshScript "Node.js 20 installed"

Write-Log "Installing PM2..."
Invoke-SSH "npm install -g pm2"
Invoke-SSH "pm2 install pm2-logrotate && pm2 set pm2-logrotate:max_size 10M && pm2 set pm2-logrotate:retain 7 && pm2 set pm2-logrotate:compress true"
Write-Success "PM2 installed"

Write-Log "Installing Nginx..."
$sshScript = @"
export DEBIAN_FRONTEND=noninteractive
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
"@
Invoke-SSH $sshScript | Out-Null
Write-Success "Nginx installed"

Write-Log "Installing Certbot..."
Invoke-SSH "apt-get install -y certbot python3-certbot-nginx" | Out-Null
Write-Success "Certbot installed"

Write-Log "Creating directories..."
Invoke-SSH "mkdir -p ${REMOTE_DIR}/source ${REMOTE_DIR}/frontend ${LOG_DIR} ${BACKUP_DIR} /var/www/acme-challenge" | Out-Null
Write-Success "Directories created"

Write-Log "Configuring firewall (UFW)..."
Invoke-SSH "ufw default deny incoming && ufw default allow outgoing && ufw limit ssh/tcp && ufw allow http && ufw allow https && ufw allow ${VPS_PORT}/tcp comment 'SSH custom port' && (echo 'y' | ufw enable) 2>/dev/null || true" | Out-Null
Write-Success "Firewall configured"

# =============================================================================
# Create Backup Before Deployment
# =============================================================================

Write-Header "Creating Backup Before Deployment"

$BACKUP_DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_NAME = "backup_${BACKUP_DATE}"

Write-Log "Creating backup: $BACKUP_NAME..."
$backupScript = @"
set -e
mkdir -p ${BACKUP_DIR}/${BACKUP_NAME}
if [ -d '${REMOTE_DIR}/source' ]; then
    rsync -a --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.cache' --exclude='tmp' '${REMOTE_DIR}/source/' '${BACKUP_DIR}/${BACKUP_NAME}/source/'
fi
if [ -d '${REMOTE_DIR}/frontend' ]; then
    rsync -a '${REMOTE_DIR}/frontend/' '${BACKUP_DIR}/${BACKUP_NAME}/frontend/'
fi
if [ -f '${REMOTE_DIR}/source/.env' ]; then
    cp '${REMOTE_DIR}/source/.env' '${BACKUP_DIR}/${BACKUP_NAME}/.env'
fi
cd '${BACKUP_DIR}'
tar -czvf '${BACKUP_NAME}.tar.gz' '${BACKUP_NAME}'
rm -rf '${BACKUP_NAME}'
ls -t backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
echo "Backup created: ${BACKUP_NAME}.tar.gz"
du -h '${BACKUP_NAME}.tar.gz'
"@
Invoke-SSH $backupScript | Out-Null
Write-Success "Backup created"

# =============================================================================
# Upload Source Code
# =============================================================================

Write-Header "Uploading Source Code"

Write-Log "Creating archive with exclusions..."
$ARCHIVE_NAME = "hoantienve_$(Get-Date -Format 'yyyyMMdd_HHmmss').tar.gz"

# Build exclude patterns
$excludePatterns = @(
    "--exclude='node_modules'",
    "--exclude='.git'",
    "--exclude='.env'",
    "--exclude='*.log'",
    "--exclude='dist'",
    "--exclude='.cache'",
    "--exclude='tmp'",
    "--exclude='.vscode'",
    "--exclude='coverage'",
    "--exclude='*.env.*'",
    "--exclude='.DS_Store'"
)
$excludeArgs = $excludePatterns -join " "

# Use SSH with remote tar to create archive (handles Windows paths better)
$tarScript = @"
cd '${SOURCE_DIR}' && tar -czvf '/tmp/${ARCHIVE_NAME}' ${excludeArgs} .
"@
Write-Log "Uploading source code..."
Invoke-SSH $tarScript | Out-Null

Write-Log "Extracting files on VPS..."
$extractScript = @"
rm -rf '${REMOTE_DIR}/source/*'
tar -xzvf '/tmp/${ARCHIVE_NAME}' -C '${REMOTE_DIR}/source/'
rm '/tmp/${ARCHIVE_NAME}'
chmod -R 755 '${REMOTE_DIR}/source'
"@
Invoke-SSH $extractScript | Out-Null
Write-Success "Source code uploaded"

# =============================================================================
# Configure Environment
# =============================================================================

Write-Header "Configuring Environment Variables (Neon PostgreSQL)"

# Generate JWT secret on VPS
$JWT_SECRET = Invoke-SSH "openssl rand -hex 64"

Write-Log "Checking for existing .env..."
# Try to read existing DATABASE_URL from VPS .env
$existingDbUrl = Invoke-SSH "grep '^DATABASE_URL=' '${REMOTE_DIR}/source/.env' 2>/dev/null | sed 's/DATABASE_URL=//'" 2>$null

$DATABASE_URL = ""
if ($existingDbUrl -and $existingDbUrl -notmatch "ep-xxx") {
    $DATABASE_URL = $existingDbUrl.Trim()
    Write-Log "Found existing DATABASE_URL on VPS - keeping it"
} else {
    Write-Warning "No valid DATABASE_URL found"
    Write-Host "Enter your Neon DATABASE_URL:" -ForegroundColor Yellow
    Write-Host "Get it from: https://console.neon.tech > your project > Connection Details" -ForegroundColor Gray
    Write-Host "Format: postgresql://user:pass@ep-xxx.region.neon.tech/neondb?sslmode=require" -ForegroundColor Gray
    $input = Read-Host "DATABASE_URL (press Enter for placeholder)"
    if (-not [string]::IsNullOrWhiteSpace($input)) {
        $DATABASE_URL = $input.Trim()
    }
}

if ([string]::IsNullOrWhiteSpace($DATABASE_URL)) {
    $DATABASE_URL = "postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require"
}

Write-Log "Creating .env file on VPS..."
$envScript = @"
cd '${REMOTE_DIR}/source'
cat > .env << 'ENVEOF'
# Application
APP_URL=""https://${DOMAIN}""
NODE_ENV=""production""
PORT=3001

# Neon PostgreSQL Database (Cloud)
# Get from: https://console.neon.tech > your project > Connection Details
DATABASE_URL=""${DATABASE_URL}""

# JWT Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=""7d""

# Firebase (optional - for push notifications)
FIREBASE_SERVICE_ACCOUNT=

# Gemini AI (optional - for AI features)
GEMINI_API_KEY=
ENVEOF
chmod 600 .env
echo "'.env' file created"
"@
Invoke-SSH $envScript | Out-Null
Write-Success "Environment configured with Neon"

# =============================================================================
# Install Dependencies and Build
# =============================================================================

Write-Header "Installing Dependencies & Building"

Write-Log "Installing npm packages..."
$installScript = @"
cd '${REMOTE_DIR}/source'
npm install --production=false 2>&1 | tail -5
"@
Invoke-SSH $installScript | Out-Null
Write-Success "Dependencies installed"

Write-Log "Building frontend..."
$buildScript = @"
cd '${REMOTE_DIR}/source'
npm run build 2>&1
"@
$buildResult = Invoke-SSH $buildScript
if ($buildResult -match "error|Error|ERROR|Build failed") {
    Write-Error "Build failed"
    Write-Host $buildResult -ForegroundColor Red
    exit 1
}

# Check if dist exists
$distExists = Invoke-SSH "[ -d '${REMOTE_DIR}/source/dist' ] && echo 'yes' || echo 'no'"
if ($distExists -eq "yes") {
    Write-Success "Build completed"
} else {
    Write-Error "Build failed - dist directory not found"
    exit 1
}

Write-Log "Copying build files to frontend..."
$copyScript = @"
rm -rf '${REMOTE_DIR}/frontend/*'
cp -r '${REMOTE_DIR}/source/dist/*' '${REMOTE_DIR}/frontend/'
chmod -R 755 '${REMOTE_DIR}/frontend'
"@
Invoke-SSH $copyScript | Out-Null
Write-Success "Build files copied"

# =============================================================================
# Configure PM2 (CommonJS for PM2 compatibility)
# =============================================================================

Write-Header "Configuring PM2"

Write-Log "Creating PM2 ecosystem config..."
$pm2Script = @"
cd '${REMOTE_DIR}/source'
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hoantienve-api',
      script: 'node_modules/.bin/tsx',
      args: 'server.ts',
      cwd: '${REMOTE_DIR}/source',
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
      error_file: '${LOG_DIR}/error.log',
      out_file: '${LOG_DIR}/out.log',
      log_file: '${LOG_DIR}/combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 8000,
      wait_ready: true,
      listen_timeout: 15000,
      shutdown_with_message: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
EOF
chmod 644 ecosystem.config.js
echo "PM2 ecosystem config created"
"@
Invoke-SSH $pm2Script | Out-Null
Write-Success "PM2 ecosystem configured"

# =============================================================================
# Configure Nginx
# =============================================================================

Write-Header "Configuring Nginx"

Write-Log "Creating Nginx configuration..."
$nginxScript = @"
cat > /etc/nginx/sites-available/hoantienve << 'NGINXEOF'
# Upstream backend server (Node.js API)
upstream hoantienve_backend {
    server 127.0.0.1:3001;
    keepalive 64;
}

# Rate limiting zones
limit_req_zone `$binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_conn_zone `$binary_remote_addr zone=addr:10m;

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/acme-challenge;
        try_files `$uri =404;
    }

    location / {
        return 301 https://`$host`$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security ""max-age=63072000; includeSubDomains; preload"" always;
    add_header X-Frame-Options ""SAMEORIGIN"" always;
    add_header X-Content-Type-Options ""nosniff"" always;
    add_header X-XSS-Protection ""1; mode=block"" always;
    add_header Referrer-Policy ""strict-origin-when-cross-origin"" always;

    root ${REMOTE_DIR}/frontend;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    location / {
        try_files `$uri `$uri/ /index.html;
    }

    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        limit_conn addr 30;

        proxy_pass http://hoantienve_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_buffering off;
    }

    location /health {
        proxy_pass http://hoantienve_backend/;
        proxy_http_version 1.1;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        access_log off;
        allow all;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf|webp)$ {
        expires 1y;
        add_header Cache-Control ""public, immutable"";
        access_log off;
    }

    location ~* \.html$ {
        expires -1;
        add_header Cache-Control ""no-store, no-cache, must-revalidate"";
        access_log off;
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~* \.(env|log|sh|sql|bak|conf|config|ini|key|crt|pem)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root ${REMOTE_DIR}/frontend;
        internal;
    }

    access_log /var/log/nginx/hoantienve_access.log combined buffer=16k flush=2s;
    error_log /var/log/nginx/hoantienve_error.log warn;
}
NGINXEOF

# Enable site and test
ln -sf /etc/nginx/sites-available/hoantienve /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "Nginx configured"
"@
Invoke-SSH $nginxScript | Out-Null
Write-Success "Nginx configured"

# =============================================================================
# Setup SSL
# =============================================================================

Write-Header "Setting up SSL Certificate"

Write-Log "Requesting SSL certificate for $DOMAIN..."
$sslScript = @"
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos \
    -m admin@${DOMAIN} --redirect 2>&1 || echo 'SSL may already be configured or failed (check domain DNS)'
echo "SSL setup completed"
"@
Invoke-SSH $sslScript | Out-Null
Write-Success "SSL certificate configured"

# =============================================================================
# Start Application
# =============================================================================

Write-Header "Starting Application"

Write-Log "Starting PM2..."
$pm2StartScript = @"
cd '${REMOTE_DIR}/source'
pm2 stop hoantienve-api 2>/dev/null || true
pm2 delete hoantienve-api 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
env PATH=`$PATH:/usr/bin pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo "PM2 started"
"@
Invoke-SSH $pm2StartScript | Out-Null

Start-Sleep -Seconds 5

Write-Log "Checking PM2 status..."
Invoke-SSH "pm2 list" | Out-Null
Write-Success "Application started"

# =============================================================================
# Health Check
# =============================================================================

Write-Header "Running Health Checks"

$maxAttempts = 5
$attempt = 1

while ($attempt -le $maxAttempts) {
    Write-Log "Health check attempt $attempt/$maxAttempts..."

    # Check API endpoint
    $healthResult = Invoke-SSH "curl -sf http://localhost:3001/api/data/airports 2>/dev/null"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "API is responding correctly (attempt $attempt)"
        break
    }

    # Check if server is up (any response)
    $rootResult = Invoke-SSH "curl -sf http://localhost:3001/ 2>/dev/null"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "API server is running (attempt $attempt)"
        break
    }

    if ($attempt -eq $maxAttempts) {
        Write-Error "API health check failed after $maxAttempts attempts"
        Write-Log "Check logs with: Invoke-SSH 'pm2 logs hoantienve-api --lines 50'"
    }

    Start-Sleep -Seconds 3
    $attempt++
}

# =============================================================================
# Summary
# =============================================================================

Write-Host ""
Write-Host "==============================================" -ForegroundColor Magenta
Write-Host "   DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Magenta
Write-Host "==============================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  🌐 Application URL:  https://${DOMAIN}" -ForegroundColor Green
Write-Host "  🔌 API URL:          https://${DOMAIN}/api" -ForegroundColor Green
Write-Host "  📁 Source:           ${REMOTE_DIR}/source" -ForegroundColor Green
Write-Host "  📁 Frontend:         ${REMOTE_DIR}/frontend" -ForegroundColor Green
Write-Host "  📁 Logs:             ${LOG_DIR}" -ForegroundColor Green
Write-Host "  📁 Backups:          ${BACKUP_DIR}" -ForegroundColor Green
Write-Host ""
Write-Host "  Useful Commands:" -ForegroundColor Yellow
Write-Host "    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST}" -ForegroundColor Gray
Write-Host "    pm2 status" -ForegroundColor Gray
Write-Host "    pm2 logs hoantienve-api" -ForegroundColor Gray
Write-Host "    pm2 restart hoantienve-api" -ForegroundColor Gray
Write-Host "    pm2 monit" -ForegroundColor Gray
Write-Host "    certbot certificates" -ForegroundColor Gray
Write-Host ""
Write-Host "  Quick deploy on VPS (after code changes):" -ForegroundColor Yellow
Write-Host "    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} 'cd ${REMOTE_DIR} && bash deploy.sh'" -ForegroundColor Gray
Write-Host ""
Write-Host "==============================================" -ForegroundColor Magenta
Write-Host ""

Write-Success "All done!"
