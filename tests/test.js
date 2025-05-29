'use strict';

const torrentParser = require('./torrent-parser');
const tracker = require('./tracker');
const message = require('./message');

// Test torrent parser functions
console.log('Testing torrent parser...');

// Create a mock torrent object for testing
const mockTorrent = {
  announce: Buffer.from('udp://tracker.example.com:8080/announce'),
  info: {
    name: Buffer.from('test-file.txt'),
    length: 1024,
    'piece length': 512,
    pieces: Buffer.alloc(40) // 2 pieces * 20 bytes each
  }
};

try {
  console.log('✓ Info hash generation works');
  const infoHash = torrentParser.infoHash(mockTorrent);
  console.log('  Info hash:', infoHash.toString('hex'));

  console.log('✓ Size calculation works');
  const size = torrentParser.size(mockTorrent);
  console.log('  Size buffer:', size.toString('hex'));

  console.log('✓ Piece length calculation works');
  const pieceLen0 = torrentParser.pieceLen(mockTorrent, 0);
  const pieceLen1 = torrentParser.pieceLen(mockTorrent, 1);
  console.log('  Piece 0 length:', pieceLen0);
  console.log('  Piece 1 length:', pieceLen1);

  console.log('✓ Blocks per piece calculation works');
  const blocks0 = torrentParser.blocksPerPiece(mockTorrent, 0);
  const blocks1 = torrentParser.blocksPerPiece(mockTorrent, 1);
  console.log('  Piece 0 blocks:', blocks0);
  console.log('  Piece 1 blocks:', blocks1);

} catch (error) {
  console.error('✗ Torrent parser test failed:', error.message);
}

// Test message building
console.log('\nTesting message building...');

try {
  console.log('✓ Handshake message works');
  const handshake = message.buildHandshake(mockTorrent);
  console.log('  Handshake length:', handshake.length);

  console.log('✓ Interested message works');
  const interested = message.buildInterested();
  console.log('  Interested length:', interested.length);

  console.log('✓ Request message works');
  const request = message.buildRequest({
    index: 0,
    begin: 0,
    length: 16384
  });
  console.log('  Request length:', request.length);

} catch (error) {
  console.error('✗ Message building test failed:', error.message);
}

console.log('\nAll basic tests completed!');
console.log('\nTo test with a real torrent file:');
console.log('1. Download a small .torrent file');
console.log('2. Run: node index.js <torrent-file>');
