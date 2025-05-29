# Architecture Overview

## System Architecture

The BitTorrent Web Client follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Web Server    │    │  Core Engine    │
│                 │    │                 │    │                 │
│  React UI       │◄──►│  Express.js     │◄──►│  BitTorrent     │
│  Socket.IO      │    │  Socket.IO      │    │  Protocol       │
│  REST Client    │    │  REST API       │    │  Implementation │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. Core Engine (`src/core/`)

The heart of the BitTorrent implementation:

#### `torrent-parser.js`
- Parses .torrent files using bencode
- Extracts metadata (name, size, files, trackers)
- Calculates info hash for peer identification

#### `tracker.js`
- Communicates with trackers to find peers
- Supports both HTTP/HTTPS and UDP protocols
- Handles tracker responses and peer lists

#### `enhanced-download.js`
- Main download orchestrator
- Manages multiple concurrent downloads
- Handles peer connections and piece requests
- Implements pause/resume functionality
- Emits real-time progress updates

#### `message.js`
- BitTorrent protocol message handling
- Builds and parses protocol messages
- Handles handshakes, piece requests, etc.

#### `Pieces.js`
- Tracks download progress per piece
- Manages piece verification
- Handles piece completion status

#### `Queue.js`
- Manages download queue per peer
- Prioritizes piece requests
- Handles peer choking/unchoking

#### `util.js`
- Utility functions for the BitTorrent protocol
- ID generation, data conversion, etc.

### 2. Web Layer (`src/web/`)

#### `server.js`
- Express.js web server
- REST API endpoints
- Socket.IO real-time communication
- File upload handling with Multer
- Static file serving

#### `public/index.html`
- Single-page React application
- Modern responsive UI
- Real-time updates via Socket.IO
- Drag & drop file upload
- Download management interface

### 3. Entry Point (`src/index.js`)

- Main application entry point
- Command-line interface
- Module exports for programmatic use

## Data Flow

### Download Process

1. **File Upload**
   ```
   Browser → POST /api/upload-torrent → Server → torrent-parser → Response
   ```

2. **Download Start**
   ```
   Browser → POST /api/start-download → enhanced-download → tracker → peers
   ```

3. **Peer Communication**
   ```
   enhanced-download → TCP connections → BitTorrent protocol → piece exchange
   ```

4. **Progress Updates**
   ```
   enhanced-download → Socket.IO → Browser (real-time updates)
   ```

### Pause/Resume Flow

1. **Pause Request**
   ```
   Browser → PATCH /api/downloads/:id/pause → enhanced-download.pauseDownload()
   ```

2. **Resume Request**
   ```
   Browser → PATCH /api/downloads/:id/resume → enhanced-download.resumeDownload()
   ```

## Key Design Decisions

### 1. Modular Architecture
- Clear separation between core BitTorrent logic and web interface
- Easy to test and maintain individual components
- Allows for future CLI or desktop interfaces

### 2. Real-time Updates
- Socket.IO for instant progress updates
- No need for polling, reduces server load
- Better user experience with live feedback

### 3. Pause/Resume Implementation
- State-based approach (downloading/paused/cancelled)
- Stops piece requests when paused
- Maintains connection state for quick resume

### 4. Multi-tracker Support
- Protocol detection (HTTP/HTTPS vs UDP)
- Fallback mechanisms for tracker failures
- Proper URL encoding for HTTP trackers

### 5. Error Handling
- Graceful degradation on tracker failures
- Peer connection timeout handling
- File system error recovery

## Security Considerations

### 1. File Upload Security
- File type validation (.torrent only)
- File size limits via Multer
- Secure file storage in uploads directory

### 2. Network Security
- HTTPS support for secure tracker communication
- Certificate validation bypass for self-signed certs
- Connection timeouts to prevent hanging

### 3. Input Validation
- Torrent file structure validation
- API parameter validation
- Error message sanitization

## Performance Optimizations

### 1. Concurrent Connections
- Limited peer connections (max 10 per download)
- Efficient piece request queuing
- Connection pooling and reuse

### 2. Memory Management
- Streaming file writes
- Buffer management for large files
- Garbage collection friendly design

### 3. Real-time Updates
- Throttled progress updates
- Efficient data serialization
- Minimal payload sizes

## Scalability Considerations

### 1. Multiple Downloads
- Independent download management
- Resource isolation between downloads
- Configurable connection limits

### 2. Large Files
- Streaming approach for file I/O
- Piece-based progress tracking
- Memory-efficient buffer handling

### 3. High Peer Count
- Connection limiting and prioritization
- Efficient peer management
- Timeout handling for dead connections
