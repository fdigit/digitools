import play from 'play-dl';
import https from 'https';

async function run() {
  try {
    const rawCookie = process.env.YOUTUBE_COOKIE || '';
    play.setToken({
      youtube: {
        cookie: rawCookie
      }
    });

    const info = await play.video_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    const url = info.format[0].url;
    
    // Convert Netscape string to simple Key=Value string for Cookie header
    const cleanedCookie = rawCookie.replace(/^(YOUTUBE_COOKIE\s*:\s*)/i, '').replace(/"/g, '');
    const cookieHeader = cleanedCookie.split(';').map(c => {
      const parts = c.trim().split('=');
      return `${parts[0]}=${parts.slice(1).join('=')}`;
    }).join('; ');

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookieHeader
      }
    };
    
    https.get(url, options, (res) => {
      console.log('Status code with UA & Cookies:', res.statusCode);
      if (res.statusCode === 200) {
        console.log('SUCCESS! It streams natively with User-Agent and Cookies!');
      } else {
        console.log('Failed:', res.statusCode);
      }
      process.exit(0);
    }).on('error', (e) => {
      console.error('HTTPS Error:', e.message);
      process.exit(1);
    });
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

run();
