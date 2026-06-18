import express from 'express';
import cors from 'cors';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // API Route to fetch video info via YouTube's official oEmbed API
  app.get('/api/info', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || !url.startsWith('http')) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }

      console.log(`Fetching info for ${url} via oEmbed...`);
      
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      
      const response = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch video information from YouTube.');
      }

      const info = await response.json();

      res.json({
        title: info.title || 'Unknown Title',
        author: info.author_name || 'Unknown Author',
        thumbnail: info.thumbnail_url || '',
        formats: [] // No formats needed for external redirection
      });

    } catch (err: any) {
      console.error('Error fetching video info:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
