import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'bhoomi_intel.db');
const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    theme TEXT NOT NULL,
    upload_date TEXT NOT NULL,
    file_path TEXT,
    extracted_text TEXT NOT NULL,
    uploaded_by_role TEXT DEFAULT 'researcher',
    author TEXT,
    district_tags TEXT,
    uploaded_by INTEGER,
    publication_status TEXT NOT NULL DEFAULT 'published',
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS districts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL,
    dispute_count INTEGER NOT NULL,
    climate_vulnerability_index REAL NOT NULL,
    land_use_efficiency REAL NOT NULL,
    geojson_coords TEXT NOT NULL,
    agricultural_pct REAL,
    urban_pct REAL,
    forest_pct REAL,
    digitization_progress_pct REAL,
    pending_court_cases INTEGER,
    population INTEGER,
    dispute_density_per_sqkm REAL,
    area_sqkm REAL,
    common_dispute_types TEXT,
    key_challenges TEXT
  );

  CREATE TABLE IF NOT EXISTS simulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_id INTEGER NOT NULL,
    district_name TEXT NOT NULL,
    policy_type TEXT NOT NULL,
    parameters_json TEXT NOT NULL,
    predicted_impact_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT UNIQUE,
    designation TEXT,
    password_hash TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS document_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    page_number INTEGER,
    created_at TEXT NOT NULL,
    embedding TEXT,
    UNIQUE(document_id, chunk_index),
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS research_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_by INTEGER NOT NULL,
    document_ids_json TEXT NOT NULL,
    report_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    operation TEXT NOT NULL,
    input_json TEXT,
    source_document_ids_json TEXT,
    model_name TEXT,
    output_json TEXT,
    success INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

`);

// Lightweight migrations for databases created by older BhoomiIntel versions.
const columns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
const addColumn = (name, sql) => { if (!columns.includes(name)) db.exec(sql); };
addColumn('password_hash', "ALTER TABLE users ADD COLUMN password_hash TEXT");
addColumn('is_active', "ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
addColumn('created_at', "ALTER TABLE users ADD COLUMN created_at TEXT");
addColumn('last_login_at', "ALTER TABLE users ADD COLUMN last_login_at TEXT");

const docColumns = db.prepare("PRAGMA table_info(documents)").all().map(c => c.name);
if (!docColumns.includes('uploaded_by')) db.exec("ALTER TABLE documents ADD COLUMN uploaded_by INTEGER");
if (!docColumns.includes('publication_status')) db.exec("ALTER TABLE documents ADD COLUMN publication_status TEXT NOT NULL DEFAULT 'published'");
if (!docColumns.includes('created_at')) db.exec("ALTER TABLE documents ADD COLUMN created_at TEXT");
if (!docColumns.includes('updated_at')) db.exec("ALTER TABLE documents ADD COLUMN updated_at TEXT");

const chunkColumns = db.prepare("PRAGMA table_info(document_chunks)").all().map(c => c.name);
if (!chunkColumns.includes('embedding')) db.exec("ALTER TABLE document_chunks ADD COLUMN embedding TEXT");

const simColumns = db.prepare("PRAGMA table_info(simulations)").all().map(c => c.name);
if (!simColumns.includes('user_id')) db.exec("ALTER TABLE simulations ADD COLUMN user_id INTEGER");

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_documents_theme ON documents(theme);
  CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
  CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);
  CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_id);
  CREATE INDEX IF NOT EXISTS idx_simulations_user ON simulations(user_id);
  CREATE INDEX IF NOT EXISTS idx_simulations_district ON simulations(district_id);
  CREATE INDEX IF NOT EXISTS idx_audit_user ON ai_audit_logs(user_id);
`);

export default db;
