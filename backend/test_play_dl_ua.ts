import play from 'play-dl';
import https from 'https';

async function run() {
  try {
    // Force a specific client to avoid signature issues
    play.setToken({
      youtube: {
        cookie: process.env.YOUTUBE_COOKIE || ''
      }
    });

    const info = await play.video_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    const url = info.format[0].url;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    
    https.get(url, options, (res) => {
      console.log('Status code with UA:', res.statusCode);
      if (res.statusCode === 200) {
        console.log('SUCCESS! It streams natively with User-Agent!');
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
