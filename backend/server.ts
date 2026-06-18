import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import youtubedl from 'youtube-dl-exec';

const COOKIE_FILE_PATH = path.join(process.cwd(), 'youtube-cookies.txt');

function createNetscapeCookieFile(rawCookie: string) {
  // Strip user copy-paste prefixes like "YOUTUBE_COOKIE : "
  let cleanedCookie = rawCookie.replace(/^(YOUTUBE_COOKIE\s*:\s*)/i, '');
  if (cleanedCookie.startsWith('"') && cleanedCookie.endsWith('"')) {
    cleanedCookie = cleanedCookie.slice(1, -1);
  }

  const header = "# Netscape HTTP Cookie File\n# http://curl.haxx.se/rfc/cookie_spec.html\n# This is a generated file! Do not edit.\n\n";
  const lines = cleanedCookie.split(';').map(cookie => {
    const parts = cookie.trim().split('=');
    const name = parts[0]?.trim();
    const value = parts.slice(1).join('=').trim();
    if (!name || !value) return '';
    return `.youtube.com\tTRUE\t/\tTRUE\t2147483647\t${name}\t${value}`;
  }).filter(line => line.length > 0).join('\n');
  
  fs.writeFileSync(COOKIE_FILE_PATH, header + lines);
  console.log('Successfully generated Netscape cookie file for yt-dlp. Total cookies parsed:', lines.split('\n').length);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  if (process.env.YOUTUBE_COOKIE) {
    try {
      createNetscapeCookieFile(process.env.YOUTUBE_COOKIE);
    } catch (e) {
      console.error('Failed to parse YOUTUBE_COOKIE', e);
    }
  }

  app.use(cors());
  app.use(express.json());

  // Helper to build yt-dlp options securely
  const getBaseOptions = () => {
    const options: any = {
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      youtubeSkipDashManifest: true,
      extractorArgs: 'youtube:player_client=android_creator,android,tv,web',
      forceIpv6: true,
    };
    if (fs.existsSync(COOKIE_FILE_PATH)) {
      options.cookies = COOKIE_FILE_PATH;
    }
    return options;
  };

  // API Route to debug the environment and cookie parsing
  app.get('/api/test-env', async (req, res) => {
    try {
      const rawCookie = process.env.YOUTUBE_COOKIE || '';
      let parsedNames: string[] = [];
      let ytDlpVersion = 'Unknown';
      
      if (fs.existsSync(COOKIE_FILE_PATH)) {
        const fileContents = fs.readFileSync(COOKIE_FILE_PATH, 'utf-8');
        parsedNames = fileContents.split('\n')
          .filter(line => !line.startsWith('#') && line.trim().length > 0)
          .map(line => line.split('\t')[5]); // The name column in Netscape format
      }

      try {
        const { stdout } = await youtubedl.exec('--version');
        ytDlpVersion = stdout.trim();
      } catch (e: any) {
        ytDlpVersion = `Error: ${e.message}`;
      }

      res.json({
        rawCookieLength: rawCookie.length,
        hasRawCookie: rawCookie.length > 0,
        parsedCookieNames: parsedNames,
        cookieFileExists: fs.existsSync(COOKIE_FILE_PATH),
        ytDlpVersion: ytDlpVersion,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route to fetch video info
  app.get('/api/info', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || !url.startsWith('http')) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }

      console.log(`Fetching info for ${url}...`);
      const info: any = await youtubedl(url, {
        dumpSingleJson: true,
        ...getBaseOptions()
      });
      
      const ytFormats = info.formats || [];
      
      // Find highest bitrate audio-only format
      const audioFormats = ytFormats
        .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
        .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0));

      const bestAudio = audioFormats[0];
      
      // Find formats that contain both video and audio out-of-the-box
      const formats = ytFormats
        .filter((f: any) => f.vcodec !== 'none' && f.acodec !== 'none')
        .map((f: any) => ({
          itag: f.format_id,
          qualityLabel: f.format_note || (f.height ? `${f.height}p` : 'Unknown'),
          container: f.ext,
          hasAudio: true,
          contentLength: (f.filesize || f.filesize_approx || '0').toString()
        }));
        
      if (bestAudio) {
        formats.push({
          itag: 'audio-only',
          qualityLabel: 'Audio Only',
          container: 'mp3',
          hasAudio: true,
          contentLength: (bestAudio.filesize || bestAudio.filesize_approx || '0').toString()
        });
      }

      res.json({
        title: info.title,
        author: info.uploader || 'Unknown',
        thumbnail: info.thumbnail || '',
        lengthSeconds: (info.duration || 0).toString(),
        formats: formats.reverse()
      });
    } catch (err: any) {
      console.error('Error fetching video info:', err.message);
      
      // Specifically extract the yt-dlp error string to make it readable
      let errorMessage = 'Failed to fetch video info.';
      if (err.stderr) {
         const match = err.stderr.match(/ERROR: (.*)/);
         if (match) errorMessage = match[1];
      } else if (err.message) {
         errorMessage = err.message;
      }
      
      res.status(500).json({ error: errorMessage });
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

      console.log(`Starting download for ${url} (itag: ${itag})`);
      
      // Quickly get title for the filename
      const info: any = await youtubedl(url, {
        dumpSingleJson: true,
        ...getBaseOptions()
      });
      const title = info.title.replace(/[^\w\s-]/g, '');

      let subprocess;

      if (itag === 'audio-only') {
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        
        subprocess = youtubedl.exec(url, {
          format: 'bestaudio',
          extractAudio: true,
          audioFormat: 'mp3',
          output: '-', // stdout
          ...getBaseOptions()
        });
      } else {
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        subprocess = youtubedl.exec(url, {
          format: itag || 'best',
          output: '-', // stdout
          ...getBaseOptions()
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
