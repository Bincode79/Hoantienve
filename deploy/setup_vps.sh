#!/bin/bash
# =============================================================================
# AeroRefund (HoanTienVe365) - VPS Initial Setup Script v3
# =============================================================================
# Usage: Run this script ONCE when setting up a new VPS
# Run as: sudo bash setup_vps.sh [domain] [git-repo-url] [branch]
# =============================================================================
#
# Examples:
#   sudo bash setup_vps.sh your-domain.com
#   sudo bash setup_vps.sh your-domain.com https://github.com/user/repo.git main
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
APP_USER="www-hoantienve"
APP_DIR="/var/www/hoantienve"
LOG_DIR="/var/log/hoantienve"
BACKUP_DIR="/var/backups/hoantienve"
USER_HOME="/home/$APP_USER"
DOMAIN="${1:-hoanvemaybay.com}"

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
# Check if running as root
# =============================================================================

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Please run as root: sudo bash setup_vps.sh"
        exit 1
    fi
    log "Running as root ✓"
}

# =============================================================================
# Update system packages
# =============================================================================

update_system() {
    log_header "Updating System Packages"

    export DEBIAN_FRONTEND=noninteractive

    log "Updating package lists..."
    apt-get update -y

    log "Upgrading installed packages..."
    apt-get upgrade -y

    log "Installing essential packages..."
    apt-get install -y \
        curl \
        wget \
        git \
        ufw \
        unzip \
        sudo \
        software-properties-common \
        ca-certificates \
        gnupg \
        lsb-release \
        fail2ban \
        unattended-upgrades \
        apt-listchanges

    log_success "System updated"
}

# =============================================================================
# Auto security updates
# =============================================================================

setup_auto_updates() {
    log_header "Setting up Automatic Security Updates"

    # Enable unattended upgrades
    cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}:${distro_codename}-updates";
};
Unattended-Upgrade::DevRelease "0";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::InstallOnShutdown "false";
Unattended-Upgrade::Mail "root";
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";
EOF

    # Enable auto-updates
    cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

    log_success "Automatic security updates configured"
}

# =============================================================================
# Setup Fail2Ban
# =============================================================================

setup_fail2ban() {
    log_header "Setting up Fail2Ban"

    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = root@localhost
sender = root@hoantienve
action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 3

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-nohome]
enabled = true
port = http,https
filter = nginx-nohome
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

    systemctl enable fail2ban
    systemctl start fail2ban
    log_success "Fail2Ban configured"
}

# =============================================================================
# Install Node.js 20 LTS
# =============================================================================

install_nodejs() {
    log_header "Installing Node.js 20 LTS"

    # Remove old Node.js if exists
    log "Removing old Node.js versions..."
    apt-get remove -y nodejs npm 2>/dev/null || true

    # Install NodeSource Node.js 20.x
    log "Installing NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

    log "Installing Node.js..."
    apt-get install -y nodejs

    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    log_success "Node.js $NODE_VERSION and npm $NPM_VERSION installed"
}

# =============================================================================
# Install PM2 globally
# =============================================================================

install_pm2() {
    log_header "Installing PM2 Process Manager"

    log "Installing PM2 globally..."
    npm install -g pm2

    # Setup PM2 logrotate
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 7
    pm2 set pm2-logrotate:compress true
    pm2 set pm2-logrotate:date_format 'YYYY-MM-DD'

    # Setup PM2 startup (runs after pm2 save on the app)
    log "PM2 startup configured (run 'pm2 save' after starting your app)"

    log_success "PM2 installed"
    log_warning "IMPORTANT: Run 'pm2 save' after starting your app to persist on reboot"
}

# =============================================================================
# Install Nginx
# =============================================================================

install_nginx() {
    log_header "Installing Nginx"

    log "Installing Nginx..."
    apt-get install -y nginx

    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx

    log_success "Nginx installed and enabled"
}

# =============================================================================
# Install Certbot for SSL
# =============================================================================

install_certbot() {
    log_header "Installing Certbot for SSL"

    log "Installing Certbot..."
    apt-get install -y certbot python3-certbot-nginx

    log_success "Certbot installed"
    log "Run 'sudo certbot --nginx -d $DOMAIN' to get SSL certificate"
}

# =============================================================================
# Configure firewall (UFW)
# =============================================================================

configure_firewall() {
    log_header "Configuring Firewall (UFW)"

    # Set default policies
    log "Setting default firewall policies..."
    ufw default deny incoming
    ufw default allow outgoing

    # Allow SSH with rate limiting (prevent brute force)
    log "Allowing SSH (port 22)..."
    ufw limit ssh/tcp comment 'SSH with rate limiting'

    # Allow HTTP and HTTPS
    log "Allowing HTTP/HTTPS..."
    ufw allow http comment 'HTTP'
    ufw allow https comment 'HTTPS'

    # Allow port 3001 (API port - internal only)
    log "Allowing API port (3001)..."
    ufw allow 3001/tcp comment 'API internal'

    # Enable UFW
    log "Enabling UFW..."
    echo "y" | ufw enable || true

    # Show status
    log "Firewall status:"
    ufw status verbose

    log_success "Firewall configured"
}

# =============================================================================
# Create application user and directories
# =============================================================================

create_user_and_dirs() {
    log_header "Creating Application User and Directories"

    # Create app user if not exists
    if id "$APP_USER" &>/dev/null; then
        log_warning "User $APP_USER already exists, skipping creation"
    else
        log "Creating user $APP_USER..."
        useradd -r -m -s /bin/bash -d "$USER_HOME" "$APP_USER"
        log_success "User $APP_USER created"
    fi

    # Create application directories
    log "Creating application directories..."
    mkdir -p "$APP_DIR/source"
    mkdir -p "$APP_DIR/frontend"
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$APP_DIR/.acme-challenge"

    # Create tmp directory for PM2
    mkdir -p "$USER_HOME/.pm2"
    chown -R "$APP_USER:$APP_USER" "$USER_HOME/.pm2"

    # Create acme-challenge for SSL
    mkdir -p /var/www/acme-challenge
    chown -R www-data:www-data /var/www/acme-challenge

    # Set permissions
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    chown -R "$APP_USER:$APP_USER" "$LOG_DIR"
    chown -R "$APP_USER:$APP_USER" "$BACKUP_DIR"

    # Allow www-data to serve acme challenge
    chmod -R 755 /var/www/acme-challenge

    log_success "Directories created"
}

# =============================================================================
# Setup Nginx configuration
# =============================================================================

setup_nginx() {
    log_header "Setting up Nginx Configuration"

    # Copy Nginx configuration
    if [ -f "/var/www/hoantienve/deploy/nginx/hoantienve.conf" ]; then
        log "Copying Nginx configuration..."
        cp /var/www/hoantienve/deploy/nginx/hoantienve.conf /etc/nginx/sites-available/hoantienve
        # Replace placeholder domain
        sed -i "s/YOUR_DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/hoantienve
    else
        log_warning "Nginx config not found at /var/www/hoantienve/deploy/nginx/hoantienve.conf"
        log_warning "Please manually create Nginx configuration"
        return 1
    fi

    # Enable site
    if [ -f "/etc/nginx/sites-available/hoantienve" ]; then
        ln -sf /etc/nginx/sites-available/hoantienve /etc/nginx/sites-enabled/
        log "Nginx site enabled"
    fi

    # Disable default site
    rm -f /etc/nginx/sites-enabled/default

    # Create log directories
    touch /var/log/nginx/hoantienve_access.log
    touch /var/log/nginx/hoantienve_error.log

    # Test and reload Nginx
    if nginx -t; then
        systemctl reload nginx
        log_success "Nginx configured"
    else
        log_error "Nginx configuration test failed"
        exit 1
    fi
}

# =============================================================================
# Setup SSL certificate
# =============================================================================

setup_ssl() {
    log_header "Setting up SSL Certificate"

    log "Getting SSL certificate for $DOMAIN..."

    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos \
        -m "admin@$DOMAIN" --redirect

    if [ $? -eq 0 ]; then
        log_success "SSL certificate obtained"

        # Auto-renewal is enabled by default with Certbot
        log "SSL auto-renewal is enabled"
    else
        log_error "SSL certificate setup failed"
        log_warning "You can manually run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    fi
}

# =============================================================================
# Setup backup script
# =============================================================================

setup_backup() {
    log_header "Setting up Automated Backups"

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Create backup script
    cat > /usr/local/bin/backup-hoantienve.sh << 'BACKUPEOF'
#!/bin/bash
# =============================================================================
# AeroRefund (HoanTienVe365) - Automated Backup Script
# =============================================================================
# Run: sudo /usr/local/bin/backup-hoantienve.sh
# Cron: 0 2 * * * /usr/local/bin/backup-hoantienve.sh
# =============================================================================

set -e

BACKUP_DIR="/var/backups/hoantienve"
APP_DIR="/var/www/hoantienve"
LOG_DIR="/var/log/hoantienve"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="hoantienve_backup_${DATE}"
RETENTION_DAYS=14
RETENTION_COUNT=10

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Backup source code (excluding node_modules, .git, dist)
log "Backing up source code..."
rsync -a --exclude='node_modules' --exclude='.git' --exclude='dist' \
    --exclude='.cache' --exclude='tmp' \
    "$APP_DIR/source/" "$BACKUP_DIR/$BACKUP_NAME/source/"

# Backup frontend build
log "Backing up frontend..."
rsync -a "$APP_DIR/frontend/" "$BACKUP_DIR/$BACKUP_NAME/frontend/"

# Backup environment file
if [ -f "$APP_DIR/source/.env" ]; then
    cp "$APP_DIR/source/.env" "$BACKUP_DIR/$BACKUP_NAME/.env"
fi

# Backup PM2 ecosystem config
if [ -f "$APP_DIR/source/ecosystem.config.js" ]; then
    cp "$APP_DIR/source/ecosystem.config.js" "$BACKUP_DIR/$BACKUP_NAME/ecosystem.config.js"
fi

# Backup logs
mkdir -p "$BACKUP_DIR/$BACKUP_NAME/logs"
cp -r "$LOG_DIR"/*.log "$BACKUP_DIR/$BACKUP_NAME/logs/" 2>/dev/null || true

# Compress backup
log "Compressing backup..."
cd "$BACKUP_DIR"
tar -czvf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# Create latest symlink
ln -sf "${BACKUP_NAME}.tar.gz" "hoantienve_latest.tar.gz"

# Upload to remote storage (optional - configure for your storage)
# Uncomment and configure for S3/R2/FTP backup
# rclone copy "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" remote:bucket/hoantienve/

# Clean old backups (by age AND by count)
log "Cleaning old backups (keeping last $RETENTION_COUNT, max age $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "hoantienve_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
cd "$BACKUP_DIR"
ls -t hoantienve_backup_*.tar.gz 2>/dev/null | tail -n +$((RETENTION_COUNT + 1)) | xargs rm -f 2>/dev/null || true

# Show backup info
BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
log_success "Backup completed: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"

# Cleanup old pm2 logs
pm2 flush
BACKUPEOF

    chmod +x /usr/local/bin/backup-hoantienve.sh

    # Setup cron job for daily backup at 2 AM
    (crontab -l 2>/dev/null | grep -v "backup-hoantienve.sh"; echo "0 2 * * * /usr/local/bin/backup-hoantienve.sh >> /var/log/backup.log 2>&1") | crontab -

    log_success "Automated backups configured (runs daily at 2 AM)"
    log "Manual backup: sudo /usr/local/bin/backup-hoantienve.sh"
}

# =============================================================================
# Clone repository (optional)
# =============================================================================

clone_repo() {
    log_header "Cloning Repository"

    local REPO_URL="${1:-}"
    local GIT_BRANCH="${2:-main}"

    if [ -z "$REPO_URL" ]; then
        log_warning "No repository URL provided. Skipping git clone."
        log "To clone manually, run:"
        echo "  cd $APP_DIR/source"
        echo "  git clone <your-repo-url> ."
        echo "  git checkout $GIT_BRANCH"
        return 0
    fi

    cd "$APP_DIR/source"

    # Initialize git if not a repo
    if [ ! -d ".git" ]; then
        log "Cloning repository..."
        git clone "$REPO_URL" .
    else
        log "Repository already exists, skipping clone"
    fi

    # Checkout branch
    if git branch -a | grep -q "$GIT_BRANCH"; then
        git checkout "$GIT_BRANCH"
        log_success "Checked out branch: $GIT_BRANCH"
    else
        log_warning "Branch $GIT_BRANCH not found"
    fi

    # Set permissions
    chown -R "$APP_USER:$APP_USER" "$APP_DIR/source"

    log_success "Repository setup complete"
}

# =============================================================================
# Print final instructions
# =============================================================================

print_instructions() {
    log_header "Setup Complete!"

    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Copy your source code to $APP_DIR/source"
    echo "   or run: git clone <repo-url> $APP_DIR/source"
    echo ""
    echo "2. Create .env file:"
    echo "   cd $APP_DIR/source"
    echo "   cp .env.example .env"
    echo "   nano .env  # Edit with your settings"
    echo ""
    echo "3. Install dependencies:"
    echo "   su - $APP_USER"
    echo "   cd $APP_DIR/source"
    echo "   npm install"
    echo ""
    echo "4. Copy PM2 ecosystem config:"
    echo "   cp ecosystem.config.js $APP_DIR/source/"
    echo ""
    echo "5. Start the application:"
    echo "   cd $APP_DIR/source"
    echo "   pm2 start ecosystem.config.js --env production"
    echo "   pm2 save"
    echo ""
    echo "6. (Optional) Setup SSL:"
    echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo ""
    echo "=============================================="
    echo ""
    echo "Useful commands:"
    echo "  pm2 status              - Check app status"
    echo "  pm2 logs hoantienve-api - View logs"
    echo "  pm2 monit               - Monitor resources"
    echo "  pm2 restart hoantienve-api - Restart app"
    echo ""
    echo "  systemctl status nginx  - Check Nginx status"
    echo "  certbot --dry-run       - Test SSL renewal"
    echo ""
    echo "  ufw status              - Check firewall"
    echo "  fail2ban-client status  - Check fail2ban"
    echo ""
    echo "  /usr/local/bin/backup-hoantienve.sh - Manual backup"
    echo ""
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    echo "=============================================="
    echo "   AeroRefund VPS Setup Script v3"
    echo "   $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=============================================="
    echo ""

    # Parse arguments
    DOMAIN="${1:-$DOMAIN}"
    REPO_URL="${2:-}"
    BRANCH="${3:-main}"

    check_root
    update_system
    setup_auto_updates
    setup_fail2ban
    install_nodejs
    install_pm2
    install_nginx
    install_certbot
    configure_firewall
    create_user_and_dirs
    setup_backup

    if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "your-domain.com" ]; then
        setup_nginx "$DOMAIN"
        setup_ssl "$DOMAIN"
    else
        log_warning "No domain specified. Run with: sudo bash setup_vps.sh your-domain.com"
    fi

    if [ -n "$REPO_URL" ]; then
        clone_repo "$REPO_URL" "$BRANCH"
    fi

    print_instructions

    log_success "VPS setup completed!"
}

# Run main
main "$@"
