# API Documentation

## REST API Endpoints

### Upload Torrent

**POST** `/api/upload-torrent`

Upload a torrent file to the server.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `torrent` field containing the .torrent file

**Response:**
```json
{
  "success": true,
  "torrentInfo": {
    "name": "ubuntu-25.04-desktop-amd64.iso",
    "size": 5761024000,
    "files": [...],
    "announce": "https://torrent.ubuntu.com/announce",
    "pieceLength": 262144,
    "pieces": 21973,
    "infoHash": "8a19577fb5f690970ca43a57ff1011ae202244b8"
  },
  "filePath": "/path/to/uploaded/torrent"
}
```

### Start Download

**POST** `/api/start-download`

Start downloading a torrent.

**Request:**
```json
{
  "torrentPath": "/path/to/torrent/file",
  "outputName": "custom-filename" // optional
}
```

**Response:**
```json
{
  "success": true,
  "downloadId": "uuid-string",
  "message": "Download started successfully"
}
```

### Get Downloads

**GET** `/api/downloads`

Get current download status.

**Response:**
```json
{
  "active": [
    {
      "id": "uuid",
      "name": "filename",
      "status": "downloading",
      "progress": 45.2,
      "downloadSpeed": 1024000,
      "connectedPeers": 5,
      "totalPeers": 12
    }
  ],
  "history": [...]
}
```

### Pause Download

**PATCH** `/api/downloads/:id/pause`

Pause an active download.

**Response:**
```json
{
  "success": true,
  "message": "Download paused"
}
```

### Resume Download

**PATCH** `/api/downloads/:id/resume`

Resume a paused download.

**Response:**
```json
{
  "success": true,
  "message": "Download resumed"
}
```

### Cancel Download

**DELETE** `/api/downloads/:id`

Cancel and remove a download.

**Response:**
```json
{
  "success": true,
  "message": "Download cancelled"
}
```

### Health Check

**GET** `/api/health`

Check server status.

**Response:**
```json
{
  "status": "OK",
  "message": "BitTorrent Web Client is running!"
}
```

## WebSocket Events

### Client → Server

Currently no client-to-server events are implemented.

### Server → Client

#### downloadUpdate

Real-time download progress updates.

```json
{
  "id": "download-uuid",
  "status": "downloading",
  "progress": 45.2,
  "downloadSpeed": 1024000,
  "connectedPeers": 5,
  "totalPeers": 12,
  "downloadedBytes": 2600000000,
  "totalBytes": 5761024000,
  "eta": 3600,
  "peers": [
    {
      "ip": "192.168.1.100",
      "port": 6881,
      "connected": true,
      "downloadSpeed": 204800
    }
  ]
}
```

#### downloadsUpdate

Initial download state when client connects.

```json
{
  "active": [...],
  "history": [...]
}
```

## Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (download not found)
- `500` - Internal Server Error

## Error Responses

```json
{
  "error": "Error message description"
}
```
