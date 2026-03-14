const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
const stemsDir = path.join(dataDir, 'stems');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(stemsDir)) {
  fs.mkdirSync(stemsDir, { recursive: true });
}

// Create database
const dbPath = path.join(dataDir, 'stems.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Stems table
  db.run(`
    CREATE TABLE IF NOT EXISTS stems (
      id TEXT PRIMARY KEY,
      track_name TEXT NOT NULL,
      artist TEXT NOT NULL,
      phase INTEGER CHECK (phase IN (1, 2, 3, 4, 5)),
      license TEXT NOT NULL DEFAULT 'CC-BY-SA-4.0',
      description TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_format TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      sample_rate INTEGER,
      bit_depth INTEGER,
      duration_seconds REAL,
      bpm INTEGER,
      key TEXT,
      parent_stem_id TEXT,
      uploaded_by TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      download_count INTEGER DEFAULT 0,
      FOREIGN KEY (parent_stem_id) REFERENCES stems (id)
    )
  `);

  // Stem tags table (many-to-many)
  db.run(`
    CREATE TABLE IF NOT EXISTS stem_tags (
      stem_id TEXT,
      tag TEXT,
      PRIMARY KEY (stem_id, tag),
      FOREIGN KEY (stem_id) REFERENCES stems (id) ON DELETE CASCADE
    )
  `);

  // Download history table
  db.run(`
    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stem_id TEXT NOT NULL,
      downloaded_by TEXT,
      downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stem_id) REFERENCES stems (id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_stems_phase ON stems (phase)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_stems_artist ON stems (artist)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_stems_uploaded_at ON stems (uploaded_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_stem_tags_tag ON stem_tags (tag)`);

  console.log('✅ Database initialized successfully');
  console.log(`📁 Database location: ${dbPath}`);
  console.log(`📁 Stems storage: ${stemsDir}`);
});

db.close();