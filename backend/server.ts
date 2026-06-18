import express from 'express';
import path from 'path';

import cors from 'cors';
import ytdl from '@distube/ytdl-core';
import youtubedl from 'youtube-dl-exec';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  let ytdlAgent: ytdl.Agent | undefined;
  if (process.env.YOUTUBE_COOKIE) {
    try {
      const cookieString = process.env.YOUTUBE_COOKIE;
      const cookies = cookieString.split(';').map(c => {
        const [name, ...rest] = c.trim().split('=');
        return { name, value: rest.join('='), domain: '.youtube.com', path: '/' };
      });
      ytdlAgent = ytdl.createAgent(cookies);
      console.log('Successfully loaded YouTube cookies');
    } catch (e) {
      console.error('Failed to parse YOUTUBE_COOKIE', e);
    }
  }

  app.use(cors());
  app.use(express.json());

  // API Route to fetch video info
  app.get('/api/info', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || !url.startsWith('http')) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }

      const info = await ytdl.getInfo(url, { agent: ytdlAgent });
      
      const audioFormats = info.formats
        .filter((f: any) => !f.hasVideo && f.hasAudio)
        .sort((a: any, b: any) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

      const bestAudio = audioFormats[0];
      
      const formats = info.formats
        .filter((f: any) => f.hasVideo && f.hasAudio)
        .map((f: any) => ({
          itag: f.itag,
          qualityLabel: f.qualityLabel || `${f.height}p`,
          container: f.container,
          hasAudio: f.hasAudio,
          contentLength: f.contentLength || '0'
        }));
        
      if (bestAudio) {
        formats.push({
          itag: 'audio-only',
          qualityLabel: 'Audio Only',
          container: 'mp3',
          hasAudio: true,
          contentLength: bestAudio.contentLength || '0'
        });
      }

      res.json({
        title: info.videoDetails.title,
        author: info.videoDetails.author.name || 'Unknown',
        thumbnail: info.videoDetails.thumbnails[0]?.url || '',
        lengthSeconds: info.videoDetails.lengthSeconds,
        formats: formats.reverse()
      });
    } catch (err: any) {
      console.error('Error fetching video info:', err.message);
      res.status(500).json({ error: err.message || 'Failed to fetch video info. It might be restricted.' });
    }
  });

  // API Route to start download
  app.get('/api/download', async (req, res) => {
    const url = req.query.url as string;
    const itag = req.query.itag as string;

    try {
      if (!url || !url.startsWith('http')) {
        return res.status(400).send('Invalid YouTube URL');
      }

      const info = await ytdl.getInfo(url, { agent: ytdlAgent });
      const title = info.videoDetails.title.replace(/[^\w\s-]/g, '');

      let subprocess;

      const ytdlpOptions: any = {};
      if (process.env.YOUTUBE_COOKIE) {
        ytdlpOptions.addHeader = [`Cookie: ${process.env.YOUTUBE_COOKIE}`];
      }

      if (itag === 'audio-only') {
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        
        subprocess = youtubedl.exec(url, {
          format: 'bestaudio',
          extractAudio: true,
          audioFormat: 'mp3',
          output: '-', // stdout
          ...ytdlpOptions
        });
      } else {
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');
        
        const format = ytdl.chooseFormat(info.formats, { quality: itag });
        if (format && format.contentLength) {
          res.setHeader('Content-Length', format.contentLength);
        }

        subprocess = youtubedl.exec(url, {
          format: itag || 'best',
          output: '-', // stdout
          ...ytdlpOptions
        });
      }

      subprocess.stdout?.pipe(res);

      subprocess.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).end('Error streaming video');
        } else {
          res.end();
        }
      });
      
      res.on('close', () => {
        subprocess.kill();
      });

    } catch (err: any) {
      console.error('Error downloading:', err.message);
      res.status(500).json({ error: err.message || 'Download failed' });
    }
  });

  // API is now standalone; frontend is hosted separately on Vercel.

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
