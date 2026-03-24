#!/bin/bash
# =============================================================================
# AeroRefund (HoanTienVe365) - Auto Deploy Script for VPS
# =============================================================================
# Server: 187.127.107.99
# Domain: hoanvemaybay.com
# Run this script ON LOCAL MACHINE to deploy to VPS
# =============================================================================
# Features:
#   - Full VPS setup (Node.js, Nginx, PM2, Firewall, SSL)
#   - Automated deployment from local source
#   - Database backup before deploy
#   - Health check after deploy
#   - Rollback capability
# =============================================================================

set -e

# Configuration
VPS_HOST="187.127.107.99"
VPS_USER="root"
VPS_PORT="22"
DOMAIN="hoanvemaybay.com"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_DIR="/var/www/hoantienve"
BACKUP_DIR="/var/backups/hoantienve"
LOG_DIR="/var/log/hoantienve"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# =============================================================================
# Helper functions
# =============================================================================

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

log_header() {
    echo ""
    echo -e "${CYAN}==============================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}==============================================${NC}"
}

# =============================================================================
# Check prerequisites
# =============================================================================

check_prerequisites() {
    log_header "Checking Prerequisites"

    # Check SSH connection
    log "Checking SSH connection to $VPS_HOST..."
    if ssh -o ConnectTimeout=10 -o BatchMode=yes -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} "echo 'SSH OK'" 2>/dev/null; then
        log_success "SSH connection successful"
    else
        log_error "Cannot connect to VPS via SSH"
        log "Please ensure:"
        log "  1. VPS is running"
        log "  2. SSH credentials are correct"
        log "  3. Firewall allows port $VPS_PORT"
        exit 1
    fi

    # Check if source directory exists
    if [ ! -d "$SOURCE_DIR" ]; then
        log_error "Source directory not found: $SOURCE_DIR"
        exit 1
    fi

    # Check rsync (for efficient file transfer)
    if ! command -v rsync &> /dev/null; then
        log_warning "rsync not found. Installing..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get install -y rsync
        elif command -v brew &> /dev/null; then
            brew install rsync
        fi
    fi

    log_success "Prerequisites check passed"
}

# =============================================================================
# Setup VPS
# =============================================================================

setup_vps() {
    log_header "Setting up VPS (Initial Configuration)"

    log "Running VPS setup script..."
    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
        export DEBIAN_FRONTEND=noninteractive

        # Update system
        apt update && apt upgrade -y

        # Install essential packages
        apt install -y curl wget git unzip sudo ufw fail2ban rsync

        # Remove old Node.js
        apt-get remove -y nodejs npm 2>/dev/null || true

        # Install NodeSource Node.js 20.x
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs

        # Verify
        echo "Node.js $(node --version) installed"
        echo "npm $(npm --version) installed"

        # Install PM2 globally
        npm install -g pm2
        pm2 install pm2-logrotate
        pm2 set pm2-logrotate:max_size 10M
        pm2 set pm2-logrotate:retain 7
        pm2 set pm2-logrotate:compress true

        # Install Nginx
        apt-get install -y nginx
        systemctl start nginx
        systemctl enable nginx

        # Install Certbot
        apt-get install -y certbot python3-certbot-nginx

        # Configure Firewall (UFW)
        ufw default deny incoming
        ufw default allow outgoing
        ufw limit ssh/tcp
        ufw allow http
        ufw allow https
        ufw allow 3001/tcp
        echo "y" | ufw enable 2>/dev/null || true

        # Create directories
        mkdir -p /var/www/hoantienve/source
        mkdir -p /var/www/hoantienve/frontend
        mkdir -p /var/log/hoantienve
        mkdir -p /var/backups/hoantienve
        mkdir -p /var/www/acme-challenge

        # Setup Fail2Ban
        cat > /etc/fail2ban/jail.local << 'FAIL2BAN'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
maxretry = 3
bantime = 7200
FAIL2BAN

        systemctl enable fail2ban
        systemctl start fail2ban

        echo "VPS setup completed successfully"
ENDSSH

    log_success "VPS initial setup completed"
}

# =============================================================================
# Create backup before deployment
# =============================================================================

create_backup() {
    log_header "Creating Backup Before Deployment"

    BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

    log "Creating backup..."
    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << ENDSSH
        set -e
        BACKUP_NAME="backup_${BACKUP_DATE}"
        mkdir -p ${BACKUP_DIR}/\${BACKUP_NAME}

        # Backup source
        if [ -d "${REMOTE_DIR}/source" ]; then
            rsync -a --exclude='node_modules' --exclude='.git' --exclude='dist' \
                ${REMOTE_DIR}/source/ ${BACKUP_DIR}/\${BACKUP_NAME}/source/
        fi

        # Backup frontend
        if [ -d "${REMOTE_DIR}/frontend" ]; then
            rsync -a ${REMOTE_DIR}/frontend/ ${BACKUP_DIR}/\${BACKUP_NAME}/frontend/
        fi

        # Backup .env
        if [ -f "${REMOTE_DIR}/source/.env" ]; then
            cp ${REMOTE_DIR}/source/.env ${BACKUP_DIR}/\${BACKUP_NAME}/.env
        fi

        # Compress
        cd ${BACKUP_DIR}
        tar -czvf "\${BACKUP_NAME}.tar.gz" "\${BACKUP_NAME}"
        rm -rf "\${BACKUP_NAME}"

        # Keep only last 5 backups
        cd ${BACKUP_DIR}
        ls -t backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

        echo "Backup created: \${BACKUP_NAME}.tar.gz"
        du -h "\${BACKUP_NAME}.tar.gz"
ENDSSH

    log_success "Backup created"
}

# =============================================================================
# Upload source code
# =============================================================================

upload_source() {
    log_header "Uploading Source Code"

    log "Preparing files for upload..."

    # Create temporary archive
    cd "$SOURCE_DIR"
    ARCHIVE_NAME="hoantienve_deploy.tar.gz"

    # Create archive with exclusions
    tar -czvf "/tmp/${ARCHIVE_NAME}" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='.env' \
        --exclude='*.log' \
        --exclude='dist' \
        --exclude='.cache' \
        --exclude='tmp' \
        --exclude='.vscode' \
        --exclude='coverage' \
        --exclude='*.env.*' \
        --exclude='.DS_Store' \
        .

    log "Uploading archive to VPS..."
    scp -o ConnectTimeout=60 -P ${VPS_PORT} "/tmp/${ARCHIVE_NAME}" ${VPS_USER}@${VPS_HOST}:/tmp/

    log "Extracting files..."
    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << ENDSSH
        set -e
        rm -rf ${REMOTE_DIR}/source/*
        tar -xzvf /tmp/${ARCHIVE_NAME} -C ${REMOTE_DIR}/source/
        rm /tmp/${ARCHIVE_NAME}
        chmod -R 755 ${REMOTE_DIR}/source
ENDSSH

    # Cleanup local archive
    rm -f "/tmp/${ARCHIVE_NAME}"

    log_success "Source code uploaded"
}

# =============================================================================
# Configure environment (Neon PostgreSQL)
# =============================================================================

configure_env() {
    log_header "Configuring Environment Variables"

    # Generate JWT secret
    JWT_SECRET=$(openssl rand -hex 64)

    log "Creating .env file on VPS..."
    log_warning "Using Neon PostgreSQL cloud database"
    log "Get Neon connection string from: https://console.neon.tech"

    read -p "Enter Neon DATABASE_URL (press Enter to keep existing): " NEON_DATABASE_URL

    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << ENDSSH
        set -e
        cd ${REMOTE_DIR}/source

        # Check if .env exists and user wants to keep it
        if [ -f ".env" ] && [ -z "\$NEON_DATABASE_URL" ]; then
            echo "Keeping existing .env file"
        else
            # Escape DOMAIN for use inside heredoc
            ESCAPED_DOMAIN="${DOMAIN}"
            cat > .env << ENVEOF
# Application
APP_URL="https://\${ESCAPED_DOMAIN}"
NODE_ENV="production"
PORT=3001

# Neon PostgreSQL Database (Cloud)
# Get from: https://console.neon.tech > your project > Connection Details
# Format: postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require
DATABASE_URL="\${NEON_DATABASE_URL:-postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require}"

# JWT Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN="7d"

# Firebase (optional - for push notifications)
FIREBASE_SERVICE_ACCOUNT=

# Gemini AI (optional - for AI features)
GEMINI_API_KEY=
ENVEOF
            chmod 600 .env
            echo ".env file created"
        fi
ENDSSH

    log_success "Environment configured"
}

# =============================================================================
# Install dependencies and build
# =============================================================================

install_and_build() {
    log_header "Installing Dependencies & Building"

    log "Installing npm packages..."
    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
        cd ${REMOTE_DIR}/source
        npm install --production=false
ENDSSH
    log_success "Dependencies installed"

    log "Building frontend..."
    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
        cd ${REMOTE_DIR}/source
        npm run build
ENDSSH

    if ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} "[ -d ${REMOTE_DIR}/source/dist ]"; then
        log_success "Build completed"
    else
        log_error "Build failed - dist directory not found"
        exit 1
    fi

    log "Copying build files..."
    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << ENDSSH
        rm -rf ${REMOTE_DIR}/frontend/*
        cp -r ${REMOTE_DIR}/source/dist/* ${REMOTE_DIR}/frontend/
        chmod -R 755 ${REMOTE_DIR}/frontend
ENDSSH
    log_success "Build files copied to frontend directory"
}

# =============================================================================
# Configure PM2
# =============================================================================

configure_pm2() {
    log_header "Configuring PM2"

    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << ENDSSH
        set -e
        cd ${REMOTE_DIR}/source

        # Create PM2 ecosystem config (CommonJS for PM2 compatibility)
        cat > ecosystem.config.js << 'PM2EOF'
// PM2 ecosystem configuration for AeroRefund (HoanTienVe365)
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
PM2EOF
        chmod 644 ecosystem.config.js
        echo "PM2 ecosystem config created"
ENDSSH

    log_success "PM2 ecosystem configured"
}

# =============================================================================
# Configure Nginx
# =============================================================================

configure_nginx() {
    log_header "Configuring Nginx"

    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
        set -e

        # Create rate limiting zones in main nginx.conf
        if ! grep -q "limit_req_zone" /etc/nginx/nginx.conf; then
            sed -i '/http {/a\
    # Rate limiting\
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;\
    limit_conn_zone $binary_remote_addr zone=addr:10m;' /etc/nginx/nginx.conf
        fi

        # Create Nginx configuration
        cat > /etc/nginx/sites-available/hoantienve << 'NGINXEOF'
# Upstream backend
upstream hoantienve_backend {
    server 127.0.0.1:3001;
    keepalive 64;
}

# HTTP server
server {
    listen 80;
    listen [::]:80;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;

    # ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/acme-challenge;
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;

    # SSL
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/YOUR_DOMAIN/chain.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 1.1.1.1 valid=300s;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    root /var/www/hoantienve/frontend;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # Frontend (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
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

    # Health check
    location /health {
        proxy_pass http://hoantienve_backend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Deny hidden files
    location ~ /\. {
        deny all;
        access_log off;
    }

    # Deny sensitive files
    location ~* \.(env|log|sh|sql|bak|conf|key|crt|pem)$ {
        deny all;
        access_log off;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /var/www/hoantienve/frontend;
        internal;
    }

    access_log /var/log/nginx/hoantienve_access.log combined buffer=16k flush=2s;
    error_log /var/log/nginx/hoantienve_error.log warn;
}
NGINXEOF

        # Replace YOUR_DOMAIN with actual domain
        sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" /etc/nginx/sites-available/hoantienve

        # Enable site
        ln -sf /etc/nginx/sites-available/hoantienve /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default

        # Test and reload
        nginx -t && systemctl reload nginx
        echo "Nginx configured"
ENDSSH

    log_success "Nginx configured"
}

# =============================================================================
# Setup SSL
# =============================================================================

setup_ssl() {
    log_header "Setting up SSL Certificate"

    log "Requesting SSL certificate for $DOMAIN..."
    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << ENDSSH
        set -e
        certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos \
            -m admin@${DOMAIN} --redirect || echo "SSL may already be configured or failed"
        echo "SSL setup completed"
ENDSSH

    log_success "SSL certificate configured"
}

# =============================================================================
# Start application
# =============================================================================

start_app() {
    log_header "Starting Application"

    log "Starting PM2..."
    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
        set -e
        cd ${REMOTE_DIR}/source

        # Stop existing process
        pm2 stop hoantienve-api 2>/dev/null || true
        pm2 delete hoantienve-api 2>/dev/null || true

        # Start with new ecosystem config
        pm2 start ecosystem.config.js --env production

        # Wait for app to start
        sleep 5

        # Save PM2 state
        pm2 save

        # Setup startup script
        env PATH=\$PATH:/usr/bin pm2 startup systemd -u root --hp /root || true
ENDSSH

    sleep 3

    log "Checking PM2 status..."
    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} "pm2 list"

    log_success "Application started"
}

# =============================================================================
# Health check
# =============================================================================

health_check() {
    log_header "Running Health Checks"

    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts..."

        # Check HTTPS frontend
        if ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} "curl -sfk https://${DOMAIN} --resolve ${DOMAIN}:443:127.0.0.1" > /dev/null 2>&1; then
            log_success "Frontend is accessible via HTTPS"
        else
            log_warning "HTTPS frontend check failed (trying HTTP)..."
            if ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} "curl -sf http://localhost --resolve ${DOMAIN}:80:127.0.0.1" > /dev/null 2>&1; then
                log_success "Frontend is accessible via HTTP"
            fi
        fi

        # Check API
        if ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} "curl -sf http://localhost:3001/api/data/airports 2>/dev/null" > /dev/null 2>&1; then
            log_success "API is responding correctly"
            return 0
        fi

        sleep 3
        attempt=$((attempt + 1))
    done

    log_error "API health check failed after $max_attempts attempts"
    log "Check logs with: ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs hoantienve-api'"
    return 1
}

# =============================================================================
# Rollback
# =============================================================================

rollback() {
    log_header "Rolling Back Deployment"

    log "Finding latest backup..."
    LATEST_BACKUP=$(ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} "ls -t ${BACKUP_DIR}/backup_*.tar.gz 2>/dev/null | head -1")

    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup found!"
        exit 1
    fi

    log "Rolling back to: $LATEST_BACKUP"

    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} << ENDSSH
        set -e

        # Stop app
        pm2 stop hoantienve-api 2>/dev/null || true

        # Extract backup
        cd ${BACKUP_DIR}
        tar -xzvf "${LATEST_BACKUP}"

        # Restore files
        BACKUP_NAME=\$(basename "${LATEST_BACKUP}" .tar.gz)
        rm -rf ${REMOTE_DIR}/source/*
        rsync -a ${BACKUP_DIR}/\${BACKUP_NAME}/source/ ${REMOTE_DIR}/source/
        rm -rf ${REMOTE_DIR}/frontend/*
        rsync -a ${BACKUP_DIR}/\${BACKUP_NAME}/frontend/ ${REMOTE_DIR}/frontend/

        # Cleanup
        rm -rf ${BACKUP_DIR}/\${BACKUP_NAME}

        # Restart app
        cd ${REMOTE_DIR}/source
        pm2 start ecosystem.config.js --env production
        pm2 save
ENDSSH

    log_success "Rollback completed"
}

# =============================================================================
# Show summary
# =============================================================================

show_summary() {
    log_header "Deployment Summary"

    echo ""
    echo "=============================================="
    echo "   🚀 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo "=============================================="
    echo ""
    echo "  🌐 Application URL:  https://${DOMAIN}"
    echo "  📁 Source:           ${REMOTE_DIR}/source"
    echo "  📁 Frontend:         ${REMOTE_DIR}/frontend"
    echo "  📁 Logs:             ${LOG_DIR}"
    echo "  📁 Backups:          ${BACKUP_DIR}"
    echo ""
    echo "=============================================="
    echo ""
    echo "  Useful Commands:"
    echo "    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST}"
    echo "    pm2 status"
    echo "    pm2 logs hoantienve-api"
    echo "    pm2 restart hoantienve-api"
    echo "    pm2 monit"
    echo ""
    echo "  SSL Status:"
    echo "    certbot certificates"
    echo "    certbot --dry-run"
    echo ""
    echo "  Firewall:"
    echo "    ufw status"
    echo "    fail2ban-client status"
    echo ""
    echo "  Backup:"
    echo "    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} '/usr/local/bin/backup-hoantienve.sh'"
    echo ""
    echo "  Quick deploy (on VPS, after code changes):"
    echo "    ssh -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST} 'cd ${REMOTE_DIR} && bash deploy.sh'"
    echo ""
    echo "=============================================="
    echo ""
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    echo "=============================================="
    echo "   AeroRefund Auto-Deploy Script v3"
    echo "   Target: ${DOMAIN} (${VPS_HOST})"
    echo "   $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=============================================="
    echo ""

    # Parse arguments
    SKIP_SETUP=${1:-false}
    SKIP_BACKUP=${2:-false}

    check_prerequisites

    if [ "$SKIP_SETUP" != "skip-setup" ]; then
        setup_vps
    else
        log "Skipping VPS setup (--skip-setup)"
    fi

    if [ "$SKIP_BACKUP" != "skip-backup" ]; then
        create_backup
    else
        log_warning "Skipping backup (--skip-backup) - NOT RECOMMENDED!"
    fi

    upload_source
    configure_env
    install_and_build
    configure_pm2
    configure_nginx
    setup_ssl
    start_app
    health_check
    show_summary

    log_success "Deployment completed!"
}

# =============================================================================
# Argument parsing
# =============================================================================

case "${1:-}" in
    --help|-h)
        echo "Usage: ./auto_deploy.sh [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --skip-setup      Skip VPS initial setup"
        echo "  --skip-backup     Skip backup (NOT RECOMMENDED)"
        echo "  --rollback        Rollback to previous backup"
        echo "  --help, -h        Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./auto_deploy.sh                    # Full deployment"
        echo "  ./auto_deploy.sh --skip-setup      # Skip VPS setup"
        echo "  ./auto_deploy.sh --rollback        # Rollback"
        exit 0
        ;;
    --rollback)
        check_prerequisites
        rollback
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
