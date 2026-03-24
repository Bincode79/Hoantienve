#!/bin/bash
# =============================================================================
# AeroRefund (HoanTienVe365) - Production Deploy Script (on-VPS)
# =============================================================================
# Features:
#   - Git pull / source update
#   - Automated backup before deploy
#   - npm install + frontend build
#   - PM2 restart + health check
#   - Rollback capability
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
APP_NAME="hoantienve-api"
# Detect source directory (works from both /var/www/hoantienve/source and /var/www/hoantienve)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${SCRIPT_DIR}/source"
FRONTEND_DIR="/var/www/hoantienve/frontend"
LOG_DIR="/var/log/hoantienve"
BACKUP_DIR="/var/backups/hoantienve"
DEPLOY_LOG="$LOG_DIR/deploy.log"
DOMAIN="hoanvemaybay.com"

# =============================================================================
# Helper functions
# =============================================================================

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$DEPLOY_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1" >> "$DEPLOY_LOG"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌${NC} $1" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1" >> "$DEPLOY_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ $1" >> "$DEPLOY_LOG"
}

log_header() {
    echo ""
    echo -e "${CYAN}==============================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}==============================================${NC}"
}

# =============================================================================
# Pre-deployment checks
# =============================================================================

pre_deploy_checks() {
    log_header "Pre-Deployment Checks"

    if [ "$(id -un)" = "root" ]; then
        log_warning "Running as root. Consider using www-hoantienve user."
    fi

    if [ ! -d "$APP_DIR" ]; then
        log_error "Application directory $APP_DIR does not exist!"
        exit 1
    fi

    if [ ! -f "$APP_DIR/.env" ]; then
        log_error ".env file not found at $APP_DIR/.env"
        log_error "Please create .env before deploying."
        exit 1
    fi

    if ! systemctl is-active --quiet nginx 2>/dev/null; then
        log_warning "Nginx is not running. Starting nginx..."
        sudo systemctl start nginx || log_warning "Could not start nginx"
    fi

    log_success "Pre-deployment checks passed"
}

# =============================================================================
# Create backup
# =============================================================================

create_backup() {
    log_header "Creating Backup"

    BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
    mkdir -p "$BACKUP_DIR"

    log "Creating backup: $BACKUP_DATE"

    # Backup source (excluding node_modules, dist)
    rsync -a --exclude='node_modules' --exclude='.git' --exclude='dist' \
        --exclude='.cache' --exclude='tmp' \
        "$APP_DIR/" "$BACKUP_DIR/source_${BACKUP_DATE}/"

    # Backup frontend
    rsync -a "$FRONTEND_DIR/" "$BACKUP_DIR/frontend_${BACKUP_DATE}/"

    # Backup .env
    cp "$APP_DIR/.env" "$BACKUP_DIR/.env_${BACKUP_DATE}"

    # Compress
    cd "$BACKUP_DIR"
    tar -czvf "backup_${BACKUP_DATE}.tar.gz" "source_${BACKUP_DATE}" "frontend_${BACKUP_DATE}" ".env_${BACKUP_DATE}"
    rm -rf "source_${BACKUP_DATE}" "frontend_${BACKUP_DATE}" ".env_${BACKUP_DATE}"

    # Keep only last 5 backups
    ls -t backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

    BACKUP_SIZE=$(du -h "backup_${BACKUP_DATE}.tar.gz" | cut -f1)
    log_success "Backup created: backup_${BACKUP_DATE}.tar.gz ($BACKUP_SIZE)"
}

# =============================================================================
# Git pull / update source
# =============================================================================

git_pull() {
    log_header "Updating Source Code"

    cd "$APP_DIR"

    if [ ! -d ".git" ]; then
        log_warning "Not a git repository. Skipping git pull."
        return 0
    fi

    git fetch origin
    CURRENT_BRANCH=$(git branch --show-current)
    log "Current branch: $CURRENT_BRANCH"

    if git pull origin "$CURRENT_BRANCH"; then
        log_success "Git pull completed"
    else
        log_error "Git pull failed. Check for uncommitted changes."
        exit 1
    fi
}

# =============================================================================
# Install dependencies
# =============================================================================

install_dependencies() {
    log_header "Installing Dependencies"

    cd "$APP_DIR"

    if ! command -v npm &> /dev/null; then
        log_error "npm not found!"
        exit 1
    fi

    npm install --production=false --prefer-offline 2>&1 | tail -3
    log_success "Dependencies installed"
}

# =============================================================================
# Build frontend
# =============================================================================

build_frontend() {
    log_header "Building Frontend"

    cd "$APP_DIR"

    if ! npm run build; then
        log_error "Frontend build failed"
        exit 1
    fi

    if [ -d "dist" ]; then
        log_success "Frontend build completed"
    else
        log_error "Build failed - dist directory not found"
        exit 1
    fi
}

# =============================================================================
# Copy build files
# =============================================================================

copy_build_files() {
    log_header "Copying Build Files"

    mkdir -p "$FRONTEND_DIR"
    rm -rf "$FRONTEND_DIR"/*
    cp -r "$APP_DIR/dist"/* "$FRONTEND_DIR/"
    chmod -R 755 "$FRONTEND_DIR"

    log_success "Build files copied to $FRONTEND_DIR"
}

# =============================================================================
# Restart PM2
# =============================================================================

restart_pm2() {
    log_header "Restarting PM2"

    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 not found! Please install PM2 first."
        exit 1
    fi

    cd "$APP_DIR"

    pm2 stop "$APP_NAME" 2>/dev/null || true
    pm2 delete "$APP_NAME" 2>/dev/null || true

    # Ensure ecosystem.config.js uses CommonJS format
    if ! grep -q "module.exports" ecosystem.config.js 2>/dev/null; then
        log "Converting ecosystem.config.js to CommonJS..."
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
    fi

    if pm2 start ecosystem.config.js --env production; then
        log "PM2 started"
    else
        log_warning "Using default start..."
        pm2 start tsx --name "$APP_NAME" -- server.ts --env production
    fi

    sleep 5

    if pm2 list | grep -q "$APP_NAME.*online"; then
        log_success "PM2 process restarted successfully"
    else
        log_error "PM2 process is not running properly"
        pm2 logs "$APP_NAME" --lines 30 --nostream
        exit 1
    fi

    pm2 save
}

# =============================================================================
# Reload Nginx
# =============================================================================

reload_nginx() {
    log_header "Reloading Nginx"

    if sudo nginx -t; then
        sudo systemctl reload nginx
        log_success "Nginx reloaded successfully"
    else
        log_error "Nginx configuration test failed"
        exit 1
    fi
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

        # Check frontend
        if curl -sf "http://localhost" > /dev/null 2>&1; then
            log_success "Frontend is accessible"
        else
            log_warning "Frontend check failed (attempt $attempt)"
        fi

        # Check API
        if curl -sf "http://localhost:3001/api/data/airports" > /dev/null 2>&1; then
            log_success "API is responding correctly"
            return 0
        elif curl -sf "http://localhost:3001/" > /dev/null 2>&1; then
            log_success "API server is running"
            return 0
        fi

        if [ $attempt -eq $max_attempts ]; then
            log_error "API health check failed after $max_attempts attempts"
            pm2 logs "$APP_NAME" --lines 20 --nostream
        fi

        sleep 3
        attempt=$((attempt + 1))
    done

    return 1
}

# =============================================================================
# Cleanup
# =============================================================================

cleanup() {
    log_header "Cleanup"

    # Clean PM2 logs
    pm2 flush

    # Clean npm cache
    npm cache clean --force 2>/dev/null || true

    log_success "Cleanup completed"
}

# =============================================================================
# Rollback
# =============================================================================

rollback() {
    log_header "Rolling Back"

    log "Finding latest backup..."
    LATEST=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -1)

    if [ -z "$LATEST" ]; then
        log_error "No backup found!"
        exit 1
    fi

    log "Rollback to: $LATEST"

    pm2 stop "$APP_NAME" 2>/dev/null || true

    cd "$BACKUP_DIR"
    tar -xzvf "$LATEST"

    BACKUP_NAME=$(basename "$LATEST" .tar.gz)

    rsync -a "$BACKUP_NAME/source_"*/* "$APP_DIR/" 2>/dev/null || \
    rsync -a "${BACKUP_NAME}/" "$APP_DIR/" 2>/dev/null || true

    rm -rf "$BACKUP_NAME"

    pm2 start "$APP_DIR/ecosystem.config.js" --env production
    pm2 save

    log_success "Rollback completed"
}

# =============================================================================
# Show summary
# =============================================================================

show_summary() {
    log_header "Deployment Summary"

    echo ""
    echo "=============================================="
    echo "       Deployment Summary"
    echo "=============================================="
    echo ""
    echo "  App:        AeroRefund (HoanTienVe365)"
    echo "  Time:       $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  Directory:  $APP_DIR"
    echo "  Frontend:   $FRONTEND_DIR"
    echo "  Log file:   $DEPLOY_LOG"
    echo ""
    echo "  PM2 Status:"
    pm2 list
    echo ""
    echo "  Nginx Status:"
    sudo systemctl status nginx --no-pager | head -5
    echo ""
    echo "=============================================="
    echo ""
    echo "  🌐 Frontend URL:  https://${DOMAIN}"
    echo "  🔌 API URL:        https://${DOMAIN}/api"
    echo "  📊 PM2 Monitor:    pm2 monit"
    echo "  📝 PM2 Logs:       pm2 logs $APP_NAME"
    echo "  💾 Backup Dir:     $BACKUP_DIR"
    echo ""
    echo "=============================================="
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    echo "=============================================="
    echo "   AeroRefund Deploy Script"
    echo "   $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=============================================="
    echo ""

    SKIP_BACKUP=${1:-false}

    pre_deploy_checks

    if [ "$SKIP_BACKUP" != "skip-backup" ]; then
        create_backup
    fi

    git_pull
    install_dependencies
    build_frontend
    copy_build_files
    restart_pm2
    reload_nginx

    if ! health_check; then
        log_warning "Health check failed - deployment may have issues"
    fi

    cleanup
    show_summary

    log_success "Deployment completed!"
}

# =============================================================================
# Argument parsing
# =============================================================================

case "${1:-}" in
    --help|-h)
        echo "Usage: ./deploy.sh [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --skip-backup    Skip backup (NOT RECOMMENDED)"
        echo "  --rollback       Rollback to previous backup"
        echo "  --help, -h      Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh           # Full deployment"
        echo "  ./deploy.sh skip-backup  # Skip backup"
        echo "  ./deploy.sh --rollback   # Rollback"
        exit 0
        ;;
    --rollback)
        rollback
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
