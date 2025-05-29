'use strict';

const download = require('./download');
const torrentParser = require('./torrent-parser');

const torrentFile = process.argv[2];
const downloadPath = process.argv[3];

if (!torrentFile) {
  console.log('Usage: node index.js <torrent-file> [download-path]');
  process.exit(1);
}

try {
  const torrent = torrentParser.open(torrentFile);
  const outputPath = downloadPath || torrent.info.name.toString('utf8');
  
  console.log('Starting download...');
  console.log('Torrent:', torrent.info.name.toString('utf8'));
  console.log('Output path:', outputPath);
  
  download(torrent, outputPath);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
