import youtubedl from 'youtube-dl-exec';

async function testClient() {
  try {
    const ytdlpOptions: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      extractorArgs: `youtube:player_client=ios,android_creator,tv,web`,
    };
    
    console.log(`Testing video 2of1e0CEz3U with multiple clients...`);
    const info = await youtubedl('https://www.youtube.com/watch?v=2of1e0CEz3U', ytdlpOptions);
    console.log(`Success! Title: ${(info as any).title}`);
    return true;
  } catch (err: any) {
    console.error(`Failed:`, err.message);
    return false;
  }
}

testClient();
