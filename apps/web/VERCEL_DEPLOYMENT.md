# Vercel Deployment Guide

To deploy this application to Vercel with the custom URL shortener and 20-hour expiry, follow these steps:

## 1. Prerequisites

- A [Vercel Account](https://vercel.com/signup)
- The [Vercel CLI](https://vercel.com/docs/cli) installed (optional, but recommended) or GitHub integration.

## 2. Create a Vercel Project

1.  Push your code to a GitHub repository.
2.  Go to your Vercel Dashboard and click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.

## 3. Configure Vercel KV (Redis)

This is required for the URL shortener to work in production.

1.  In your Vercel Project Dashboard, go to the **Storage** tab.
2.  Click **"Create Database"**.
3.  Select **KV** (Redis).
4.  Give it a name (e.g., `abhi-link-db`) and select a region (choose one close to your users, e.g., Mumbai/Singapore).
5.  Click **"Create"**.
6.  Once created, click **"Connect Project"** and select your `abhi-link` project.
    *   This will automatically add the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables to your project.

## 4. Deploy

1.  Go back to the **Project** tab.
2.  Vercel should automatically detect the changes and redeploy (if connected to GitHub).
3.  If not, trigger a new deployment manually.

## 5. Verify

1.  Open your deployed Vercel URL (e.g., `https://abhi-link-xyz.vercel.app`).
2.  Create a payment link and click "Share".
3.  The link should be short (e.g., `https://abhi-link-xyz.vercel.app/p/a1b2c`).
4.  Clicking the link should redirect you to the full payment page.
5.  The link will automatically expire and be deleted after 20 hours.

## Local Development

-   Locally, the app uses a file-based SQLite database (`links.db`).
-   You do **not** need to set up Vercel KV for local development.
-   The expiry logic is simulated locally as well.
