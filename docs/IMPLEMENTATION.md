# BitTorrent Client Implementation

This is a complete BitTorrent client implementation in Node.js, following the tutorial by Allen Kim. The client implements the core BitTorrent protocol and can download files from the BitTorrent network.

## Architecture Overview

### Core Components

1. **index.js** - Main entry point and command-line interface
2. **torrent-parser.js** - Handles .torrent file parsing and metadata extraction
3. **tracker.js** - Implements UDP tracker protocol for peer discovery
4. **download.js** - Main download orchestration and peer management
5. **message.js** - BitTorrent protocol message encoding/decoding
6. **Pieces.js** - Tracks download progress of pieces and blocks
7. **Queue.js** - Manages download queue for each peer connection
8. **util.js** - Utility functions including peer ID generation

### Protocol Implementation

#### 1. Torrent File Parsing (Bencode)
- Decodes .torrent files using bencode format
- Extracts tracker URL, file metadata, and piece information
- Calculates info hash for torrent identification

#### 2. Tracker Communication (UDP)
- Implements BEP 15 (UDP Tracker Protocol)
- Sends connect and announce requests
- Receives peer list from tracker
- Handles connection timeouts and errors

#### 3. Peer Protocol (TCP)
- Establishes TCP connections with peers
- Implements BitTorrent handshake protocol
- Handles peer messages (choke, unchoke, have, bitfield, piece)
- Manages piece requests and responses

#### 4. Piece Management
- Splits files into pieces and blocks (16KB blocks)
- Tracks requested and received pieces
- Handles piece verification and assembly
- Writes completed pieces to disk

## Key Features

### Multi-Peer Downloading
- Connects to multiple peers simultaneously
- Distributes piece requests across peers
- Handles peer disconnections gracefully

### Efficient Block Management
- Downloads pieces in 16KB blocks
- Tracks block-level progress
- Prevents duplicate requests

### Error Handling
- Connection timeouts and retries
- Graceful handling of peer disconnections
- Tracker communication error handling

### File Assembly
- Reconstructs original file from downloaded pieces
- Handles proper file offset calculations
- Ensures data integrity

## Protocol Messages Implemented

### Handshake Messages
- Protocol identification
- Info hash exchange
- Peer ID exchange

### Control Messages
- Keep-alive
- Choke/Unchoke
- Interested/Not Interested

### Data Messages
- Have (piece availability)
- Bitfield (piece availability bitmap)
- Request (piece block request)
- Piece (piece block data)

## Technical Highlights

### Buffer Management
- Efficient binary data handling
- Proper endianness handling
- Memory-efficient streaming

### Asynchronous Programming
- Event-driven architecture
- Non-blocking I/O operations
- Concurrent peer connections

### Network Programming
- UDP socket communication
- TCP socket management
- Protocol state machines

## Limitations and Future Improvements

### Current Limitations
- Single-file torrents only
- Download-only (no seeding)
- No resume capability
- Basic error recovery

### Potential Improvements
- Multi-file torrent support
- Upload/seeding functionality
- DHT (Distributed Hash Table) support
- Magnet link support
- Download resume capability
- Better piece selection algorithms
- GUI interface

## Educational Value

This implementation demonstrates:
- Network protocol implementation
- Binary data manipulation
- Asynchronous programming patterns
- Peer-to-peer networking concepts
- File I/O operations
- Error handling strategies

## Testing

Run the included test suite:
```bash
node test.js
```

Test with a real torrent:
```bash
node index.js <torrent-file> [output-path]
```

## References

- [Original Tutorial](https://allenkim67.github.io/programming/2016/05/04/how-to-make-your-own-bittorrent-client.html)
- [BitTorrent Protocol Specification](https://wiki.theory.org/index.php/BitTorrentSpecification)
- [UDP Tracker Protocol (BEP 15)](http://www.bittorrent.org/beps/bep_0015.html)
- [Peer ID Conventions (BEP 20)](http://www.bittorrent.org/beps/bep_0020.html)

This implementation serves as an excellent educational tool for understanding how BitTorrent works under the hood and demonstrates practical network programming concepts.
