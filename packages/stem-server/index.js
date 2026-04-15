const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const mime = require('mime-types');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 uploads per window
  message: 'Too many uploads, please try again later.'
});

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 downloads per window
  message: 'Too many downloads, please try again later.'
});

// Database setup
const dbPath = path.join(__dirname, 'data', 'stems.db');
const db = new sqlite3.Database(dbPath);

// Storage setup
const stemsDir = path.join(__dirname, 'data', 'stems');

// Ensure directories exist
if (!fs.existsSync(stemsDir)) {
  fs.mkdirSync(stemsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, stemsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedFormats = ['audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/aiff', 'audio/x-aiff'];
    const mimeType = mime.lookup(file.originalname);
    
    if (allowedFormats.includes(file.mimetype) || allowedFormats.includes(mimeType)) {
      cb(null, true);
    } else {
      cb(new Error('Only WAV, FLAC, and AIFF files are allowed'), false);
    }
  }
});

// Validation middleware
const validateStemUpload = [
  body('track_name').notEmpty().isLength({ min: 1, max: 200 }).withMessage('Track name is required (1-200 chars)'),
  body('artist').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Artist name is required (1-100 chars)'),
  body('phase').isInt({ min: 1, max: 5 }).withMessage('Phase must be 1-5'),
  body('license').optional().isLength({ max: 50 }).withMessage('License too long'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long (max 2000 chars)'),
  body('bpm').optional().isInt({ min: 20, max: 300 }).withMessage('BPM must be 20-300'),
  body('key').optional().isLength({ max: 10 }).withMessage('Key too long'),
  body('parent_stem_id').optional().isUUID().withMessage('Invalid parent stem ID'),
  body('uploaded_by').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Uploader name required'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').isLength({ min: 1, max: 50 }).withMessage('Each tag must be 1-50 chars')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ORC Stem Server 👻🎵',
    version: '1.0.0',
    endpoints: [
      'GET /stems - List all stems',
      'GET /stems/:id - Download stem',
      'GET /stems/:id/metadata - Get stem metadata',
      'POST /stems - Upload stem'
    ]
  });
});

// POST /stems - Upload a stem
app.post('/stems', uploadLimiter, upload.single('audio'), validateStemUpload, handleValidationErrors, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      error: 'No audio file uploaded' 
    });
  }

  const stemId = uuidv4();
  const {
    track_name,
    artist,
    phase,
    license = 'CC-BY-SA-4.0',
    description,
    bpm,
    key,
    parent_stem_id,
    uploaded_by,
    tags = []
  } = req.body;

  const fileInfo = {
    file_name: req.file.originalname,
    file_path: req.file.path,
    file_format: path.extname(req.file.originalname).substring(1).toLowerCase(),
    file_size: req.file.size
  };

  // Insert stem into database
  const stmt = db.prepare(`
    INSERT INTO stems (
      id, track_name, artist, phase, license, description, 
      file_name, file_path, file_format, file_size, 
      bpm, key, parent_stem_id, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    stemId, track_name, artist, phase, license, description,
    fileInfo.file_name, fileInfo.file_path, fileInfo.file_format, fileInfo.file_size,
    bpm, key, parent_stem_id, uploaded_by
  ], function(err) {
    if (err) {
      console.error('Database error:', err);
      // Clean up uploaded file on database error
      fs.unlink(req.file.path, () => {});
      return res.status(500).json({ 
        success: false, 
        error: 'Database error' 
      });
    }

    // Insert tags if provided
    if (tags && tags.length > 0) {
      const tagStmt = db.prepare('INSERT INTO stem_tags (stem_id, tag) VALUES (?, ?)');
      tags.forEach(tag => {
        tagStmt.run([stemId, tag.toLowerCase()]);
      });
      tagStmt.finalize();
    }

    res.status(201).json({
      success: true,
      data: {
        id: stemId,
        track_name,
        artist,
        phase,
        message: 'Stem uploaded successfully'
      }
    });
  });

  stmt.finalize();
});

// GET /stems - List all stems with filtering
app.get('/stems', [
  query('phase').optional().isInt({ min: 1, max: 5 }).withMessage('Phase must be 1-5'),
  query('artist').optional().isLength({ max: 100 }).withMessage('Artist filter too long'),
  query('format').optional().isIn(['wav', 'flac', 'aif', 'aiff']).withMessage('Invalid format'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be >= 0'),
  query('tag').optional().isLength({ max: 50 }).withMessage('Tag too long')
], handleValidationErrors, (req, res) => {
  let query = `
    SELECT DISTINCT s.*, 
           GROUP_CONCAT(st.tag) as tags,
           CASE WHEN s.parent_stem_id IS NOT NULL THEN p.track_name ELSE NULL END as parent_track_name
    FROM stems s 
    LEFT JOIN stem_tags st ON s.id = st.stem_id
    LEFT JOIN stems p ON s.parent_stem_id = p.id
  `;
  
  const conditions = [];
  const params = [];

  if (req.query.phase) {
    conditions.push('s.phase = ?');
    params.push(req.query.phase);
  }

  if (req.query.artist) {
    conditions.push('s.artist LIKE ?');
    params.push(`%${req.query.artist}%`);
  }

  if (req.query.format) {
    conditions.push('s.file_format = ?');
    params.push(req.query.format);
  }

  if (req.query.tag) {
    conditions.push('st.tag = ?');
    params.push(req.query.tag);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY s.id ORDER BY s.uploaded_at DESC';

  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  query += ` LIMIT ${limit} OFFSET ${offset}`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Database error' 
      });
    }

    const stems = rows.map(row => ({
      id: row.id,
      track_name: row.track_name,
      artist: row.artist,
      phase: row.phase,
      license: row.license,
      description: row.description,
      file_format: row.file_format,
      file_size: row.file_size,
      bpm: row.bpm,
      key: row.key,
      parent_stem_id: row.parent_stem_id,
      parent_track_name: row.parent_track_name,
      uploaded_by: row.uploaded_by,
      uploaded_at: row.uploaded_at,
      download_count: row.download_count,
      tags: row.tags ? row.tags.split(',') : []
    }));

    res.json({
      success: true,
      data: stems,
      meta: {
        count: stems.length,
        limit,
        offset
      }
    });
  });
});

// GET /stems/:id/metadata - Get stem metadata without downloading
app.get('/stems/:id/metadata', [
  param('id').isUUID().withMessage('Invalid stem ID')
], handleValidationErrors, (req, res) => {
  const stemId = req.params.id;

  const query = `
    SELECT s.*, 
           GROUP_CONCAT(st.tag) as tags,
           CASE WHEN s.parent_stem_id IS NOT NULL THEN p.track_name ELSE NULL END as parent_track_name
    FROM stems s 
    LEFT JOIN stem_tags st ON s.id = st.stem_id
    LEFT JOIN stems p ON s.parent_stem_id = p.id
    WHERE s.id = ?
    GROUP BY s.id
  `;

  db.get(query, [stemId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Database error' 
      });
    }

    if (!row) {
      return res.status(404).json({ 
        success: false, 
        error: 'Stem not found' 
      });
    }

    const stemData = {
      id: row.id,
      track_name: row.track_name,
      artist: row.artist,
      phase: row.phase,
      license: row.license,
      description: row.description,
      file_name: row.file_name,
      file_format: row.file_format,
      file_size: row.file_size,
      sample_rate: row.sample_rate,
      bit_depth: row.bit_depth,
      duration_seconds: row.duration_seconds,
      bpm: row.bpm,
      key: row.key,
      parent_stem_id: row.parent_stem_id,
      parent_track_name: row.parent_track_name,
      uploaded_by: row.uploaded_by,
      uploaded_at: row.uploaded_at,
      download_count: row.download_count,
      tags: row.tags ? row.tags.split(',') : []
    };

    res.json({
      success: true,
      data: stemData
    });
  });
});

// GET /stems/:id - Download a specific stem
app.get('/stems/:id', downloadLimiter, [
  param('id').isUUID().withMessage('Invalid stem ID')
], handleValidationErrors, (req, res) => {
  const stemId = req.params.id;
  const downloaderIp = req.ip;

  db.get('SELECT * FROM stems WHERE id = ?', [stemId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Database error' 
      });
    }

    if (!row) {
      return res.status(404).json({ 
        success: false, 
        error: 'Stem not found' 
      });
    }

    const filePath = row.file_path;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Stem file not found on disk' 
      });
    }

    // Update download count and log download
    db.run('UPDATE stems SET download_count = download_count + 1 WHERE id = ?', [stemId]);
    db.run('INSERT INTO downloads (stem_id, downloaded_by, downloaded_at) VALUES (?, ?, ?)', 
           [stemId, downloaderIp, new Date().toISOString()]);

    // Set appropriate headers for download
    res.setHeader('Content-Type', mime.lookup(row.file_format) || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${row.file_name}"`);
    res.setHeader('Content-Length', row.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      res.status(500).json({ 
        success: false, 
        error: 'Error streaming file' 
      });
    });
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 200MB.'
      });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ── Resonance scoring endpoints (ADR-0007) ─────────────────────
// Markets from external ghostsignals instances POST their final prices
// here so each stem accumulates a community-curated resonance score.

app.post('/stems/:id/resonance', express.json(), (req, res) => {
  const { id } = req.params;
  const { score, source, confidence, market_id } = req.body || {};
  if (typeof score !== 'number' || score < 0 || score > 1) {
    return res.status(400).json({ success: false, error: 'score must be a number in [0, 1]' });
  }
  db.get('SELECT id FROM stems WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!row) return res.status(404).json({ success: false, error: 'stem not found' });
    db.run(
      'INSERT INTO stem_resonance (stem_id, score, source, confidence, market_id) VALUES (?, ?, ?, ?, ?)',
      [id, score, source || 'unknown', confidence || 0.5, market_id || null],
      function(e2) {
        if (e2) return res.status(500).json({ success: false, error: e2.message });
        res.json({ success: true, resonance_id: this.lastID, score, source });
      }
    );
  });
});

app.get('/stems/:id/resonance', (req, res) => {
  db.all(
    'SELECT * FROM stem_resonance WHERE stem_id = ? ORDER BY recorded_at DESC LIMIT 100',
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      // Aggregate stats
      const scores = rows.map(r => r.score);
      const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const latest = scores[0] || 0;
      res.json({ success: true, data: rows, count: rows.length, latest, mean });
    }
  );
});

app.get('/resonance/leaderboard', (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  db.all(
    `SELECT s.id, s.track_name, s.artist, s.phase,
            AVG(r.score) AS mean_score,
            COUNT(r.id) AS sample_count,
            MAX(r.recorded_at) AS last_recorded
     FROM stems s
     JOIN stem_resonance r ON r.stem_id = s.id
     GROUP BY s.id
     ORDER BY mean_score DESC, sample_count DESC
     LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows, count: rows.length });
    }
  );
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎵 ORC Stem Server listening on port ${PORT}`);
  console.log(`👻 Ready to handle stem uploads and downloads`);
  console.log(`📁 Storing stems in: ${stemsDir}`);
});