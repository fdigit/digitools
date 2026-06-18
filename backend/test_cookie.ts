import ytdl from '@distube/ytdl-core';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const cookieString = process.env.YOUTUBE_COOKIE || '';
    const cookies = cookieString.split(';').map(c => {
      const [name, ...rest] = c.trim().split('=');
      return { name, value: rest.join('='), domain: '.youtube.com', path: '/' };
    });
    
    console.log(`Parsed ${cookies.length} cookies.`);
    const agent = ytdl.createAgent(cookies);
    
    console.log('Fetching info...');
    const info = await ytdl.getInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { agent });
    console.log('Success!', info.videoDetails.title);
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

run();
