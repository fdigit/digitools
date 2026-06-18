import { videoInfo } from 'youtube-ext';

async function run() {
  try {
    const info = await videoInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.log(Object.keys(info.stream![0]));
    console.log(info.stream![0].url);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

run();
