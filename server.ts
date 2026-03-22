import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import admin from "firebase-admin";
import cors from "cors";

// Import custom routes
import authRouter from "./server/routes/auth.js";
import usersRouter from "./server/routes/users.js";
import refundsRouter from "./server/routes/refunds.js";
import dataRouter from "./server/routes/data.js";
import { db } from "./server/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let serviceAccount = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
} catch (error) {
  console.error('[Startup] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON. FCM will not work:', error);
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.warn("[Startup] FIREBASE_SERVICE_ACCOUNT not configured or invalid. FCM notifications will not work.");
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
    "http://localhost:5173",
    "http://localhost:5175",
  ];
  
  // Add Render domain if available
  if (APP_URL && APP_URL !== '*') {
    try {
      const url = new URL(APP_URL);
      allowedOrigins.push(url.origin);
    } catch {
      // Ignore invalid URLs
    }
  }
  
  app.use(cors({
    origin: allowedOrigins,
    credentials: true
  }));
  app.use(express.json());

  // API Routes
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/refunds", refundsRouter);
  app.use("/api/data", dataRouter);

  // Legacy/Custom notify route
  app.post("/api/notify", async (req, res) => {
    const { token, title, body } = req.body;

    if (!serviceAccount) {
      return res.status(500).json({ error: "FCM not configured on server." });
    }

    if (!token) {
      return res.status(400).json({ error: "No token provided." });
    }

    try {
      const message = {
        notification: { title, body },
        token: token,
      };

      const response = await admin.messaging().send(message);
      res.json({ success: true, response });
    } catch (error) {
      console.error("Error sending FCM notification:", error);
      res.status(500).json({ error: "Failed to send notification." });
    }
  });

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
    console.log(`API Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Unhandled startup error:', err);
  process.exit(1);
});

// Run migration on startup (only once)
runMigration();

