import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { kv } from '@vercel/kv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Storage Abstraction ---
// We use Vercel KV (Redis) in production for persistence and expiry.
// We use SQLite locally for easy development without credentials.

const isVercelKV = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
let localDb: Database.Database | null = null;

if (!isVercelKV) {
  console.log('Using local SQLite database (dev mode)');
  localDb = new Database('links.db');
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      original_url TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      expires_at INTEGER
    )
  `);
} else {
  console.log('Using Vercel KV (production mode)');
}

// 20 hours in seconds
const LINK_EXPIRY_SECONDS = 20 * 60 * 60; 

async function saveLink(code: string, url: string): Promise<void> {
  if (isVercelKV) {
    // Save to Vercel KV with 20-hour expiry (EX = seconds)
    await kv.set(code, url, { ex: LINK_EXPIRY_SECONDS });
  } else if (localDb) {
    // Save to local SQLite
    const expiresAt = Math.floor(Date.now() / 1000) + LINK_EXPIRY_SECONDS;
    const insert = localDb.prepare('INSERT INTO links (id, original_url, expires_at) VALUES (?, ?, ?)');
    insert.run(code, url, expiresAt);
  }
}

async function getLink(code: string): Promise<string | null> {
  if (isVercelKV) {
    // Get from Vercel KV
    return await kv.get<string>(code);
  } else if (localDb) {
    // Get from local SQLite and check expiry
    const row = localDb.prepare('SELECT original_url, expires_at FROM links WHERE id = ?').get(code) as { original_url: string, expires_at: number } | undefined;
    
    if (!row) return null;
    
    // Check if expired (simulate TTL for local dev)
    if (row.expires_at && row.expires_at < Math.floor(Date.now() / 1000)) {
      // Clean up expired link
      localDb.prepare('DELETE FROM links WHERE id = ?').run(code);
      return null;
    }
    
    return row.original_url;
  }
  return null;
}

async function checkExists(code: string): Promise<boolean> {
  if (isVercelKV) {
    const exists = await kv.exists(code);
    return exists === 1;
  } else if (localDb) {
    const row = localDb.prepare('SELECT id FROM links WHERE id = ?').get(code);
    return !!row;
  }
  return false;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for correct protocol/host behind Nginx/Vercel
  app.set('trust proxy', true);

  app.use(express.json());

  // API Routes
  app.post('/api/shorten', async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      // Generate a random 6-character code
      let shortCode = Math.random().toString(36).substring(2, 8);
      
      // Check for collision (simple retry logic)
      let attempts = 0;
      while (attempts < 5) {
        const exists = await checkExists(shortCode);
        if (!exists) break;
        shortCode = Math.random().toString(36).substring(2, 8);
        attempts++;
      }

      if (attempts === 5) {
        return res.status(500).json({ error: 'Failed to generate unique code' });
      }

      await saveLink(shortCode, url);

      // In production, this would be the full domain
      // For now, we return the relative path which works in the browser context
      const shortUrl = `${req.protocol}://${req.get('host')}/p/${shortCode}`;
      
      res.json({ shortCode, shortUrl });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/p/:code', async (req, res) => {
    const { code } = req.params;
    try {
      const originalUrl = await getLink(code);
      
      if (originalUrl) {
        res.redirect(originalUrl);
      } else {
        res.status(404).send('Link not found or expired');
      }
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
