import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './migrate.js';

let db = null;

export function getDb() {
  if (db) return db;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'parish.db');
  db = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' ? console.log : null });

  // Enable WAL mode for better concurrency and foreign keys
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);

  return db;
}
