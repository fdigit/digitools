import { videoInfo } from 'youtube-ext';
import https from 'https';

async function run() {
  try {
    const info = await videoInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Combine formats and adaptiveFormats
    const streams = [...(info.stream.formats || []), ...(info.stream.adaptiveFormats || [])];
    
    console.log('Sample format:', streams[0]);
    console.log('Sample adaptive:', info.stream.adaptiveFormats[0]);
    
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

run();
