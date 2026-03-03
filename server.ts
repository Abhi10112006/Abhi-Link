import express from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API Routes
  app.post("/api/shorten", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Try to create a custom alias first: abhi-link-{random}
      const randomSuffix = crypto.randomBytes(3).toString('hex');
      const alias = `abhi-link-${randomSuffix}`;
      
      let response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}&alias=${alias}`);

      // If custom alias fails (e.g. taken), fall back to standard shortening
      if (!response.ok || (await response.clone().text()) === 'Error') {
         response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      }
      
      if (!response.ok) {
        throw new Error(`TinyURL API error: ${response.statusText}`);
      }

      const shortUrl = await response.text();
      res.json({ shortUrl });
    } catch (error) {
      console.error("Error shortening URL:", error);
      res.status(500).json({ error: "Failed to shorten URL" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
