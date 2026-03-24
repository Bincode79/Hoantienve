// PM2 ecosystem configuration for AeroRefund (HoanTienVe365)
// =============================================================================
// Usage: pm2 start ecosystem.config.js --env production
// Commands:
//   pm2 start ecosystem.config.js          - Start all apps
//   pm2 restart ecosystem.config.js        - Restart all apps
//   pm2 reload ecosystem.config.js        - Zero-downtime reload
//   pm2 stop ecosystem.config.js           - Stop all apps
//   pm2 delete ecosystem.config.js        - Remove from PM2
//   pm2 monit                             - Monitor in terminal
//   pm2 logs hoantienve-api --lines 100  - View logs
//
// NOTE: This file uses CommonJS (module.exports) for maximum PM2 compatibility.
// PM2 works best with CommonJS ecosystem files. Do NOT convert to ESM.
// =============================================================================

// NOTE: After starting the app, run these commands for auto-restart on reboot:
//   pm2 save
//   env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
// Then run the command output by pm2 startup (as root or with sudo).

module.exports = {
  apps: [
    {
      name: 'hoantienve-api',

      // Entry point - use node_modules/.bin/tsx for reliable PM2 execution
      script: 'node_modules/.bin/tsx',
      args: 'server.ts',

      // Working directory (detect automatically if possible, otherwise use default)
      cwd: process.env.PM2_CWD || '/var/www/hoantienve/source',

      // --- Process Management ---
      instances: 1,           // 1 instance for API (can scale with cluster later)
      exec_mode: 'fork',      // 'fork' mode (use 'cluster' mode for multi-core)
      autorestart: true,      // Auto restart on crash
      watch: false,           // Don't watch files in production
      max_restarts: 10,       // Max restart attempts before giving up
      min_uptime: '10s',      // Min uptime before considering "stable"

      // --- Memory & Performance ---
      max_memory_restart: '1G',    // Allow 1GB of memory if needed
      node_args: '--max-old-space-size=800', // Node.js memory limit (slightly more generous)

      // --- Environment Variables ---
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        // Force garbage collection hints
        NODE_OPTIONS: '--max-old-space-size=650',
      },

      // --- Logging Configuration ---
      error_file: '/var/log/hoantienve/error.log',
      out_file: '/var/log/hoantienve/out.log',
      log_file: '/var/log/hoantienve/combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      combine_logs: true,
      // Combined with pm2-logrotate (set up in setup_vps.sh)
      // Default: 10M max size, 7 files retained

      // --- Graceful Shutdown ---
      kill_timeout: 8000,         // Time to gracefully shutdown (ms)
      wait_ready: true,           // Wait for 'process.send("ready")' signal
      listen_timeout: 15000,      // Timeout for ready signal (ms)
      shutdown_with_message: true, // Send SIGINT instead of SIGTERM for graceful shutdown

      // --- Restart Policy ---
      restart_delay: 4000,        // Delay between restarts (ms)

      // --- PM2 Plus / Keymetrics (optional) ---
      // Uncomment and add your PM2 Plus public key for monitoring
      // pm2_var: 'YOUR_PM2_PUBLIC_KEY',

      // --- Source Map Support ---
      // Enable for better stack traces in production
      // source_map_support: true,
    },
  ],
};
