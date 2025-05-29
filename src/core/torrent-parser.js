'use strict';

const fs = require('fs');
const bencode = require('bencode');
const crypto = require('crypto');

module.exports.BLOCK_LEN = Math.pow(2, 14);

module.exports.open = (filepath) => {
  return bencode.decode(fs.readFileSync(filepath));
};

module.exports.size = torrent => {
  const size = torrent.info.files ?
    torrent.info.files.map(file => file.length).reduce((a, b) => a + b) :
    torrent.info.length;

  return bigIntToBuffer(BigInt(size), 8);
};

module.exports.infoHash = torrent => {
  const info = bencode.encode(torrent.info);
  return crypto.createHash('sha1').update(info).digest();
};

module.exports.pieceLen = (torrent, pieceIndex) => {
  const totalLength = bufferToBigInt(module.exports.size(torrent));
  const pieceLength = torrent.info['piece length'];

  const lastPieceLength = Number(totalLength % BigInt(pieceLength));
  const lastPieceIndex = Number(totalLength / BigInt(pieceLength));

  return lastPieceIndex === pieceIndex ? lastPieceLength : pieceLength;
};

module.exports.blocksPerPiece = (torrent, pieceIndex) => {
  const pieceLength = module.exports.pieceLen(torrent, pieceIndex);
  return Math.ceil(pieceLength / module.exports.BLOCK_LEN);
};

module.exports.blockLen = (torrent, pieceIndex, blockIndex) => {
  const pieceLength = module.exports.pieceLen(torrent, pieceIndex);

  const lastBlockLength = pieceLength % module.exports.BLOCK_LEN;
  const lastBlockIndex = Math.floor(pieceLength / module.exports.BLOCK_LEN);

  return blockIndex === lastBlockIndex ? lastBlockLength : module.exports.BLOCK_LEN;
};

// Helper functions to handle BigInt and Buffer conversion
function bigIntToBuffer(bigint, size) {
  const buf = Buffer.alloc(size);
  let hex = bigint.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  
  const hexBuf = Buffer.from(hex, 'hex');
  hexBuf.copy(buf, size - hexBuf.length);
  return buf;
}

function bufferToBigInt(buf) {
  return BigInt('0x' + buf.toString('hex'));
}
