import play from 'play-dl';
import fs from 'fs';

async function run() {
  try {
    const stream = await play.stream('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      quality: 2 // Highest quality
    });
    
    console.log('Stream type:', stream.type);
    
    // Pipe to a file just to verify it streams
    const out = fs.createWriteStream('test.mp4');
    stream.stream.pipe(out);
    
    setTimeout(() => {
      out.close();
      console.log('Successfully wrote 5 seconds of stream');
      process.exit(0);
    }, 5000);
    
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

run();
