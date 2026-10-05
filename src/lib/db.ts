import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

const globalDb = globalThis as typeof globalThis & { salsalPg?: Pool };
const transactionClient = new AsyncLocalStorage<PoolClient>();

export function getDb(): Pool {
  if (globalDb.salsalPg) return globalDb.salsalPg;
  if (!process.env.DATABASE_URL)
    throw new Error("Set DATABASE_URL to your PostgreSQL connection string.");
  const max = Number(process.env.DATABASE_POOL_MAX || 5);
  if (!Number.isInteger(max) || max < 1 || max > 100)
    throw new Error("DATABASE_POOL_MAX must be an integer between 1 and 100.");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    // Scripts close the pool explicitly; idle clients need not keep a process alive.
    allowExitOnIdle: true,
  });
  pool.on("error", () =>
    console.error("Salsal PostgreSQL idle connection failed."),
  );
  globalDb.salsalPg = pool;
  return pool;
}

export function query<T extends QueryResultRow = Record<string, unknown>>(
  sql: string,
  parameters: unknown[] = [],
) {
  return (transactionClient.getStore() || getDb()).query<T>(sql, parameters);
}

/** All repository calls inside work share one connection, including nested calls. */
export async function transaction<T>(work: () => Promise<T>): Promise<T> {
  if (transactionClient.getStore()) return work();
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const value = await transactionClient.run(client, work);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDb(): Promise<void> {
  const pool = globalDb.salsalPg;
  delete globalDb.salsalPg;
  if (pool) await pool.end();
}

/** Explicit ordered migrations; request startup never silently changes schema. */
export async function migrateDomain(): Promise<void> {
  await transaction(async () => {
    await query("SELECT pg_advisory_xact_lock(1935764595)");
    await query(
      "CREATE TABLE IF NOT EXISTS schema_migration (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
    );
    const directory = path.join(process.cwd(), "migrations");
    for (const file of readdirSync(directory)
      .filter((name) => /^\d+.*\.sql$/.test(name))
      .sort()) {
      if (
        (
          await query(
            "SELECT version FROM schema_migration WHERE version = $1",
            [file],
          )
        ).rowCount
      )
        continue;
      await query(readFileSync(path.join(directory, file), "utf8"));
      await query(
        "INSERT INTO schema_migration(version, applied_at) VALUES ($1, $2)",
        [file, new Date().toISOString()],
      );
    }
  });
}
