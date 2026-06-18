import play from 'play-dl';

async function run() {
  try {
    const info = await play.video_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    const formats = info.format;
    console.log(formats.slice(0, 3));
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

run();
