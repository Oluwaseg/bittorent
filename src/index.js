#!/usr/bin/env node
'use strict';

/**
 * BitTorrent Web Client
 * A modern web-based BitTorrent client with pause/resume functionality
 */

const path = require('path');

// Main entry point - start the web server
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
BitTorrent Web Client

Usage:
  npm start                 Start the web server
  node src/index.js         Start the web server
  node src/index.js --help  Show this help

Features:
  - Web-based torrent client
  - HTTP/HTTPS and UDP tracker support
  - Pause/Resume downloads
  - Real-time progress updates
  - Modern responsive UI

The web interface will be available at http://localhost:3001
    `);
    return;
  }

  // Start the web server
  require('./web/server');
}

if (require.main === module) {
  main();
}

module.exports = {
  // Export core modules for programmatic use
  TorrentParser: require('./core/torrent-parser'),
  Tracker: require('./core/tracker'),
  Downloader: require('./core/enhanced-download'),
  Message: require('./core/message'),
  Pieces: require('./core/Pieces'),
  Queue: require('./core/Queue'),
  Utils: require('./core/util'),
};
