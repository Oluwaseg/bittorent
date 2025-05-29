# BitTorrent Client

A simple BitTorrent client implementation in Node.js, following the BitTorrent protocol specification.

## Features

- **Torrent file parsing**: Supports bencode format used in .torrent files
- **Tracker communication**: UDP protocol support for getting peer lists
- **Peer-to-peer communication**: TCP connections for file transfer
- **Piece/block management**: Efficient handling of file chunks
- **Multi-peer downloading**: Connects to multiple peers simultaneously

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

```bash
node index.js <torrent-file> [output-path]
```

### Parameters

- `<torrent-file>`: Path to the .torrent file you want to download
- `[output-path]`: Optional. Path where the downloaded file will be saved. If not specified, uses the original filename from the torrent.

### Examples

```bash
# Download using original filename
node index.js example.torrent

# Download to specific path
node index.js example.torrent ./downloads/myfile.txt
```

## How it works

1. **Parse torrent file**: Extracts metadata including tracker URL, file info, and piece hashes
2. **Contact tracker**: Sends UDP requests to get list of peers sharing the file
3. **Connect to peers**: Establishes TCP connections with available peers
4. **Download pieces**: Requests and downloads file pieces from multiple peers
5. **Reconstruct file**: Assembles downloaded pieces into the complete file

## Protocol Implementation

This client implements the core BitTorrent protocol including:

- **Bencode encoding/decoding** for torrent file parsing
- **UDP tracker protocol** for peer discovery
- **BitTorrent peer protocol** for file transfer
- **Piece and block management** for efficient downloading
- **Connection management** with multiple peers

## File Structure

- `index.js` - Main entry point
- `torrent-parser.js` - Torrent file parsing and metadata extraction
- `tracker.js` - UDP tracker communication
- `download.js` - Main download logic and peer management
- `message.js` - BitTorrent protocol message handling
- `Pieces.js` - Track downloaded pieces and blocks
- `Queue.js` - Manage download queue per peer
- `util.js` - Utility functions

## Limitations

- Currently supports single-file torrents only
- No upload functionality (download-only client)
- No resume capability for interrupted downloads
- Basic error handling

## Educational Purpose

This implementation is based on the tutorial at:
https://allenkim67.github.io/programming/2016/05/04/how-to-make-your-own-bittorrent-client.html

It's designed for educational purposes to understand how the BitTorrent protocol works.

## License

MIT License
