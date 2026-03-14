const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const mime = require('mime-types');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    },
  },
}));
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 submissions per hour
  message: 'Too many submissions, please try again later.'
});

// Database setup
const dbPath = path.join(__dirname, 'data', 'submissions.db');
const db = new sqlite3.Database(dbPath);

// Storage setup  
const submissionsDir = path.join(__dirname, 'data', 'submissions');

// Ensure directories exist
if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const submissionId = req.body.submission_id || uuidv4();
    const submissionDir = path.join(submissionsDir, submissionId);
    
    if (!fs.existsSync(submissionDir)) {
      fs.mkdirSync(submissionDir, { recursive: true });
    }
    
    req.submissionDir = submissionDir;
    cb(null, submissionDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, cleanName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max for complete submissions
    files: 20 // max 20 files (track + stems)
  },
  fileFilter: (req, file, cb) => {
    const allowedAudioFormats = [
      'audio/wav', 'audio/x-wav', 
      'audio/flac', 'audio/x-flac',
      'audio/mpeg', 'audio/mp3',
      'audio/aiff', 'audio/x-aiff'
    ];
    
    const mimeType = mime.lookup(file.originalname);
    
    if (allowedAudioFormats.includes(file.mimetype) || allowedAudioFormats.includes(mimeType)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.originalname}. Only audio files allowed.`), false);
    }
  }
});

// Validation middleware
const validateSubmission = [
  body('artist_name')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Artist name is required (1-100 characters)'),
  body('track_title')
    .notEmpty()
    .isLength({ min: 1, max: 200 })
    .withMessage('Track title is required (1-200 characters)'),
  body('target_phase')
    .isInt({ min: 1, max: 5 })
    .withMessage('Target phase must be 1-5'),
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Description too long (max 5000 characters)'),
  body('bounty_response')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Bounty response too long (max 50 characters)'),
  body('stems_included')
    .optional()
    .isBoolean()
    .withMessage('Stems included must be boolean'),
  body('license_agreed')
    .equals('true')
    .withMessage('You must agree to the CC-BY-SA 4.0 license')
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

// Serve the main submission form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ORC Submission Portal 👻🎵',
    version: '1.0.0',
    endpoints: [
      'GET / - Submission form',
      'POST /api/submit - Submit track',
      'GET /api/submissions - List submissions (admin)',
      'GET /api/submissions/:id - Get submission details'
    ]
  });
});

// Submit a track
app.post('/api/submit', 
  submissionLimiter,
  upload.fields([
    { name: 'track_file', maxCount: 1 },
    { name: 'stem_files', maxCount: 15 }
  ]),
  validateSubmission,
  handleValidationErrors,
  (req, res) => {
    if (!req.files || !req.files.track_file || req.files.track_file.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Track file is required'
      });
    }

    const submissionId = uuidv4();
    const trackFile = req.files.track_file[0];
    const stemFiles = req.files.stem_files || [];

    const {
      artist_name,
      track_title,
      target_phase,
      description,
      bounty_response,
      stems_included,
      license_agreed
    } = req.body;

    // Validate license agreement
    if (license_agreed !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'License agreement is required'
      });
    }

    // Insert main submission
    const stmt = db.prepare(`
      INSERT INTO submissions (
        id, artist_name, track_title, target_phase, description,
        stems_included, bounty_response, license_agreed,
        track_file_name, track_file_path, track_file_format, track_file_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      submissionId,
      artist_name,
      track_title,
      target_phase,
      description || null,
      stemFiles.length > 0 ? 1 : 0,
      bounty_response || null,
      1, // license_agreed
      trackFile.originalname,
      trackFile.path,
      path.extname(trackFile.originalname).substring(1).toLowerCase(),
      trackFile.size
    ], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to save submission'
        });
      }

      // Insert stem files if provided
      if (stemFiles.length > 0) {
        const stemStmt = db.prepare(`
          INSERT INTO submission_stems (
            submission_id, stem_name, stem_file_name, stem_file_path,
            stem_file_format, stem_file_size
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        stemFiles.forEach((stem, index) => {
          stemStmt.run([
            submissionId,
            `Stem ${index + 1}`,
            stem.originalname,
            stem.path,
            path.extname(stem.originalname).substring(1).toLowerCase(),
            stem.size
          ]);
        });

        stemStmt.finalize();
      }

      // Add initial review entry
      db.run(`
        INSERT INTO review_history (submission_id, new_status, notes, reviewed_by)
        VALUES (?, 'pending', 'Submission received', 'system')
      `, [submissionId]);

      res.status(201).json({
        success: true,
        data: {
          submission_id: submissionId,
          artist_name,
          track_title,
          target_phase,
          stems_count: stemFiles.length,
          message: 'Submission received successfully! 🎵'
        }
      });
    });

    stmt.finalize();
  }
);

// List submissions (for admin/review purposes)
app.get('/api/submissions', (req, res) => {
  const { status, phase, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT s.*, COUNT(ss.id) as stem_count
    FROM submissions s 
    LEFT JOIN submission_stems ss ON s.id = ss.submission_id
  `;

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('s.status = ?');
    params.push(status);
  }

  if (phase) {
    conditions.push('s.target_phase = ?');
    params.push(parseInt(phase));
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += `
    GROUP BY s.id 
    ORDER BY s.submitted_at DESC 
    LIMIT ? OFFSET ?
  `;

  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    res.json({
      success: true,
      data: rows.map(row => ({
        id: row.id,
        artist_name: row.artist_name,
        track_title: row.track_title,
        target_phase: row.target_phase,
        status: row.status,
        stems_included: row.stems_included,
        bounty_response: row.bounty_response,
        submitted_at: row.submitted_at,
        stem_count: row.stem_count,
        track_file_format: row.track_file_format,
        track_file_size: row.track_file_size
      }))
    });
  });
});

// Get specific submission details
app.get('/api/submissions/:id', (req, res) => {
  const submissionId = req.params.id;

  // Get main submission
  db.get(`
    SELECT * FROM submissions WHERE id = ?
  `, [submissionId], (err, submission) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Get stems
    db.all(`
      SELECT * FROM submission_stems WHERE submission_id = ?
    `, [submissionId], (err, stems) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error'
        });
      }

      // Get review history
      db.all(`
        SELECT * FROM review_history WHERE submission_id = ? ORDER BY reviewed_at DESC
      `, [submissionId], (err, reviews) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            error: 'Database error'
          });
        }

        res.json({
          success: true,
          data: {
            ...submission,
            stems: stems || [],
            review_history: reviews || []
          }
        });
      });
    });
  });
});

// Download track file (for reviewers)
app.get('/api/submissions/:id/track', (req, res) => {
  const submissionId = req.params.id;

  db.get(`
    SELECT track_file_path, track_file_name, track_file_format, track_file_size 
    FROM submissions WHERE id = ?
  `, [submissionId], (err, row) => {
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
        error: 'Submission not found'
      });
    }

    const filePath = row.track_file_path;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    // Set headers for download
    res.setHeader('Content-Type', mime.lookup(row.track_file_format) || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${row.track_file_name}"`);
    res.setHeader('Content-Length', row.track_file_size);

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
        error: 'File too large. Maximum total size is 500MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 20 files per submission.'
      });
    }
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
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
  console.log(`🎵 ORC Submission Portal listening on port ${PORT}`);
  console.log(`👻 Ready to receive track submissions`);
  console.log(`📁 Storing submissions in: ${submissionsDir}`);
  console.log(`🌐 Visit http://localhost:${PORT} to submit tracks`);
});