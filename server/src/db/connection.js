// SQLite Connection using Node 24 built-in DatabaseSync
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
let DB_PATH = process.env.DB_PATH;

if (!DB_PATH) {
  if (isVercel) {
    const tmpDbPath = path.join('/tmp', 'freshbasket.db');
    const sourceDbPath = path.resolve(__dirname, '../../data/freshbasket.db');
    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(sourceDbPath)) {
        try {
          fs.copyFileSync(sourceDbPath, tmpDbPath);
        } catch (copyErr) {
          console.warn('Could not copy initial database to /tmp:', copyErr.message);
        }
      }
    }
    DB_PATH = tmpDbPath;
  } else {
    const DB_DIR = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    DB_PATH = path.join(DB_DIR, 'freshbasket.db');
  }
}

export const db = new DatabaseSync(DB_PATH);

// Enable Foreign Keys and WAL Mode for high concurrency and integrity
try {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
  `);
} catch (pragmaErr) {
  console.warn('SQLite PRAGMA configuration notice:', pragmaErr.message);
}

/**
 * Execute a transaction block atomically
 * @param {Function} callback function receiving the db instance
 */
export function runTransaction(callback) {
  db.exec('BEGIN TRANSACTION');
  try {
    const result = callback(db);
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export default db;
