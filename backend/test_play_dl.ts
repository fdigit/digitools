import play from 'play-dl';

async function run() {
  try {
    const info = await play.video_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.log('Title:', info.video_details.title);
    
    // Get streaming formats
    const formats = info.format;
    console.log('Formats found:', formats.length);
    console.log('First format URL:', formats[0]?.url ? 'Yes' : 'No');
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

run();
