'use strict';

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const torrentParser = require('../core/torrent-parser');
const EnhancedDownloader = require('../core/enhanced-download');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const downloadsDir = path.join(__dirname, '../../downloads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.torrent')) {
      cb(null, true);
    } else {
      cb(new Error('Only .torrent files are allowed!'), false);
    }
  },
});

// Initialize enhanced downloader
const downloader = new EnhancedDownloader(io);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BitTorrent Web Client is running!' });
});

app.post('/api/upload-torrent', upload.single('torrent'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No torrent file uploaded' });
    }

    const torrentPath = req.file.path;
    const torrent = torrentParser.open(torrentPath);

    // Extract torrent info
    const torrentInfo = {
      name: torrent.info.name.toString('utf8'),
      size: torrent.info.files
        ? torrent.info.files.reduce((total, file) => total + file.length, 0)
        : torrent.info.length,
      files: torrent.info.files
        ? torrent.info.files.map((f) => ({
            path: f.path.map((p) => p.toString('utf8')).join('/'),
            length: f.length,
          }))
        : [
            {
              path: torrent.info.name.toString('utf8'),
              length: torrent.info.length,
            },
          ],
      announce: torrent.announce.toString('utf8'),
      pieceLength: torrent.info['piece length'],
      pieces: torrent.info.pieces.length / 20,
      infoHash: torrentParser.infoHash(torrent).toString('hex'),
    };

    res.json({
      success: true,
      torrentInfo,
      filePath: torrentPath,
    });
  } catch (error) {
    console.error('Error processing torrent:', error);
    res.status(500).json({ error: 'Failed to process torrent file' });
  }
});

app.post('/api/start-download', (req, res) => {
  try {
    const { torrentPath, outputName } = req.body;

    if (!torrentPath || !fs.existsSync(torrentPath)) {
      return res.status(400).json({ error: 'Invalid torrent file path' });
    }

    const torrent = torrentParser.open(torrentPath);
    const fileName = outputName || torrent.info.name.toString('utf8');
    const outputPath = path.join(downloadsDir, fileName);

    const downloadId = downloader.startDownload(torrent, outputPath);

    res.json({
      success: true,
      downloadId,
      message: 'Download started successfully',
    });
  } catch (error) {
    console.error('Error starting download:', error);
    res.status(500).json({ error: 'Failed to start download' });
  }
});

app.get('/api/downloads', (req, res) => {
  try {
    const activeDownloads = downloader.getActiveDownloads();
    const downloadHistory = downloader.getDownloadHistory();

    res.json({
      active: activeDownloads,
      history: downloadHistory,
    });
  } catch (error) {
    console.error('Error getting downloads:', error);
    res.status(500).json({ error: 'Failed to get downloads' });
  }
});

app.patch('/api/downloads/:id/pause', (req, res) => {
  try {
    const { id } = req.params;
    const success = downloader.pauseDownload(id);

    if (success) {
      res.json({ success: true, message: 'Download paused' });
    } else {
      res.status(404).json({ error: 'Download not found or cannot be paused' });
    }
  } catch (error) {
    console.error('Error pausing download:', error);
    res.status(500).json({ error: 'Failed to pause download' });
  }
});

app.patch('/api/downloads/:id/resume', (req, res) => {
  try {
    const { id } = req.params;
    const success = downloader.resumeDownload(id);

    if (success) {
      res.json({ success: true, message: 'Download resumed' });
    } else {
      res
        .status(404)
        .json({ error: 'Download not found or cannot be resumed' });
    }
  } catch (error) {
    console.error('Error resuming download:', error);
    res.status(500).json({ error: 'Failed to resume download' });
  }
});

app.delete('/api/downloads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = downloader.cancelDownload(id);

    if (success) {
      res.json({ success: true, message: 'Download cancelled' });
    } else {
      res.status(404).json({ error: 'Download not found' });
    }
  } catch (error) {
    console.error('Error cancelling download:', error);
    res.status(500).json({ error: 'Failed to cancel download' });
  }
});

app.get('/api/download-file/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(downloadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send current downloads to new client
  socket.emit('downloadsUpdate', {
    active: downloader.getActiveDownloads(),
    history: downloader.getDownloadHistory(),
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 BitTorrent Web Client running on http://localhost:${PORT}`);
  console.log('📁 Uploads directory:', uploadsDir);
  console.log('📁 Downloads directory:', downloadsDir);
});

module.exports = { app, server, io };
