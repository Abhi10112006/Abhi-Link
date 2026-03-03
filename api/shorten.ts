import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
