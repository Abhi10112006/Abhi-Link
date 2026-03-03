import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// Trust proxy for correct protocol/host behind Nginx/Vercel
app.set('trust proxy', true);

app.post('/api/shorten', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Try to generate a custom alias with TinyURL
    // Format: abhi-link-<6_random_chars>
    let attempts = 0;
    let shortUrl = '';
    
    while (attempts < 5 && !shortUrl) {
      // Generate a random suffix (4-6 chars)
      const suffix = Math.random().toString(36).substring(2, 8);
      const alias = `abhi-link-${suffix}`;
      
      // Try to create with alias
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}&alias=${alias}`);
      
      if (response.ok) {
        const text = await response.text();
        if (text.startsWith('http')) {
          shortUrl = text;
        }
      }
      
      attempts++;
    }

    // Fallback to standard random assignment if custom alias fails
    if (!shortUrl) {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`TinyURL API failed with status: ${response.status}`);
      }
      shortUrl = await response.text();
    }
    
    // TinyURL returns the full URL (e.g., https://tinyurl.com/xyz)
    res.json({ shortUrl });
  } catch (error) {
    console.error('Shortening error:', error);
    // Fallback to original URL if shortening fails, or return error
    // Returning the original URL as "shortUrl" allows the app to continue working
    res.json({ shortUrl: url });
  }
});

export default app;
