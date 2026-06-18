import youtubedl from 'youtube-dl-exec';

async function testClient() {
  try {
    const ytdlpOptions: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      extractorArgs: `youtube:player_client=android`,
    };
    
    console.log(`Testing video o8AzvvtUM3w with android client...`);
    const info = await youtubedl('https://www.youtube.com/watch?v=o8AzvvtUM3w', ytdlpOptions);
    console.log(`Success! Title: ${(info as any).title}`);
    return true;
  } catch (err: any) {
    console.error(`Failed:`, err.message);
    return false;
  }
}

testClient();
