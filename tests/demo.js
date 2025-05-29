#!/usr/bin/env node
'use strict';

console.log('🌟 BitTorrent Client Demo');
console.log('========================\n');

console.log('What is BitTorrent?');
console.log('- Downloads large files in PIECES from many people');
console.log('- You can PAUSE and RESUME downloads');
console.log('- Faster with more people sharing');
console.log('- Perfect for large files like movies, games, software\n');

console.log('How to use this BitTorrent client:');
console.log('==================================\n');

console.log('1. Get a .torrent file:');
console.log('   - Download from legal sources like:');
console.log('     • Ubuntu ISO: https://ubuntu.com/download/alternative-downloads');
console.log('     • Internet Archive: https://archive.org');
console.log('     • Creative Commons content');
console.log('');

console.log('2. Run the client:');
console.log('   node index.js <torrent-file> [output-name]');
console.log('');

console.log('3. Examples:');
console.log('   node index.js ubuntu.torrent');
console.log('   node index.js movie.torrent my-movie.mp4');
console.log('   node index.js game.torrent my-game.zip');
console.log('');

console.log('What you\'ll see when downloading:');
console.log('- "Contacting tracker" - Finding people who have the file');
console.log('- "Found X peers" - Found X people to download from');
console.log('- "Connected to peer" - Connected to someone');
console.log('- "Received piece X" - Got a piece of the file');
console.log('- "DONE!" - File completely downloaded');
console.log('');

console.log('Why BitTorrent is cool:');
console.log('- If you pause (Ctrl+C) and restart, it continues where it left off');
console.log('- Downloads from multiple people at once = FASTER');
console.log('- The more popular the file, the faster it downloads');
console.log('- Works even if some people disconnect');
console.log('');

console.log('To try it out:');
console.log('1. Find a small .torrent file (like Ubuntu ISO)');
console.log('2. Run: node index.js <your-torrent-file>');
console.log('3. Watch the magic happen! 🎉');
console.log('');

console.log('Need help? Check these files:');
console.log('- README.md - Basic info');
console.log('- USAGE.md - Detailed guide');
console.log('- IMPLEMENTATION.md - How it works technically');
