# Vercel Deployment Guide (Monorepo)

This project uses a monorepo structure. The web app lives in `apps/web/`.  
Follow these steps to deploy it correctly on Vercel.

---

## 1. Prerequisites

- A [Vercel Account](https://vercel.com/signup)
- The [Vercel CLI](https://vercel.com/docs/cli) installed (optional) or GitHub integration

---

## 2. Create a Vercel Project

1. Push your code to GitHub.
2. Go to your **Vercel Dashboard** → **Add New...** → **Project**.
3. Import your GitHub repository (`Abhi-Link`).

---

## 3. ⚠️ Set Root Directory (IMPORTANT for Monorepo)

After importing, Vercel will show a configuration screen.

**You MUST set the Root Directory to `apps/web`:**

> Settings → Root Directory → `apps/web`

This tells Vercel to:
- Install only the web app's dependencies (`apps/web/package.json`)
- Run `npm run build` (which runs `vite build`) in `apps/web/`
- Serve the built output from `apps/web/dist/`
- Use `apps/web/vercel.json` for API routing

**If you skip this step, Vercel will try to build from the repo root and fail.**

---

## 4. Configure Vercel KV (Redis) for URL Shortening

Required for the TinyURL shortening feature via the `/api/shorten` endpoint.

1. In your Vercel Project Dashboard, go to the **Storage** tab.
2. Click **"Create Database"** → **KV** (Redis).
3. Give it a name (e.g., `abhi-link-db`) and select a region near your users.
4. Click **"Create"**, then **"Connect Project"**.
   - This automatically adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars.

---

## 5. Deploy

Vercel automatically deploys on every push to the connected branch.  
Trigger a manual deploy from the **Deployments** tab if needed.

---

## 6. Verify

1. Open your Vercel URL (e.g., `https://abhi-link-xyz.vercel.app`).
2. Enter a UPI ID and generate a QR code.
3. Click **"Copy Link"** — it should shorten via TinyURL.
4. Click **"WhatsApp"** — it should open WhatsApp with a pre-filled message.

---

## Local Development

```bash
cd apps/web
npm install
npm run dev     # starts Vite dev server + Express API on :3000
```

> Locally, the URL shortener calls TinyURL's public API directly (no Redis needed).
