import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { Pool } from 'pg';

let pgPool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;
let isUsingPostgres = false;

const DATABASE_URL = process.env.DATABASE_URL;

export async function initDatabase(): Promise<void> {
  if (DATABASE_URL) {
    try {
      console.log(`[*] Connecting to PostgreSQL via DATABASE_URL...`);
      const pool = new Pool({ connectionString: DATABASE_URL });
      await pool.query('SELECT 1');
      pgPool = pool;
      isUsingPostgres = true;
      console.log(`[OK] Connected to PostgreSQL successfully!`);
      return;
    } catch (err: any) {
      console.warn(`[!] PostgreSQL connection failed: ${err.message}. Falling back to SQLite aeroguard.db`);
    }
  }

  // SQLite fallback
  const dbPath = path.resolve(__dirname, '../../data/aeroguard.db');
  console.log(`[*] Opening SQLite database at ${dbPath}...`);
  if (!fs.existsSync(dbPath)) {
    console.warn(`[!] aeroguard.db not found at ${dbPath}. Ensure data/generate.py has run.`);
  }

  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error(`[!] SQLite connection error:`, err);
    } else {
      console.log(`[OK] Connected to SQLite database successfully!`);
    }
  });
}

/**
 * Convert PostgreSQL-style $1, $2, ... parameterized SQL to SQLite ? placeholders.
 * PostgreSQL allows reusing the same $N (e.g. $4 twice), but SQLite ? placeholders
 * are strictly positional — each ? maps to the next element in the params array.
 * This function replaces each $N with ? and builds a new params array where
 * repeated $N references produce duplicate entries at the right positions.
 */
function convertPgToSqlite(sql: string, params: any[]): { sql: string; params: any[] } {
  const sqliteParams: any[] = [];
  const sqliteSql = sql.replace(/\$(\d+)/g, (_match, numStr) => {
    const idx = parseInt(numStr, 10) - 1; // $1 → index 0
    sqliteParams.push(params[idx]);
    return '?';
  });
  return { sql: sqliteSql, params: sqliteParams };
}

/**
 * Universal query runner: translates postgres $1, $2 to sqlite ? if needed
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (isUsingPostgres && pgPool) {
    const res = await pgPool.query(sql, params);
    return res.rows as T[];
  }

  if (!sqliteDb) {
    throw new Error('Database not initialized');
  }

  const converted = convertPgToSqlite(sql, params);

  return new Promise((resolve, reject) => {
    sqliteDb!.all(converted.sql, converted.params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve((rows || []) as T[]);
      }
    });
  });
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: any[] = []): Promise<any> {
  if (isUsingPostgres && pgPool) {
    return await pgPool.query(sql, params);
  }

  if (!sqliteDb) {
    throw new Error('Database not initialized');
  }

  const converted = convertPgToSqlite(sql, params);

  return new Promise((resolve, reject) => {
    sqliteDb!.run(converted.sql, converted.params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

export function getDatabaseType(): string {
  return isUsingPostgres ? 'PostgreSQL' : 'SQLite (Resilient Embedded)';
}
