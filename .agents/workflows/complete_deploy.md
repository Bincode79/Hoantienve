---
description: Complete deployment of Hoantienve application (Render, Docker, local)
---

# Complete Deployment Workflow (bsnt)

## 1️⃣ Prerequisites
- Node.js **v20** (ensure `.node-version` is present)
- Git repository linked to a remote (GitHub) – already set up.
- Render account (or any cloud provider you prefer).
- Required environment variables (see `render.yaml`).

## 2️⃣ Local Development (optional)
```bash
# Install dependencies
npm install

# Run dev server (Vite + Express middleware)
npm run dev   # tsx server.ts – hot‑reload on port 5173
```
Make sure the app works locally before pushing.

## 3️⃣ Prepare Environment Variables
Create a `.env` file (do **not** commit) with the following keys:
```
NODE_ENV=production
PORT=10000
APP_URL=<your‑public‑url>
DATABASE_URL=<your‑PostgreSQL‑url>
JWT_SECRET=<strong‑secret>
JWT_EXPIRES_IN=7d
FIREBASE_SERVICE_ACCOUNT={...json...}
VITE_FCM_VAPID_KEY=<vapid‑key>
GEMINI_API_KEY=<your‑gemini‑key>
```
Render will import these from its dashboard – copy the same values there.

## 4️⃣ Commit & Push
```bash
git add .
git commit -m "chore: prepare for full deployment"
git push origin main
```
The CI on Render will trigger automatically.

## 5️⃣ Render Configuration (`render.yaml`)
The file already exists, but verify:
```yaml
services:
  - type: web
    name: hoantienve365
    runtime: node
    region: singapore
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: APP_URL
        fromService:
          type: web
          name: hoantienve365
          envVarKey: RENDER_EXTERNAL_URL
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRES_IN
        value: "7d"
      - key: FIREBASE_SERVICE_ACCOUNT
        sync: false
      - key: VITE_FCM_VAPID_KEY
        sync: false
      - key: GEMINI_API_KEY
        sync: false
    healthCheckPath: /
```
When you push, Render will:
1. Run `npm install` → install deps.
2. Run `npm run build` → Vite builds the SPA into `dist/`.
3. Run `npm run start` → launches `tsx server.ts` on the defined `PORT`.

## 6️⃣ Verify Deployment
- Open the URL provided by Render (e.g., `https://hoantienve365.onrender.com`).
- Check the console logs for any `EADDRINUSE` errors – they should be gone after the port fix.
- Test API routes (`/api/auth`, `/api/users`, …) using Postman or curl.

## 7️⃣ Optional: Docker Deployment (if you prefer containers)
Create a `Dockerfile` at the project root:
```dockerfile
# Use the official Node 20 image
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/.env.example ./
RUN npm ci --only=production
EXPOSE 10000
CMD ["tsx", "server.ts"]
```
Build & run:
```bash
docker build -t hoantienve .
docker run -p 10000:10000 -e NODE_ENV=production -e PORT=10000 ... hoantienve
```

## 8️⃣ Monitoring & Logs
- Render Dashboard → **Logs** for real‑time output.
- Use `pm2` locally if you need process management.

## 9️⃣ Rollback (if needed)
```bash
git revert <commit‑hash>
git push origin main
```
Render will redeploy the previous version automatically.

---
**✅ End of workflow**
