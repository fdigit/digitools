import youtubedl from 'youtube-dl-exec';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const ytdlpOptions: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      youtubeSkipDashManifest: true,
    };
    
    if (process.env.YOUTUBE_COOKIE) {
      ytdlpOptions.addHeader = [`Cookie: ${process.env.YOUTUBE_COOKIE}`];
    }
    
    console.log('Fetching info using yt-dlp...');
    const info = await youtubedl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', ytdlpOptions);
    console.log('Success!', (info as any).title);
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

run();
