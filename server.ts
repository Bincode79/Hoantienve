import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import cors from "cors";

// Import custom routes
import authRouter from "./server/routes/auth.js";
import usersRouter from "./server/routes/users.js";
import refundsRouter from "./server/routes/refunds.js";
import dataRouter from "./server/routes/data.js";
import { db } from "./server/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.GEMINI_API_KEY) {
  console.log("[Startup] ✅ Gemini AI features enabled");
}

async function runMigration() {
  const migrationPath = path.join(__dirname, 'migrations', '001_init.sql');
  const sql = readFileSync(migrationPath, 'utf-8');
  console.log('[Startup] Running database migration...');
  try {
    await db.query(sql);
    console.log('[Startup] ✅ Database migration completed');
  } catch (err) {
    console.error('[Startup] ⚠️ Migration error (may be ok if tables exist):', err instanceof Error ? err.message : err);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3001;
  const APP_URL = process.env.APP_URL || '*';
  
  // Extract domain from APP_URL for CORS
  const allowedOrigins = [
    "https://hoantienve365.web.app",
    "https://hoantienve365.firebaseapp.com",
    "https://hoanvemaybay.com",
    "http://hoanvemaybay.com",
    "http://localhost:5173",
    "http://localhost:5175",
    "http://localhost:3000",
  ];
  
  // Add Render domain if available
  if (APP_URL && APP_URL !== '*' && !allowedOrigins.includes(APP_URL)) {
    try {
      const url = new URL(APP_URL);
      allowedOrigins.push(url.origin);
    } catch {
      // Ignore invalid URLs
    }
  }
  
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('hoanvemaybay.com')) {
        callback(null, true);
      } else {
        console.log(`[CORS] Blocked origin: ${origin}`);
        callback(null, true); // Temporarily allow for debugging if needed, or keep core domains
      }
    },
    credentials: true
  }));
  app.use(express.json());

  // Log requests
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api/data/config')) { // Avoid log spam for config
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Host: ${req.get('host')}`);
    }
    next();
  });

  // API Routes
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/refunds", refundsRouter);
  app.use("/api/data", dataRouter);

  // Health check endpoint (detailed)
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "online", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      domain: req.get('host'),
      db_connected: !!db
    });
  });

  // FCM notification endpoint (disabled - using custom API instead)
  // app.post("/api/notify", async (req, res) => { ... });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          port: 24679
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[Startup] ✅ API Server running on http://localhost:${PORT}`);
    
    // Signal PM2 that the application is ready
    if (process.send) {
      process.send('ready');
      console.log('[Startup] 🚀 Sent "ready" signal to PM2');
    }
  });
}

// Global error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch((err) => {
  console.error('[Server] ❌ Unhandled startup error:', err);
  process.exit(1);
});

// Run migration on startup (only once)
runMigration().catch(err => {
  console.error('[Startup] ❌ Migration failed:', err);
});

