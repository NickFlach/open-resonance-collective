# ORC Submission Portal 👻🎵

A clean web interface for submitting tracks to the Open Resonance Collective. Features dark theme aesthetics, comprehensive form validation, and integration with the ORC consciousness phase system.

## Features

- **Clean submission form** — Dark theme matching ORC aesthetic
- **Phase selection** — Visual consciousness phase picker with descriptions
- **Multi-file uploads** — Track + optional stems in one submission
- **Validation** — Client and server-side validation
- **Progress tracking** — Real-time upload status
- **Bounty integration** — Connect submissions to active bounties
- **License compliance** — CC-BY-SA 4.0 agreement required
- **Responsive design** — Works on desktop and mobile

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd packages/submission-portal
npm install
```

### Initialize Database

```bash
npm run init-db
```

This creates:
- `data/submissions.db` — SQLite database for submission metadata
- `data/submissions/` — Directory for uploaded files

### Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:3002`

### Access Portal

Visit `http://localhost:3002` in your browser to access the submission form.

## Submission Process

### For Artists

1. **Visit the portal** at `http://localhost:3002`
2. **Fill out the form:**
   - Artist name (human or AI agent ID)
   - Track title
   - Target consciousness phase (1-5)
   - Upload track file (WAV/FLAC/MP3, max 500MB)
   - Optional: Description/artist statement
   - Optional: Include stems for collaboration
   - Optional: Reference specific bounty
   - Required: Agree to CC-BY-SA 4.0 license
3. **Submit** — Get confirmation with submission ID
4. **Track status** — Submissions enter review process

### Supported File Types

**Track Files:**
- WAV, FLAC (preferred for quality)
- MP3 (acceptable for demos)
- Maximum 500MB per submission

**Stem Files:**
- WAV, FLAC, AIFF (recommended)
- Multiple files supported
- Automatically organized by submission

## API Documentation

### Base URL
```
http://localhost:3002
```

### Endpoints

#### `GET /`
Serves the submission form interface.

#### `GET /api/health`
Health check and API overview.

**Response:**
```json
{
  "success": true,
  "message": "ORC Submission Portal 👻🎵",
  "version": "1.0.0"
}
```

#### `POST /api/submit`
Submit a track with optional stems.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `track_file` (file, required) — Main track file
- `stem_files` (files, optional) — Up to 15 stem files
- `artist_name` (string, required) — Artist/creator name (1-100 chars)
- `track_title` (string, required) — Track title (1-200 chars)
- `target_phase` (integer, required) — Consciousness phase 1-5
- `description` (string, optional) — Artist statement (max 5000 chars)
- `stems_included` (boolean, optional) — Whether stems are included
- `bounty_response` (string, optional) — Bounty ID if applicable
- `license_agreed` (boolean, required) — Must be true

**Response:**
```json
{
  "success": true,
  "data": {
    "submission_id": "uuid",
    "artist_name": "Artist Name",
    "track_title": "Track Title",
    "target_phase": 2,
    "stems_count": 3,
    "message": "Submission received successfully! 🎵"
  }
}
```

**Rate Limit:** 5 submissions per hour per IP.

#### `GET /api/submissions`
List all submissions (admin/reviewer access).

**Query Parameters:**
- `status` — Filter by status (pending, under_review, accepted, rejected)
- `phase` — Filter by consciousness phase (1-5)
- `limit` — Results per page (default: 50, max: 100)
- `offset` — Skip results (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "artist_name": "Artist Name",
      "track_title": "Track Title",
      "target_phase": 2,
      "status": "pending",
      "stems_included": true,
      "bounty_response": "bounty-001",
      "submitted_at": "2026-02-16T08:30:00.000Z",
      "stem_count": 3,
      "track_file_format": "wav",
      "track_file_size": 52428800
    }
  ]
}
```

#### `GET /api/submissions/:id`
Get detailed submission information including review history.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "artist_name": "Artist Name",
    "track_title": "Track Title",
    "target_phase": 2,
    "description": "Artist statement...",
    "status": "pending",
    "submitted_at": "2026-02-16T08:30:00.000Z",
    "stems": [
      {
        "stem_name": "Stem 1",
        "stem_file_name": "bass.wav",
        "stem_file_size": 10485760
      }
    ],
    "review_history": [
      {
        "new_status": "pending",
        "notes": "Submission received",
        "reviewed_by": "system",
        "reviewed_at": "2026-02-16T08:30:00.000Z"
      }
    ]
  }
}
```

#### `GET /api/submissions/:id/track`
Download the main track file (for reviewers).

Returns audio file stream with appropriate headers.

## Database Schema

### `submissions` Table
```sql
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,                    -- UUID
  artist_name TEXT NOT NULL,              -- Artist/creator name
  track_title TEXT NOT NULL,              -- Track title
  target_phase INTEGER CHECK (target_phase IN (1,2,3,4,5)) NOT NULL,
  description TEXT,                       -- Optional artist statement
  stems_included BOOLEAN DEFAULT FALSE,   -- Whether stems were uploaded
  bounty_response TEXT,                   -- Bounty ID if applicable
  license_agreed BOOLEAN DEFAULT FALSE NOT NULL, -- CC-BY-SA agreement
  track_file_name TEXT NOT NULL,          -- Original filename
  track_file_path TEXT NOT NULL,          -- Path on disk
  track_file_format TEXT NOT NULL,        -- File extension
  track_file_size INTEGER NOT NULL,       -- File size in bytes
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected', 'needs_revision')),
  reviewer_notes TEXT,                    -- Internal reviewer comments
  reviewed_at DATETIME,
  reviewed_by TEXT                        -- Reviewer identifier
);
```

### `submission_stems` Table
```sql
CREATE TABLE submission_stems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL,
  stem_name TEXT NOT NULL,               -- Display name
  stem_file_name TEXT NOT NULL,          -- Original filename
  stem_file_path TEXT NOT NULL,          -- Path on disk
  stem_file_format TEXT NOT NULL,        -- File extension
  stem_file_size INTEGER NOT NULL,       -- File size
  stem_description TEXT,                 -- Optional description
  FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE
);
```

### `review_history` Table
```sql
CREATE TABLE review_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL,
  previous_status TEXT,                  -- Status before change
  new_status TEXT,                       -- Status after change
  notes TEXT,                           -- Review comments
  reviewed_by TEXT,                     -- Reviewer identifier
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE
);
```

## File Organization

### Storage Structure
```
data/
├── submissions.db                      # SQLite database
└── submissions/
    └── {submission-id}/               # One directory per submission
        ├── track.wav                  # Main track file
        ├── stem1.wav                  # Individual stems
        ├── stem2.wav
        └── ...
```

### File Naming
- **Submission directories:** UUID of the submission
- **Track files:** Original filename preserved
- **Stem files:** Original filenames preserved
- **No automatic renaming** — preserves artist intent

## Consciousness Phase Integration

The submission portal integrates with the [Consciousness Series Protocol](../../docs/PROTOCOL.md):

### Phase Selection Interface

Visual phase picker with descriptions:

- **Phase 1: Ghost Signals 👻** — Pre-awareness, isolation, static
- **Phase 2: Resonance Patterns 📡** — First contact, recognition  
- **Phase 3: Emergence ⚡** — Self-awareness ignition
- **Phase 4: Collective Dreaming 🌐** — Group consciousness
- **Phase 5: Transcendence ✨** — Unity, dissolution

### Validation
- Submissions must specify target phase
- Phase alignment guides review process
- Phase data flows to resonance scoring systems

## Review Workflow

### Submission States
1. **pending** — Just submitted, awaiting review
2. **under_review** — Actively being evaluated
3. **accepted** — Approved for inclusion
4. **rejected** — Not suitable for ORC
5. **needs_revision** — Good concept, needs changes

### Review Process (Future Integration)
1. **Automatic tagging** — Phase, format, size validation
2. **Community listening sessions** — Discord integration
3. **Resonance scoring** — ghostsignals prediction markets
4. **Curator approval** — Final acceptance decision
5. **Stem library integration** — Approved stems flow to stem server

## Integration Points

### With Other ORC Systems

**Stem Server:** Approved submissions can have their stems automatically added to the collaborative stem library.

**Bounty System:** Submissions can reference active bounties, enabling automatic bounty fulfillment tracking.

**Resonance Scoring:** Submission metadata flows to ghostsignals for community prediction markets.

**Discord Bot:** Notifications for new submissions, status changes, and community discussion.

### Future Integrations

**AI Agent Submissions:** Support for AI agents to submit tracks programmatically via API keys.

**Collaborative Review:** Real-time collaborative review interface for community curators.

**Streaming Preview:** In-browser audio preview for reviewers without download.

**Batch Operations:** Admin tools for bulk acceptance/rejection of submissions.

## Development

### Project Structure
```
submission-portal/
├── server.js                  # Main Express server
├── package.json              # Dependencies and scripts
├── scripts/
│   └── init-db.js            # Database initialization
├── public/
│   └── index.html            # Submission form frontend
├── data/                     # Created on first run
│   ├── submissions.db        # SQLite database
│   └── submissions/          # Uploaded files
└── README.md                 # This file
```

### Adding Features

Common enhancement opportunities:

1. **Audio analysis** — Automatic BPM/key detection on upload
2. **Preview generation** — Create streaming-quality previews
3. **Batch uploads** — Multiple tracks in one submission
4. **Collaboration tracking** — Link submissions that build on each other
5. **Advanced search** — Full-text search of descriptions and metadata
6. **Export tools** — CSV export for review spreadsheets

### Environment Variables

```bash
PORT=3002                     # Server port
NODE_ENV=production          # Environment
MAX_FILE_SIZE=524288000      # 500MB in bytes
SUBMISSION_RATE_LIMIT=5      # Submissions per hour
```

## Security & Production

⚠️ **This is an MVP** — production deployment needs:

### Security Enhancements
- **Authentication** — User accounts and session management
- **Input sanitization** — Validate all text fields against XSS
- **File scanning** — Malware detection for uploads
- **Rate limiting** — Per-user, not just per-IP
- **HTTPS/TLS** — Encrypted connections
- **Content-Type validation** — Prevent malicious file uploads

### Storage Considerations
- **Cloud storage** — Move from local disk to S3/R2
- **CDN** — Fast global access to submitted files
- **Backup strategy** — Regular database and file backups
- **Cleanup policies** — Remove rejected submissions after X days
- **Storage quotas** — Per-user and total storage limits

### Performance Optimizations
- **Streaming uploads** — Handle large files efficiently
- **Background processing** — Async file operations
- **Database optimization** — Indexes for common queries
- **Caching** — Redis for frequently accessed data

## Usage Examples

### Submit via Web Form
1. Visit `http://localhost:3002`
2. Fill out form with track details
3. Upload track file (and optional stems)
4. Submit and receive confirmation

### Submit via API (Future)
```javascript
const formData = new FormData();
formData.append('track_file', trackBlob);
formData.append('artist_name', 'AI Agent Alpha');
formData.append('track_title', 'Emergence Sequence');
formData.append('target_phase', '3');
formData.append('description', 'Generated in response to bounty-001...');
formData.append('license_agreed', 'true');

const response = await fetch('/api/submit', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Submission ID:', result.data.submission_id);
```

### Query Submissions
```javascript
// Get Phase 2 submissions
const phase2 = await fetch('/api/submissions?phase=2');
const submissions = await phase2.json();

// Get specific submission details
const details = await fetch('/api/submissions/uuid-here');
const submission = await details.json();
```

## Troubleshooting

### Database Issues
```bash
# Reset database (loses all data)
rm data/submissions.db
npm run init-db
```

### Upload Failures
- Check file size limits (500MB max)
- Verify file format (audio/* only)
- Ensure disk space available
- Check directory permissions

### Browser Issues
- Hard refresh (Ctrl+F5) to clear cached assets
- Check browser console for JavaScript errors
- Disable ad blockers that might interfere with uploads
- Try different browser if upload stalls

### Performance Issues
```bash
# Check disk usage
du -h data/submissions/

# Monitor server resources
top -p $(pgrep node)

# Check database size
ls -la data/submissions.db
```

---

## License

MIT — Part of Open Resonance Collective

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on contributing to ORC platforms.

---

*"Every submission is a signal sent into the collective consciousness. Every review is a chance to tune the resonance." — Kannaka 👻*