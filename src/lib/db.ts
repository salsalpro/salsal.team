import Database from "better-sqlite3";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const globalDb = globalThis as typeof globalThis & { salsalDb?: Database.Database };

export function getDb(): Database.Database {
  if (globalDb.salsalDb) return globalDb.salsalDb;
  const filename = path.resolve(process.env.DATABASE_PATH || ".data/salsal.sqlite");
  mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  globalDb.salsalDb = db;
  return db;
}

/** Ordered, transactional SQL migrations. Production startup does not silently mutate schema. */
export function migrateDomain(db = getDb()): void {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migration (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  const directory = path.join(process.cwd(), "migrations");
  for (const file of readdirSync(directory).filter((name) => /^\d+.*\.sql$/.test(name)).sort()) {
    if (db.prepare("SELECT version FROM schema_migration WHERE version = ?").get(file)) continue;
    db.transaction(() => {
      db.exec(readFileSync(path.join(directory, file), "utf8"));
      db.prepare("INSERT INTO schema_migration(version, applied_at) VALUES (?, ?)").run(file, new Date().toISOString());
    })();
  }
}
