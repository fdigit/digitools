import youtubedl from 'youtube-dl-exec';

async function run() {
  try {
    const ytdlpOptions: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      extractorArgs: 'youtube:player_client=android',
    };
    
    console.log('Fetching info using yt-dlp with android client spoofing...');
    const info = await youtubedl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', ytdlpOptions);
    console.log('Success!', (info as any).title);
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

run();
