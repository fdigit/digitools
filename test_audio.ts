import youtubedl from 'youtube-dl-exec';
import fs from 'fs';

async function test() {
  try {
    const subprocess = youtubedl.exec('https://www.youtube.com/watch?v=jNQXAC9IVRw', {
      format: 'bestaudio',
      output: '-'
    });
    
    const writeStream = fs.createWriteStream('test_audio.webm');
    subprocess.stdout?.pipe(writeStream);
    
    subprocess.on('close', () => console.log('Audio Download complete'));
    subprocess.on('error', (err) => console.log('Download error', err));
    
  } catch (err: any) {
    console.log("ERROR:", err.message);
  }
}

test();
