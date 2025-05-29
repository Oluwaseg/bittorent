# BitTorrent Web Client

A modern, web-based BitTorrent client built with Node.js featuring pause/resume functionality, real-time progress tracking, and support for both HTTP/HTTPS and UDP trackers.

![BitTorrent Web Client](https://img.shields.io/badge/BitTorrent-Web%20Client-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- 🌐 **Web-based Interface** - Modern, responsive UI accessible from any browser
- ⏸️ **Pause/Resume** - Full control over download state
- 📊 **Real-time Progress** - Live updates via WebSocket connection
- 🔄 **Multi-tracker Support** - HTTP/HTTPS and UDP tracker protocols
- 👥 **Peer Management** - Visual peer connection status
- 📱 **Mobile Friendly** - Responsive design works on all devices
- 🌙 **Dark/Light Mode** - Toggle between themes
- 📁 **Drag & Drop** - Easy torrent file uploads

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bittorrent-web-client

# Install dependencies
npm install

# Start the web server
npm start
```

The web interface will be available at `http://localhost:3001`

### Usage

1. **Upload a torrent**: Drag & drop a `.torrent` file or click "Add Torrent"
2. **Monitor progress**: Watch real-time download progress and peer connections
3. **Control downloads**: Use pause/resume/cancel buttons
4. **Download files**: Access completed files from the downloads directory

## 📁 Project Structure

```
bittorrent-web-client/
├── src/
│   ├── core/                 # Core BitTorrent implementation
│   │   ├── torrent-parser.js # Torrent file parsing
│   │   ├── tracker.js        # Tracker communication (HTTP/UDP)
│   │   ├── enhanced-download.js # Advanced download manager with pause/resume
│   │   ├── message.js        # BitTorrent protocol messages
│   │   ├── Pieces.js         # Piece tracking and verification
│   │   ├── Queue.js          # Download queue management
│   │   └── util.js           # Utility functions
│   ├── web/                  # Web interface
│   │   ├── server.js         # Express server & API
│   │   └── public/           # Frontend assets
│   │       └── index.html    # React-based UI
│   └── index.js              # Main entry point
├── docs/                     # Documentation
├── tests/                    # Test files
├── examples/                 # Example files
├── uploads/                  # Uploaded torrent files
├── downloads/                # Downloaded content
└── package.json
```

## 🔧 API Reference

### REST Endpoints

- `POST /api/upload-torrent` - Upload torrent file
- `POST /api/start-download` - Start download
- `GET /api/downloads` - Get download status
- `PATCH /api/downloads/:id/pause` - Pause download
- `PATCH /api/downloads/:id/resume` - Resume download
- `DELETE /api/downloads/:id` - Cancel download

### WebSocket Events

- `downloadUpdate` - Real-time download progress
- `downloadsUpdate` - Active downloads and history

## 🛠️ Development

```bash
# Development with auto-reload
npm run dev

# Run tests
npm test

# Run demo
npm run demo
```

## 📖 Documentation

Detailed documentation is available in the `docs/` directory:

- [API Documentation](docs/API.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Usage Guide](docs/USAGE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built following the BitTorrent protocol specification
- Inspired by educational BitTorrent implementations
- Uses modern web technologies for the interface

## 🐛 Known Issues

- Currently supports single-file torrents only
- No upload functionality (download-only client)
- Basic error handling for network issues

## 🔮 Future Enhancements

- Multi-file torrent support
- Upload/seeding functionality
- Download resume after restart
- Advanced peer management
- Bandwidth limiting
- Magnet link support
