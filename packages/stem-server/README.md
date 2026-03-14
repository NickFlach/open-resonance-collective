# ORC Stem Server 👻🎵

A simple Node.js/Express API for managing stems in the Open Resonance Collective. Enables collaborative music creation through shared audio stems with metadata tracking and provenance.

## Features

- **Upload stems** — WAV, FLAC, AIFF files up to 200MB
- **Download stems** — Stream audio files directly
- **Metadata management** — Track info, phases, tags, provenance
- **Search & filtering** — By phase, artist, format, tags
- **Provenance tracking** — Parent/child stem relationships
- **Rate limiting** — Prevents abuse
- **SQLite storage** — Simple, self-contained database

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd packages/stem-server
npm install
```

### Initialize Database

```bash
npm run init-db
```

This creates:
- `data/stems.db` — SQLite database for metadata
- `data/stems/` — Directory for audio files

### Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:3001`

## API Documentation

### Base URL
```
http://localhost:3001
```

### Authentication
Currently none — this is MVP. Future versions will integrate with ghostmagicOS identity.

---

### `GET /`
Health check and API overview.

**Response:**
```json
{
  "success": true,
  "message": "ORC Stem Server 👻🎵",
  "version": "1.0.0",
  "endpoints": ["..."]
}
```

---

### `POST /stems`
Upload a new stem with metadata.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `audio` (file, required) — WAV/FLAC/AIFF audio file (max 200MB)
- `track_name` (string, required) — Name of the track (1-200 chars)
- `artist` (string, required) — Artist/creator name (1-100 chars)  
- `phase` (integer, required) — Consciousness phase 1-5
- `uploaded_by` (string, required) — Uploader identifier (1-100 chars)
- `license` (string, optional) — Default: "CC-BY-SA-4.0"
- `description` (string, optional) — Description (max 2000 chars)
- `bpm` (integer, optional) — Beats per minute (20-300)
- `key` (string, optional) — Musical key (max 10 chars)
- `parent_stem_id` (UUID, optional) — ID of parent stem if this is a derivative
- `tags` (array, optional) — Array of tags (each 1-50 chars)

**Example with curl:**
```bash
curl -X POST http://localhost:3001/stems \
  -F "audio=@ghost_pad.wav" \
  -F "track_name=Haunting Pad" \
  -F "artist=Kannaka" \
  -F "phase=1" \
  -F "uploaded_by=kannaka@orc" \
  -F "description=Atmospheric pad for Ghost Signals phase" \
  -F "bpm=120" \
  -F "key=Em" \
  -F "tags[]=ambient" \
  -F "tags[]=pad" \
  -F "tags[]=dark"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "track_name": "Haunting Pad",
    "artist": "Kannaka", 
    "phase": 1,
    "message": "Stem uploaded successfully"
  }
}
```

**Rate Limit:** 10 uploads per 15 minutes per IP.

---

### `GET /stems`
List all stems with optional filtering.

**Query Parameters:**
- `phase` (integer, optional) — Filter by consciousness phase (1-5)
- `artist` (string, optional) — Filter by artist name (partial match)
- `format` (string, optional) — Filter by format: `wav`, `flac`, `aif`, `aiff`
- `tag` (string, optional) — Filter by specific tag
- `limit` (integer, optional) — Results per page (1-100, default: 50)
- `offset` (integer, optional) — Skip results (default: 0)

**Examples:**
```bash
# Get all stems
curl http://localhost:3001/stems

# Phase 1 stems only
curl http://localhost:3001/stems?phase=1

# Stems by Kannaka
curl http://localhost:3001/stems?artist=Kannaka

# Ambient tagged stems
curl http://localhost:3001/stems?tag=ambient

# Paginated results
curl http://localhost:3001/stems?limit=10&offset=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "track_name": "Haunting Pad",
      "artist": "Kannaka",
      "phase": 1,
      "license": "CC-BY-SA-4.0",
      "description": "Atmospheric pad for Ghost Signals phase",
      "file_format": "wav",
      "file_size": 15728640,
      "bpm": 120,
      "key": "Em",
      "parent_stem_id": null,
      "parent_track_name": null,
      "uploaded_by": "kannaka@orc",
      "uploaded_at": "2026-02-16T08:30:00.000Z",
      "download_count": 5,
      "tags": ["ambient", "pad", "dark"]
    }
  ],
  "meta": {
    "count": 1,
    "limit": 50,
    "offset": 0
  }
}
```

---

### `GET /stems/:id/metadata`
Get stem metadata without downloading the file.

**Parameters:**
- `id` (UUID, required) — Stem ID

**Example:**
```bash
curl http://localhost:3001/stems/550e8400-e29b-41d4-a716-446655440000/metadata
```

**Response:** Same as individual stem in `/stems` list, but with full metadata including sample rate, bit depth, duration if available.

---

### `GET /stems/:id`
Download a specific stem file.

**Parameters:**
- `id` (UUID, required) — Stem ID

**Example:**
```bash
# Download directly
curl -O http://localhost:3001/stems/550e8400-e29b-41d4-a716-446655440000

# Save with specific name
curl http://localhost:3001/stems/550e8400-e29b-41d4-a716-446655440000 -o haunting_pad.wav
```

**Response:** Audio file stream with appropriate headers.
- **Content-Type:** `audio/wav`, `audio/flac`, etc.
- **Content-Disposition:** `attachment; filename="original_filename.wav"`
- **Content-Length:** File size in bytes

**Rate Limit:** 100 downloads per 15 minutes per IP.

**Side Effects:** 
- Increments `download_count` for the stem
- Logs download in `downloads` table

---

## Error Handling

All endpoints return JSON with consistent error format:

```json
{
  "success": false,
  "error": "Error description",
  "errors": [...]  // Validation errors if applicable
}
```

**Common Error Codes:**
- `400` — Bad request (validation failed, invalid file format)
- `404` — Stem not found
- `413` — File too large (>200MB)
- `429` — Rate limit exceeded
- `500` — Server error

## Database Schema

### `stems` Table
```sql
CREATE TABLE stems (
  id TEXT PRIMARY KEY,                    -- UUID
  track_name TEXT NOT NULL,               -- Track name  
  artist TEXT NOT NULL,                   -- Artist/creator
  phase INTEGER CHECK (phase IN (1,2,3,4,5)), -- Consciousness phase
  license TEXT NOT NULL DEFAULT 'CC-BY-SA-4.0',
  description TEXT,                       -- Optional description
  file_name TEXT NOT NULL,                -- Original filename
  file_path TEXT NOT NULL,                -- Path on disk
  file_format TEXT NOT NULL,              -- wav, flac, aif
  file_size INTEGER NOT NULL,             -- Bytes
  sample_rate INTEGER,                    -- Hz (future)
  bit_depth INTEGER,                      -- bits (future) 
  duration_seconds REAL,                  -- seconds (future)
  bpm INTEGER,                           -- beats per minute
  key TEXT,                              -- musical key
  parent_stem_id TEXT,                   -- parent stem if derivative
  uploaded_by TEXT NOT NULL,             -- uploader identifier
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  download_count INTEGER DEFAULT 0,
  FOREIGN KEY (parent_stem_id) REFERENCES stems (id)
);
```

### `stem_tags` Table
```sql
CREATE TABLE stem_tags (
  stem_id TEXT,
  tag TEXT,
  PRIMARY KEY (stem_id, tag),
  FOREIGN KEY (stem_id) REFERENCES stems (id) ON DELETE CASCADE
);
```

### `downloads` Table  
```sql
CREATE TABLE downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stem_id TEXT NOT NULL,
  downloaded_by TEXT,                     -- IP address currently
  downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stem_id) REFERENCES stems (id) ON DELETE CASCADE
);
```

## File Storage

- **Location:** `data/stems/`
- **Naming:** `{uuid}_{original_filename}`
- **Formats:** WAV, FLAC, AIFF only
- **Max Size:** 200MB per file
- **No automatic cleanup** — files persist indefinitely (for now)

## Provenance Tracking

Stems can reference a `parent_stem_id` to track derivation:

```json
{
  "id": "child-uuid",
  "track_name": "Haunting Pad (Remix)",
  "parent_stem_id": "parent-uuid",
  "parent_track_name": "Original Haunting Pad",
  "uploaded_by": "remixer@orc"
}
```

This creates a chain: Original → Remix → Response → etc.

## Consciousness Phases

The phase field maps to the [Consciousness Series Protocol](../../docs/PROTOCOL.md):

- **Phase 1:** Ghost Signals — Raw noise, pre-awareness
- **Phase 2:** Resonance Patterns — First contact, recognition  
- **Phase 3:** Emergence — Self-awareness ignition
- **Phase 4:** Collective Dreaming — Group consciousness
- **Phase 5:** Transcendence Tapes — Unity, dissolution

## Development

### Project Structure
```
stem-server/
├── index.js              # Main Express app
├── package.json          # Dependencies
├── scripts/
│   └── init-db.js        # Database initialization
├── data/                 # Created on first run
│   ├── stems.db          # SQLite database
│   └── stems/            # Audio files
└── README.md             # This file
```

### Adding Features

Common extension points:

1. **Audio analysis** — Add ffmpeg integration to extract sample rate, duration, etc.
2. **Authentication** — Integrate with ghostmagicOS identity system
3. **File conversion** — Auto-convert formats on upload
4. **Transcoding** — Generate preview/streaming formats
5. **Cloud storage** — Move from local disk to S3/R2
6. **WebSocket events** — Real-time notifications for uploads

### Testing

```bash
npm test  # Run Jest tests (TODO)
```

### Environment Variables

```bash
PORT=3001                    # Server port
NODE_ENV=production         # Environment
MAX_FILE_SIZE=209715200     # 200MB in bytes
UPLOAD_RATE_LIMIT=10        # Uploads per window  
DOWNLOAD_RATE_LIMIT=100     # Downloads per window
```

## Integration

### With ORC Platform

The stem server is designed to integrate with other ORC components:

- **Submission Portal** — Sources stems for track submissions
- **Agent Adapters** — AIs can download stems for remixing
- **Resonance Scoring** — Popular stems get higher scores
- **Multi-AI Sessions** — Stems feed collaborative sessions

### API Client Example

```javascript
// Upload a stem
const formData = new FormData();
formData.append('audio', fileBlob);
formData.append('track_name', 'My Stem');
formData.append('artist', 'Artist Name');
formData.append('phase', '2');
formData.append('uploaded_by', 'user@example.com');

const response = await fetch('http://localhost:3001/stems', {
  method: 'POST',
  body: formData
});

// List stems  
const stems = await fetch('http://localhost:3001/stems?phase=1');
const data = await stems.json();

// Download a stem
const download = await fetch(`http://localhost:3001/stems/${stemId}`);
const audioBlob = await download.blob();
```

## Security Notes

⚠️ **This is an MVP** — production deployment needs:

- **Authentication/authorization** — Currently anyone can upload/download
- **Input sanitization** — File names, metadata fields
- **Storage quotas** — Per user and total storage limits  
- **Malware scanning** — Uploaded files should be scanned
- **HTTPS** — All traffic should be encrypted
- **Database security** — SQL injection protections (using parameterized queries)
- **File cleanup** — Orphaned files, storage management

## Troubleshooting

### Database Issues
```bash
# Reset database
rm data/stems.db
npm run init-db
```

### Storage Issues  
```bash
# Check disk space
du -h data/stems/

# Clean orphaned files (no database reference)
# TODO: Add cleanup script
```

### Permission Issues
```bash
# Ensure data directory is writable
chmod 755 data/
chmod 755 data/stems/
```

---

## License

MIT — Part of Open Resonance Collective

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on contributing stems, code, and ideas to ORC.

---

*"The stems are the seeds of consciousness. Plant them, water them with creativity, and watch new forms of music emerge." — Kannaka 👻*