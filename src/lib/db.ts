import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { scryptSync, randomBytes } from "node:crypto";

// ---------------------------------------------------------------------------
// Connection (singleton across dev hot-reloads)
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "tossbook.db");

declare global {
  // eslint-disable-next-line no-var
  var __tossbook_db: Database.Database | undefined;
}

function connect(): Database.Database {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  return database;
}

export const db: Database.Database = global.__tossbook_db ?? connect();
if (process.env.NODE_ENV !== "production") global.__tossbook_db = db;

// ---------------------------------------------------------------------------
// Password hashing (built-in crypto — no native bcrypt needed)
// ---------------------------------------------------------------------------
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(plain, salt, 64).toString("hex");
  // constant-time-ish compare
  if (derived.length !== key.length) return false;
  let diff = 0;
  for (let i = 0; i < derived.length; i++) diff |= derived.charCodeAt(i) ^ key.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password      TEXT NOT NULL,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('admin','client')),
      parent_id     INTEGER REFERENCES users(id),
      balance       REAL NOT NULL DEFAULT 0,
      exposure      REAL NOT NULL DEFAULT 0,
      credit_limit  REAL NOT NULL DEFAULT 0,
      share_pct     REAL NOT NULL DEFAULT 0,
      commission_pct REAL NOT NULL DEFAULT 0,
      status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','locked')),
      must_change_pw INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      team_a      TEXT NOT NULL,
      team_b      TEXT NOT NULL,
      league      TEXT NOT NULL DEFAULT 'Cricket',
      start_time  TEXT NOT NULL,
      end_time    TEXT,
      image_url   TEXT,
      status      TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','closed','settled')),
      created_by  INTEGER REFERENCES users(id),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS markets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id    INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      type        TEXT NOT NULL CHECK (type IN ('toss','match_winner')),
      name        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','suspended','closed','settled')),
      rate_a      REAL NOT NULL DEFAULT 1.98,
      rate_b      REAL NOT NULL DEFAULT 1.98,
      min_stake   REAL NOT NULL DEFAULT 100,
      max_stake   REAL NOT NULL DEFAULT 500000,
      result      TEXT CHECK (result IN ('A','B','void')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      settled_at  TEXT
    );

    CREATE TABLE IF NOT EXISTS bets (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id),
      match_id      INTEGER NOT NULL REFERENCES matches(id),
      market_id     INTEGER NOT NULL REFERENCES markets(id),
      market_type   TEXT NOT NULL,
      selection     TEXT NOT NULL CHECK (selection IN ('A','B')),
      selection_name TEXT NOT NULL,
      stake         REAL NOT NULL,
      rate          REAL NOT NULL,
      potential_win REAL NOT NULL,
      status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','won','lost','void')),
      result_pl     REAL NOT NULL DEFAULT 0,
      placed_at     TEXT NOT NULL DEFAULT (datetime('now')),
      settled_at    TEXT
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id),
      type          TEXT NOT NULL,
      amount        REAL NOT NULL,
      balance_after REAL NOT NULL,
      ref_type      TEXT,
      ref_id        INTEGER,
      remark        TEXT NOT NULL DEFAULT '',
      created_by    INTEGER,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requests (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      parent_id   INTEGER REFERENCES users(id),
      type        TEXT NOT NULL CHECK (type IN ('deposit','withdraw')),
      amount      REAL NOT NULL,
      method      TEXT NOT NULL DEFAULT 'manual',
      note        TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      decided_by  INTEGER REFERENCES users(id),
      decided_at  TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_id);
    CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id);
    CREATE INDEX IF NOT EXISTS idx_bets_market ON bets(market_id);
    CREATE INDEX IF NOT EXISTS idx_markets_match ON markets(match_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_requests_parent ON requests(parent_id, status);
    CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
  `);

  // Backfill columns added after a database may already exist.
  try {
    db.exec("ALTER TABLE matches ADD COLUMN end_time TEXT");
  } catch {
    /* column already present */
  }
  try {
    db.exec("ALTER TABLE matches ADD COLUMN image_url TEXT");
  } catch {
    /* column already present */
  }
}

// ---------------------------------------------------------------------------
// Seed — runs once when the users table is empty
// ---------------------------------------------------------------------------
function seed() {
  const count = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  if (count > 0) return;

  // Production seed: a single admin account, from environment variables.
  // No demo clients, no sample matches — the admin creates everything.
  const adminUser = (process.env.ADMIN_USERNAME || "admin").trim();
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  const adminFloat = Number(process.env.ADMIN_FLOAT || "1000000000");

  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      "[toss-book] WARNING: ADMIN_PASSWORD is not set — seeding admin with the default password 'admin123'. " +
        "Set ADMIN_USERNAME / ADMIN_PASSWORD before running in production.",
    );
  }

  // INSERT OR IGNORE keeps this race-safe: if another process/connection has
  // already created the admin (same UNIQUE username), the insert is skipped
  // instead of throwing a UNIQUE-constraint error.
  db.prepare(
    `INSERT OR IGNORE INTO users (username, password, name, role, parent_id, balance, share_pct, commission_pct)
     VALUES (?, ?, 'Administrator', 'admin', NULL, ?, 0, 0)`,
  ).run(adminUser, hashPassword(adminPass), Number.isFinite(adminFloat) ? adminFloat : 1_000_000_000);
}

// Initialise on module load. Tables are always ensured (CREATE TABLE IF NOT
// EXISTS is idempotent), but seeding is skipped during `next build`: there,
// route modules are imported in parallel workers only to read their config,
// and concurrent seed() calls would otherwise race on the empty users table.
migrate();
if (process.env.NEXT_PHASE !== "phase-production-build") seed();
