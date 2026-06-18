import play from 'play-dl';
import https from 'https';
import fs from 'fs';

async function run() {
  try {
    const info = await play.video_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    const url = info.format[0].url;
    
    https.get(url, (res) => {
      console.log('Status code:', res.statusCode);
      const out = fs.createWriteStream('test_stream.mp4');
      res.pipe(out);
      
      setTimeout(() => {
        out.close();
        console.log('Successfully wrote 5 seconds of native HTTP stream');
        process.exit(0);
      }, 5000);
    });
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

run();
