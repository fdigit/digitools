import youtubedl from 'youtube-dl-exec';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const cookieString = process.env.YOUTUBE_COOKIE || '';
    // Let's use the raw arguments approach if addHeader object format fails
    const args = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      '--dump-json',
      '--no-warnings',
      '--no-call-home',
      '--no-check-certificate'
    ];
    
    if (cookieString) {
      args.push('--add-header', `Cookie: ${cookieString}`);
    }
    
    console.log('Fetching info using raw args...');
    const subprocess = youtubedl.exec(args[0], args.slice(1) as any);
    
    let stdout = '';
    subprocess.stdout?.on('data', chunk => stdout += chunk);
    subprocess.stderr?.on('data', chunk => console.error('STDERR:', chunk.toString()));
    
    await new Promise((resolve, reject) => {
      subprocess.on('close', code => {
        if (code === 0) resolve(null);
        else reject(new Error('Process exited with code ' + code));
      });
    });
    
    const info = JSON.parse(stdout);
    console.log('Success!', info.title);
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

run();
