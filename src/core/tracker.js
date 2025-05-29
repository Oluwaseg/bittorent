'use strict';

const dgram = require('dgram');
const http = require('http');
const https = require('https');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto');
const torrentParser = require('./torrent-parser');
const util = require('./util');

module.exports.getPeers = (torrent, callback) => {
  const url = torrent.announce.toString('utf8');
  const parsedUrl = urlParse(url);

  console.log(`Contacting tracker: ${url}`);

  // Determine protocol and use appropriate method
  if (parsedUrl.protocol === 'udp:') {
    getUdpPeers(torrent, url, callback);
  } else if (
    parsedUrl.protocol === 'http:' ||
    parsedUrl.protocol === 'https:'
  ) {
    getHttpPeers(torrent, url, callback);
  } else {
    console.error(`Unsupported tracker protocol: ${parsedUrl.protocol}`);
    callback([]);
  }
};

function getHttpPeers(torrent, url, callback) {
  const parsedUrl = urlParse(url);
  const httpModule = parsedUrl.protocol === 'https:' ? https : http;

  // Build query parameters for HTTP tracker
  const infoHash = torrentParser.infoHash(torrent);
  const peerId = util.genId();
  const left = torrentParser.size(torrent);

  // URL encode the binary data properly
  function urlEncodeBuffer(buffer) {
    return Array.from(buffer)
      .map((byte) => '%' + byte.toString(16).padStart(2, '0'))
      .join('');
  }

  const queryParams = [
    `info_hash=${urlEncodeBuffer(infoHash)}`,
    `peer_id=${urlEncodeBuffer(peerId)}`,
    `port=6881`,
    `uploaded=0`,
    `downloaded=0`,
    `left=${left.readUInt32BE(0)}`,
    `compact=1`,
    `event=started`,
  ].join('&');

  const requestUrl = `${url}?${queryParams}`;

  console.log('Making HTTP tracker request...');
  console.log('Request URL:', requestUrl);

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: `${parsedUrl.path}?${queryParams}`,
    method: 'GET',
    headers: {
      'User-Agent': 'BitTorrent/1.0',
      Accept: '*/*',
      Connection: 'close',
    },
    timeout: 15000,
    // For HTTPS, ignore certificate errors (many trackers have self-signed certs)
    rejectUnauthorized: false,
  };

  console.log('Request options:', JSON.stringify(options, null, 2));

  const request = httpModule.request(options, (response) => {
    let data = Buffer.alloc(0);

    response.on('data', (chunk) => {
      data = Buffer.concat([data, chunk]);
    });

    response.on('end', () => {
      try {
        const bencode = require('bencode');
        const decoded = bencode.decode(data);

        if (decoded['failure reason']) {
          console.error('Tracker error:', decoded['failure reason'].toString());
          callback([]);
          return;
        }

        const peers = parseHttpPeers(decoded.peers);
        console.log(`Found ${peers.length} peers from HTTP tracker`);
        callback(peers);
      } catch (error) {
        console.error('Error parsing HTTP tracker response:', error.message);
        callback([]);
      }
    });
  });

  request.on('error', (error) => {
    console.error('HTTP tracker request error:', error.message);
    callback([]);
  });

  request.on('timeout', () => {
    console.log('HTTP tracker request timeout');
    request.destroy();
    callback([]);
  });

  request.end();
}

function parseHttpPeers(peersBuffer) {
  const peers = [];

  if (Buffer.isBuffer(peersBuffer)) {
    // Compact format: 6 bytes per peer (4 bytes IP + 2 bytes port)
    for (let i = 0; i < peersBuffer.length; i += 6) {
      if (i + 6 <= peersBuffer.length) {
        const ip = Array.from(peersBuffer.slice(i, i + 4)).join('.');
        const port = peersBuffer.readUInt16BE(i + 4);
        peers.push({ ip, port });
      }
    }
  }

  return peers;
}

function getUdpPeers(torrent, url, callback) {
  const socket = dgram.createSocket('udp4');

  socket.on('error', (err) => {
    console.error('Tracker socket error:', err.message);
    callback([]);
  });

  // Set timeout for tracker response
  const timeout = setTimeout(() => {
    console.log('UDP tracker request timeout');
    socket.close();
    callback([]);
  }, 15000);

  // 1. send connect request
  udpSend(socket, buildConnReq(), url);

  socket.on('message', (response) => {
    clearTimeout(timeout);

    if (respType(response) === 'connect') {
      console.log('Received connect response from tracker');
      // 2. receive and parse connect response
      const connResp = parseConnResp(response);
      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === 'announce') {
      console.log('Received announce response from tracker');
      // 4. parse announce response
      const announceResp = parseAnnounceResp(response);
      console.log(`Found ${announceResp.peers.length} peers`);
      // 5. pass peers to callback
      socket.close();
      callback(announceResp.peers);
    }
  });
}

function udpSend(socket, message, rawUrl, callback = () => {}) {
  const url = urlParse(rawUrl);
  // Default port for UDP trackers is typically 80 for HTTP and 443 for HTTPS
  // But most UDP trackers use custom ports, so we'll default to 80 if no port is specified
  const port = url.port || (url.protocol === 'https:' ? 443 : 80);
  socket.send(message, 0, message.length, port, url.hostname, callback);
}

function respType(resp) {
  const action = resp.readUInt32BE(0);
  if (action === 0) return 'connect';
  if (action === 1) return 'announce';
}

function buildConnReq() {
  const buf = Buffer.alloc(16);

  // connection id
  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);
  // action
  buf.writeUInt32BE(0, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 12);

  return buf;
}

function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.slice(8),
  };
}

function buildAnnounceReq(connId, torrent, port = 6881) {
  const buf = Buffer.alloc(98);

  // connection id
  connId.copy(buf, 0);
  // action
  buf.writeUInt32BE(1, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 12);
  // info hash
  torrentParser.infoHash(torrent).copy(buf, 16);
  // peerId
  util.genId().copy(buf, 36);
  // downloaded
  Buffer.alloc(8).copy(buf, 56);
  // left
  torrentParser.size(torrent).copy(buf, 64);
  // uploaded
  Buffer.alloc(8).copy(buf, 72);
  // event
  buf.writeUInt32BE(0, 80);
  // ip address
  buf.writeUInt32BE(0, 84);
  // key
  crypto.randomBytes(4).copy(buf, 88);
  // num want
  buf.writeInt32BE(-1, 92);
  // port
  buf.writeUInt16BE(port, 96);

  return buf;
}

function parseAnnounceResp(resp) {
  function group(iterable, groupSize) {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map((address) => {
      return {
        ip: address.slice(0, 4).join('.'),
        port: address.readUInt16BE(4),
      };
    }),
  };
}
