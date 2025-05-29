# BitTorrent Client Usage Guide

## What is BitTorrent? (Simple Explanation)

BitTorrent is like downloading a puzzle from many people at once:

- Instead of getting the whole file from one place, you get **pieces** from many people
- You can **pause and resume** downloads because it remembers which pieces you have
- The more people sharing, the **faster** it downloads
- Perfect for **large files** like movies, games, or software

## Quick Start

This BitTorrent client implementation follows the tutorial from Allen Kim and implements the core BitTorrent protocol in Node.js.

### Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)

### Installation

```bash
# Install dependencies
npm install

# Run basic tests
node test.js
```

### Finding Torrent Files

To test the client, you'll need a .torrent file. Here are some options:

1. **Legal torrents for testing:**

   - Ubuntu ISO torrents (https://ubuntu.com/download/alternative-downloads)
   - Internet Archive torrents (https://archive.org)
   - Creative Commons content

2. **Create your own torrent:**
   - Use tools like `transmission-create` or `mktorrent`
   - Share files on your local network for testing

### Running the Client

```bash
# Basic usage
node index.js <path-to-torrent-file>

# Specify output path
node index.js <path-to-torrent-file> <output-filename>

# Example with a real torrent
node index.js ubuntu-20.04.torrent ubuntu.iso
```

### What Happens When You Run It

1. **Torrent Parsing**: The client reads and parses the .torrent file
2. **Tracker Contact**: Sends UDP requests to the tracker to get peer list
3. **Peer Connection**: Establishes TCP connections with available peers
4. **Handshake**: Exchanges BitTorrent protocol handshakes
5. **Piece Download**: Downloads file pieces from multiple peers simultaneously
6. **File Assembly**: Reconstructs the complete file from downloaded pieces

### Expected Output

```
Starting download...
Torrent: example-file.txt
Output path: example-file.txt
Received piece 0, block at 0
Received piece 0, block at 16384
Received piece 1, block at 0
...
DONE!
```

### Troubleshooting

**No peers found:**

- The torrent might be old or inactive
- Try a popular torrent with many seeders
- Check your internet connection

**Connection errors:**

- Some peers might be behind firewalls
- The client will try multiple peers automatically

**Download stalls:**

- This is normal for torrents with few active peers
- The client implements basic retry logic

### Protocol Implementation Details

This client implements:

- **Bencode parsing** for .torrent files
- **UDP tracker protocol** (BEP 15)
- **BitTorrent peer protocol** (BEP 3)
- **Piece/block management**
- **Multi-peer downloading**

### Limitations

- **Single file torrents only** (no multi-file support)
- **Download only** (no seeding/uploading)
- **No resume capability**
- **Basic error handling**
- **No DHT support**

### Educational Value

This implementation demonstrates:

- Network programming with UDP and TCP
- Binary protocol implementation
- Asynchronous programming patterns
- File I/O operations
- Peer-to-peer networking concepts

### Next Steps

To extend this client, you could add:

- Multi-file torrent support
- Upload/seeding functionality
- Download resume capability
- DHT (Distributed Hash Table) support
- Magnet link support
- Better error handling and logging
- GUI interface

### References

- Original tutorial: https://allenkim67.github.io/programming/2016/05/04/how-to-make-your-own-bittorrent-client.html
- BitTorrent Protocol: https://wiki.theory.org/index.php/BitTorrentSpecification
- UDP Tracker Protocol: http://www.bittorrent.org/beps/bep_0015.html
