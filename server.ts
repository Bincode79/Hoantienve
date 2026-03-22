import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import cors from "cors";

// Import custom routes
import authRouter from "./server/routes/auth.js";
import usersRouter from "./server/routes/users.js";
import refundsRouter from "./server/routes/refunds.js";
import dataRouter from "./server/routes/data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
  : null;

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT not found. FCM notifications will not work.");
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5173;
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

