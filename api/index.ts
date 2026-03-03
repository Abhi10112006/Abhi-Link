import express from 'express';
import { Redis } from '@upstash/redis';

const app = express();
app.use(express.json());

// Trust proxy for correct protocol/host behind Nginx/Vercel
app.set('trust proxy', true);

const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const redisUrl = process.env.KV_REST_API_URL || process.env.KV_URL;
const redisToken = process.env.KV_REST_API_TOKEN;

let redis: Redis | null = null;
let localDb: any = null;

if (redisUrl && redisToken) {
  console.log('Using Upstash Redis (Serverless)');
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
} else if (!isVercel) {
  console.log('Using local SQLite database (dev mode)');
  try {
    const { default: Database } = await import('better-sqlite3');
    localDb = new Database('links.db');
    localDb.exec(`
      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        original_url TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        expires_at INTEGER
      )
    `);
  } catch (e) {
    console.warn('better-sqlite3 not found, falling back to in-memory map');
    localDb = new Map();
  }
}

// 20 hours in seconds
const LINK_EXPIRY_SECONDS = 20 * 60 * 60; 

async function saveLink(code: string, url: string): Promise<void> {
  if (redis) {
    await redis.set(code, url, { ex: LINK_EXPIRY_SECONDS });
  } else if (localDb instanceof Map) {
    localDb.set(code, { url, expiresAt: Date.now() + LINK_EXPIRY_SECONDS * 1000 });
  } else if (localDb) {
    const expiresAt = Math.floor(Date.now() / 1000) + LINK_EXPIRY_SECONDS;
    const insert = localDb.prepare('INSERT INTO links (id, original_url, expires_at) VALUES (?, ?, ?)');
    insert.run(code, url, expiresAt);
  }
}

async function getLink(code: string): Promise<string | null> {
  if (redis) {
    return await redis.get<string>(code);
  } else if (localDb instanceof Map) {
    const data = localDb.get(code);
    if (data && data.expiresAt > Date.now()) return data.url;
    if (data) localDb.delete(code);
    return null;
  } else if (localDb) {
    const row = localDb.prepare('SELECT original_url, expires_at FROM links WHERE id = ?').get(code) as any;
    if (!row) return null;
    if (row.expires_at && row.expires_at < Math.floor(Date.now() / 1000)) {
      localDb.prepare('DELETE FROM links WHERE id = ?').run(code);
      return null;
    }
    return row.original_url;
  }
  return null;
}

async function checkExists(code: string): Promise<boolean> {
  if (redis) {
    const exists = await redis.exists(code);
    return exists === 1;
  } else if (localDb instanceof Map) {
    return localDb.has(code);
  } else if (localDb) {
    const row = localDb.prepare('SELECT id FROM links WHERE id = ?').get(code);
    return !!row;
  }
  return false;
}

app.post('/api/shorten', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    let shortCode = Math.random().toString(36).substring(2, 8);
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

export default app;
