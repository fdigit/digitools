import fs from 'fs';
import youtubedl from 'youtube-dl-exec';
import dotenv from 'dotenv';
dotenv.config();

function createNetscapeCookieFile(rawCookie: string, outputPath: string) {
  const header = "# Netscape HTTP Cookie File\n# http://curl.haxx.se/rfc/cookie_spec.html\n# This is a generated file!  Do not edit.\n\n";
  const lines = rawCookie.split(';').map(cookie => {
    const parts = cookie.trim().split('=');
    const name = parts[0];
    const value = parts.slice(1).join('=');
    if (!name) return '';
    // domain, include_subdomains, path, https, expires, name, value
    return `.youtube.com\tTRUE\t/\tTRUE\t2147483647\t${name}\t${value}`;
  }).filter(line => line.length > 0).join('\n');
  
  fs.writeFileSync(outputPath, header + lines);
}

async function run() {
  try {
    const cookieString = process.env.YOUTUBE_COOKIE || '';
    if (cookieString) {
      createNetscapeCookieFile(cookieString, './youtube-cookies.txt');
    }

    const ytdlpOptions: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      youtubeSkipDashManifest: true,
    };
    
    if (fs.existsSync('./youtube-cookies.txt')) {
      ytdlpOptions.cookies = './youtube-cookies.txt';
    }
    
    console.log('Fetching info using yt-dlp with netscape cookies...');
    const info = await youtubedl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', ytdlpOptions);
    console.log('Success!', (info as any).title);
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

run();
