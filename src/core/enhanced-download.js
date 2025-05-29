'use strict';

const fs = require('fs');
const net = require('net');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const tracker = require('./tracker');
const message = require('./message');
const Pieces = require('./Pieces');
const Queue = require('./Queue');

class EnhancedDownloader {
  constructor(socketIO) {
    this.socketIO = socketIO;
    this.activeDownloads = new Map();
    this.downloadHistory = [];
    this.downloadStats = new Map();
  }

  startDownload(torrent, outputPath, downloadId = null) {
    const id = downloadId || uuidv4();
    const startTime = Date.now();

    const downloadInfo = {
      id,
      torrent,
      outputPath,
      startTime,
      status: 'starting',
      progress: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      peers: [],
      pieces: null,
      file: null,
      connectedPeers: 0,
      totalPeers: 0,
      downloadedBytes: 0,
      totalBytes: this.calculateTotalSize(torrent),
      eta: null,
    };

    this.activeDownloads.set(id, downloadInfo);
    this.emitUpdate(id, downloadInfo);

    // Start the download process
    this.initializeDownload(id, torrent, outputPath);

    return id;
  }

  calculateTotalSize(torrent) {
    return torrent.info.files
      ? torrent.info.files.reduce((total, file) => total + file.length, 0)
      : torrent.info.length;
  }

  initializeDownload(downloadId, torrent, outputPath) {
    const downloadInfo = this.activeDownloads.get(downloadId);

    tracker.getPeers(torrent, (peers) => {
      if (!this.activeDownloads.has(downloadId)) return; // Download was cancelled

      downloadInfo.totalPeers = peers.length;
      downloadInfo.status = 'downloading';
      downloadInfo.pieces = new Pieces(torrent);

      try {
        downloadInfo.file = fs.openSync(outputPath, 'w');
      } catch (error) {
        downloadInfo.status = 'error';
        downloadInfo.error = error.message;
        this.emitUpdate(downloadId, downloadInfo);
        return;
      }

      this.emitUpdate(downloadId, downloadInfo);

      // Connect to peers
      peers.forEach((peer) => {
        if (downloadInfo.connectedPeers < 10) {
          // Limit concurrent connections
          this.connectToPeer(downloadId, peer, torrent);
        }
      });
    });
  }

  connectToPeer(downloadId, peer, torrent) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (
      !downloadInfo ||
      downloadInfo.status === 'cancelled' ||
      downloadInfo.status === 'paused'
    )
      return;

    const socket = new net.Socket();
    const peerInfo = {
      ip: peer.ip,
      port: peer.port,
      connected: false,
      downloadSpeed: 0,
      uploadSpeed: 0,
    };

    socket.on('error', (err) => {
      console.log(`Peer ${peer.ip}:${peer.port} error: ${err.message}`);
      this.removePeer(downloadId, peerInfo);
    });

    socket.setTimeout(10000);
    socket.on('timeout', () => {
      console.log(`Peer ${peer.ip}:${peer.port} timeout`);
      socket.destroy();
      this.removePeer(downloadId, peerInfo);
    });

    socket.connect(peer.port, peer.ip, () => {
      if (!this.activeDownloads.has(downloadId)) {
        socket.destroy();
        return;
      }

      peerInfo.connected = true;
      downloadInfo.connectedPeers++;
      downloadInfo.peers.push(peerInfo);

      console.log(`Connected to peer ${peer.ip}:${peer.port}`);
      socket.write(message.buildHandshake(torrent));

      this.emitUpdate(downloadId, downloadInfo);
    });

    const queue = new Queue(torrent);
    this.onWholeMsg(socket, (msg) =>
      this.msgHandler(msg, socket, downloadId, queue, torrent, peerInfo)
    );
  }

  removePeer(downloadId, peerInfo) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (!downloadInfo) return;

    const index = downloadInfo.peers.indexOf(peerInfo);
    if (index > -1) {
      downloadInfo.peers.splice(index, 1);
      if (peerInfo.connected) {
        downloadInfo.connectedPeers--;
      }
      this.emitUpdate(downloadId, downloadInfo);
    }
  }

  onWholeMsg(socket, callback) {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    socket.on('data', (recvBuf) => {
      const msgLen = () =>
        handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
      savedBuf = Buffer.concat([savedBuf, recvBuf]);

      while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
        callback(savedBuf.slice(0, msgLen()));
        savedBuf = savedBuf.slice(msgLen());
        handshake = false;
      }
    });
  }

  msgHandler(msg, socket, downloadId, queue, torrent, peerInfo) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (!downloadInfo || downloadInfo.status === 'cancelled') {
      socket.destroy();
      return;
    }

    if (this.isHandshake(msg)) {
      socket.write(message.buildInterested());
    } else {
      const m = message.parse(msg);

      if (m.id === 0) this.chokeHandler(socket);
      if (m.id === 1) this.unchokeHandler(socket, downloadInfo.pieces, queue);
      if (m.id === 4)
        this.haveHandler(socket, downloadInfo.pieces, queue, m.payload);
      if (m.id === 5)
        this.bitfieldHandler(socket, downloadInfo.pieces, queue, m.payload);
      if (m.id === 7)
        this.pieceHandler(
          socket,
          downloadId,
          queue,
          torrent,
          m.payload,
          peerInfo
        );
    }
  }

  isHandshake(msg) {
    return (
      msg.length === msg.readUInt8(0) + 49 &&
      msg.toString('utf8', 1, 20) === 'BitTorrent protocol'
    );
  }

  chokeHandler(socket) {
    socket.end();
  }

  unchokeHandler(socket, pieces, queue) {
    queue.choked = false;
    this.requestPiece(socket, pieces, queue);
  }

  haveHandler(socket, pieces, queue, payload) {
    const pieceIndex = payload.readUInt32BE(0);
    const queueEmpty = queue.length() === 0;
    queue.queue(pieceIndex);
    if (queueEmpty) this.requestPiece(socket, pieces, queue);
  }

  bitfieldHandler(socket, pieces, queue, payload) {
    const queueEmpty = queue.length() === 0;
    payload.forEach((byte, i) => {
      for (let j = 0; j < 8; j++) {
        if (byte % 2) queue.queue(i * 8 + 7 - j);
        byte = Math.floor(byte / 2);
      }
    });
    if (queueEmpty) this.requestPiece(socket, pieces, queue);
  }

  pieceHandler(socket, downloadId, queue, torrent, pieceResp, peerInfo) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (!downloadInfo) return;

    downloadInfo.pieces.addReceived(pieceResp);
    downloadInfo.downloadedBytes += pieceResp.block.length;

    // Update peer stats
    peerInfo.downloadSpeed = this.calculateSpeed(
      peerInfo,
      pieceResp.block.length
    );

    // Calculate overall progress
    downloadInfo.progress =
      (downloadInfo.downloadedBytes / downloadInfo.totalBytes) * 100;
    downloadInfo.downloadSpeed = this.calculateOverallSpeed(downloadInfo);
    downloadInfo.eta = this.calculateETA(downloadInfo);

    const offset =
      pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
    fs.write(
      downloadInfo.file,
      pieceResp.block,
      0,
      pieceResp.block.length,
      offset,
      () => {}
    );

    // Emit real-time update
    this.emitUpdate(downloadId, downloadInfo);

    if (downloadInfo.pieces.isDone()) {
      this.completeDownload(downloadId);
    } else {
      this.requestPiece(socket, downloadInfo.pieces, queue, downloadId);
    }
  }

  calculateSpeed(peerInfo, bytes) {
    const now = Date.now();
    if (!peerInfo.lastUpdate) {
      peerInfo.lastUpdate = now;
      peerInfo.bytesThisSecond = bytes;
      return 0;
    }

    const timeDiff = now - peerInfo.lastUpdate;
    if (timeDiff >= 1000) {
      const speed = (peerInfo.bytesThisSecond || 0) / (timeDiff / 1000);
      peerInfo.lastUpdate = now;
      peerInfo.bytesThisSecond = bytes;
      return speed;
    } else {
      peerInfo.bytesThisSecond = (peerInfo.bytesThisSecond || 0) + bytes;
      return peerInfo.downloadSpeed || 0;
    }
  }

  calculateOverallSpeed(downloadInfo) {
    return downloadInfo.peers.reduce(
      (total, peer) => total + (peer.downloadSpeed || 0),
      0
    );
  }

  calculateETA(downloadInfo) {
    if (downloadInfo.downloadSpeed === 0) return null;
    const remainingBytes =
      downloadInfo.totalBytes - downloadInfo.downloadedBytes;
    return Math.round(remainingBytes / downloadInfo.downloadSpeed);
  }

  completeDownload(downloadId) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (!downloadInfo) return;

    downloadInfo.status = 'completed';
    downloadInfo.progress = 100;
    downloadInfo.completedAt = Date.now();

    try {
      fs.closeSync(downloadInfo.file);
    } catch (e) {}

    // Add to history
    this.downloadHistory.push({
      id: downloadId,
      name: downloadInfo.torrent.info.name.toString('utf8'),
      size: downloadInfo.totalBytes,
      startTime: downloadInfo.startTime,
      completedAt: downloadInfo.completedAt,
      downloadTime: downloadInfo.completedAt - downloadInfo.startTime,
    });

    this.emitUpdate(downloadId, downloadInfo);
    console.log(`Download ${downloadId} completed!`);
  }

  requestPiece(socket, pieces, queue, downloadId = null) {
    if (queue.choked) return null;

    // Check if download is paused
    if (downloadId) {
      const downloadInfo = this.activeDownloads.get(downloadId);
      if (
        !downloadInfo ||
        downloadInfo.status === 'paused' ||
        downloadInfo.status === 'cancelled'
      ) {
        return null;
      }
    }

    while (queue.length()) {
      const pieceBlock = queue.deque();
      if (pieces.needed(pieceBlock)) {
        socket.write(message.buildRequest(pieceBlock));
        pieces.addRequested(pieceBlock);
        break;
      }
    }
  }

  emitUpdate(downloadId, downloadInfo) {
    this.socketIO.emit('downloadUpdate', {
      id: downloadId,
      status: downloadInfo.status,
      progress: downloadInfo.progress,
      downloadSpeed: downloadInfo.downloadSpeed,
      connectedPeers: downloadInfo.connectedPeers,
      totalPeers: downloadInfo.totalPeers,
      downloadedBytes: downloadInfo.downloadedBytes,
      totalBytes: downloadInfo.totalBytes,
      eta: downloadInfo.eta,
      peers: downloadInfo.peers.map((p) => ({
        ip: p.ip,
        port: p.port,
        connected: p.connected,
        downloadSpeed: p.downloadSpeed,
      })),
    });
  }

  pauseDownload(downloadId) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (!downloadInfo) return false;

    if (downloadInfo.status === 'downloading') {
      downloadInfo.status = 'paused';
      downloadInfo.pausedAt = Date.now();
      this.emitUpdate(downloadId, downloadInfo);
      return true;
    }
    return false;
  }

  resumeDownload(downloadId) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (!downloadInfo) return false;

    if (downloadInfo.status === 'paused') {
      downloadInfo.status = 'downloading';
      delete downloadInfo.pausedAt;
      this.emitUpdate(downloadId, downloadInfo);
      return true;
    }
    return false;
  }

  cancelDownload(downloadId) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (!downloadInfo) return false;

    downloadInfo.status = 'cancelled';

    try {
      if (downloadInfo.file) {
        fs.closeSync(downloadInfo.file);
      }
    } catch (e) {}

    this.activeDownloads.delete(downloadId);
    this.emitUpdate(downloadId, downloadInfo);
    return true;
  }

  getActiveDownloads() {
    return Array.from(this.activeDownloads.values()).map((d) => ({
      id: d.id,
      name: d.torrent.info.name.toString('utf8'),
      status: d.status,
      progress: d.progress,
      downloadSpeed: d.downloadSpeed,
      connectedPeers: d.connectedPeers,
      totalPeers: d.totalPeers,
    }));
  }

  getDownloadHistory() {
    return this.downloadHistory;
  }
}

module.exports = EnhancedDownloader;
