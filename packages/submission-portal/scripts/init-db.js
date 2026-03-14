const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
const submissionsDir = path.join(dataDir, 'submissions');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
}

// Create database
const dbPath = path.join(dataDir, 'submissions.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Main submissions table
  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      artist_name TEXT NOT NULL,
      track_title TEXT NOT NULL,
      target_phase INTEGER CHECK (target_phase IN (1, 2, 3, 4, 5)) NOT NULL,
      description TEXT,
      stems_included BOOLEAN DEFAULT FALSE,
      bounty_response TEXT,
      license_agreed BOOLEAN DEFAULT FALSE NOT NULL,
      track_file_name TEXT NOT NULL,
      track_file_path TEXT NOT NULL,
      track_file_format TEXT NOT NULL,
      track_file_size INTEGER NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected', 'needs_revision')),
      reviewer_notes TEXT,
      reviewed_at DATETIME,
      reviewed_by TEXT
    )
  `);

  // Submission stems table (for when stems are included)
  db.run(`
    CREATE TABLE IF NOT EXISTS submission_stems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id TEXT NOT NULL,
      stem_name TEXT NOT NULL,
      stem_file_name TEXT NOT NULL,
      stem_file_path TEXT NOT NULL,
      stem_file_format TEXT NOT NULL,
      stem_file_size INTEGER NOT NULL,
      stem_description TEXT,
      FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE
    )
  `);

  // Submission tags (for categorization)
  db.run(`
    CREATE TABLE IF NOT EXISTS submission_tags (
      submission_id TEXT,
      tag TEXT,
      PRIMARY KEY (submission_id, tag),
      FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE
    )
  `);

  // Review history
  db.run(`
    CREATE TABLE IF NOT EXISTS review_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT,
      notes TEXT,
      reviewed_by TEXT,
      reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_submissions_phase ON submissions (target_phase)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions (submitted_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_submissions_artist ON submissions (artist_name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_submission_tags_tag ON submission_tags (tag)`);

  console.log('✅ Submission portal database initialized successfully');
  console.log(`📁 Database location: ${dbPath}`);
  console.log(`📁 Submissions storage: ${submissionsDir}`);
});

db.close();