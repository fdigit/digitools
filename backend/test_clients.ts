import youtubedl from 'youtube-dl-exec';

async function testClient(clientName: string) {
  try {
    const ytdlpOptions: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      extractorArgs: `youtube:player_client=${clientName}`,
    };
    
    console.log(`Testing client: ${clientName}...`);
    const info = await youtubedl('https://www.youtube.com/watch?v=o8AzvvtUM3w', ytdlpOptions);
    console.log(`Success with ${clientName}! Title: ${(info as any).title}`);
    return true;
  } catch (err: any) {
    console.error(`Failed with ${clientName}:`, err.message.split('\n')[0]);
    return false;
  }
}

async function run() {
  const clients = ['ios', 'tv', 'web', 'mweb', 'android_creator'];
  for (const client of clients) {
    const success = await testClient(client);
    if (success) {
      console.log('Found working client:', client);
      break;
    }
  }
}

run();
