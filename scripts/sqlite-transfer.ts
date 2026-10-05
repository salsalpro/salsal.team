import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import { closeDb, query, transaction } from "../src/lib/db";

export const tables = [
  "user",
  "account",
  "session",
  "verification",
  "profile",
  "lead",
  "project",
  "client_service",
  "deliverable",
  "report",
  "notification",
  "blog_post",
  "portfolio",
  "service_setting",
  "rate_limit",
] as const;
class TransferError extends Error {}
const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;
type Row = Record<string, unknown>;
type Column = { column_name: string; data_type: string };

function sourceDatabase(filename: string) {
  const db = new Database(path.resolve(filename), {
    readonly: true,
    fileMustExist: true,
  });
  db.pragma("query_only = ON");
  return db;
}
function checkSource(db: Database.Database) {
  if (
    db.pragma("integrity_check", { simple: true }) !== "ok" ||
    (db.pragma("foreign_key_check") as unknown[]).length
  )
    throw new TransferError(
      "SQLite integrity or foreign-key verification failed.",
    );
  const found = (
    db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      )
      .all() as { name: string }[]
  ).map((row) => row.name);
  const expected = [...tables, "schema_migration"];
  if (
    found.length !== expected.length ||
    expected.some((name) => !found.includes(name))
  )
    throw new TransferError(
      "Source schema differs from the supported Salsal schema; review before importing.",
    );
  const versions = db
    .prepare("SELECT version FROM schema_migration ORDER BY version")
    .all() as { version: string }[];
  if (versions.length !== 1 || versions[0].version !== "001-domain.sql")
    throw new TransferError("Unsupported source migration version.");
}

/** SQLite's backup API includes committed WAL records; copying only the main file does not. */
export async function backupSqlite(source: string, destination: string) {
  if (
    path.resolve(source) === path.resolve(destination) ||
    existsSync(destination) ||
    existsSync(`${destination}.manifest.json`)
  )
    throw new TransferError(
      "Backup destination must be new and distinct from the source.",
    );
  mkdirSync(path.dirname(path.resolve(destination)), {
    recursive: true,
    mode: 0o700,
  });
  closeSync(openSync(destination, "wx", 0o600));
  const db = sourceDatabase(source);
  try {
    checkSource(db);
    await db.backup(destination);
  } finally {
    db.close();
  }
  chmodSync(destination, 0o600);
  const backup = sourceDatabase(destination);
  try {
    checkSource(backup);
    const counts = Object.fromEntries(
      tables.map((table) => [
        table,
        (
          backup.prepare(`SELECT COUNT(*) AS n FROM ${quote(table)}`).get() as {
            n: number;
          }
        ).n,
      ]),
    );
    writeFileSync(
      `${destination}.manifest.json`,
      JSON.stringify(
        {
          source: path.resolve(source),
          createdAt: new Date().toISOString(),
          sha256: createHash("sha256")
            .update(readFileSync(destination))
            .digest("hex"),
          counts,
        },
        null,
        2,
      ),
      { flag: "wx", mode: 0o600 },
    );
    return counts;
  } finally {
    backup.close();
  }
}

function normalize(value: unknown, type: string): unknown {
  if (value === null) return null;
  if (type === "boolean") {
    if (![true, false, 0, 1].includes(value as boolean | number))
      throw new TransferError("Invalid source boolean.");
    return value === true || value === 1;
  }
  if (type.startsWith("timestamp")) {
    const date =
      value instanceof Date ? value : new Date(value as string | number);
    if (Number.isNaN(date.getTime()))
      throw new TransferError("Invalid source timestamp.");
    return date.toISOString();
  }
  if (["integer", "bigint", "smallint"].includes(type)) {
    const number = Number(value);
    if (!Number.isSafeInteger(number))
      throw new TransferError(
        "Source integer is outside the supported safe range.",
      );
    return number;
  }
  return value;
}
function digest(rows: Row[], columns: Column[]) {
  const records = rows
    .map((row) =>
      JSON.stringify(
        columns.map((column) =>
          normalize(row[column.column_name], column.data_type),
        ),
      ),
    )
    .sort();
  return createHash("sha256").update(JSON.stringify(records)).digest("hex");
}

/** One-shot import, or read-only comparison. Never merges/overwrites an occupied target. */
export async function transferSqlite(filename: string, verifyOnly = false) {
  let stage = "source validation";
  const source = sourceDatabase(filename);
  source.exec("BEGIN");
  try {
    checkSource(source);
    return await transaction(async () => {
      stage = "target initialization and locking";
      if (verifyOnly)
        await query(
          "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY",
        );
      else
        await query(
          `LOCK TABLE ${tables.map(quote).join(",")} IN ACCESS EXCLUSIVE MODE`,
        );
      const sourceVersions = (
        source
          .prepare("SELECT version FROM schema_migration ORDER BY version")
          .all() as { version: string }[]
      ).map((row) => row.version);
      const targetVersions = (
        await query<{ version: string }>(
          "SELECT version FROM schema_migration ORDER BY version",
        )
      ).rows.map((row) => row.version);
      if (JSON.stringify(sourceVersions) !== JSON.stringify(targetVersions))
        throw new TransferError("Source and target migration versions differ.");
      const result: Record<string, number> = {};
      for (const table of tables) {
        if (
          !verifyOnly &&
          Number(
            (await query(`SELECT COUNT(*) AS n FROM ${quote(table)}`)).rows[0]
              .n,
          ) !== 0
        )
          throw new TransferError(
            `Target table ${table} is not empty. No import was committed.`,
          );
      }
      for (const table of tables) {
        stage = `table ${table}`;
        const columns = (
          await query<Column>(
            "SELECT column_name,data_type FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1 ORDER BY column_name",
            [table],
          )
        ).rows;
        const sourceColumns = (
          source.pragma(`table_info(${quote(table)})`) as { name: string }[]
        )
          .map((column) => column.name)
          .sort();
        if (
          JSON.stringify(sourceColumns) !==
          JSON.stringify(columns.map((column) => column.column_name))
        )
          throw new TransferError(
            `Column mismatch in ${table}; import aborted.`,
          );
        const rows = source
          .prepare(`SELECT * FROM ${quote(table)}`)
          .all() as Row[];
        if (!verifyOnly) {
          const sql = `INSERT INTO ${quote(table)} (${columns.map((column) => quote(column.column_name)).join(",")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(",")})`;
          for (const row of rows)
            await query(
              sql,
              columns.map((column) =>
                normalize(row[column.column_name], column.data_type),
              ),
            );
        }
        const targetRows = (await query(`SELECT * FROM ${quote(table)}`)).rows;
        if (
          rows.length !== targetRows.length ||
          digest(rows, columns) !== digest(targetRows, columns)
        )
          throw new TransferError(
            `Data verification failed for ${table}; no import was committed.`,
          );
        result[table] = rows.length;
      }
      // All existing IDs are text, so no sequences need advancing. FK/unique/check constraints remain enabled.
      return result;
    });
  } catch (error) {
    if (error instanceof TransferError) throw error;
    throw new TransferError(
      `Transfer failed during ${stage}; no import was committed. Check target connection, schema and constraints.`,
    );
  } finally {
    source.exec("ROLLBACK");
    source.close();
  }
}

async function main() {
  loadEnvConfig(process.cwd());
  const [mode, source, destination] = process.argv.slice(2);
  if (
    !source ||
    !["backup", "import", "verify"].includes(mode) ||
    (mode === "backup" && !destination)
  )
    throw new TransferError(
      "Usage: db:sqlite -- backup SOURCE NEW_BACKUP | import VERIFIED_BACKUP | verify VERIFIED_BACKUP",
    );
  if (mode !== "backup") {
    const manifest = JSON.parse(
      readFileSync(`${source}.manifest.json`, "utf8"),
    ) as { sha256: string };
    if (
      manifest.sha256 !==
      createHash("sha256").update(readFileSync(source)).digest("hex")
    )
      throw new TransferError("Backup digest does not match its manifest.");
  }
  const counts =
    mode === "backup"
      ? await backupSqlite(source, destination)
      : await transferSqlite(source, mode === "verify");
  console.log(`${mode} completed and verified. Table counts:`, counts);
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main()
    .catch((error: unknown) => {
      // Never log driver exceptions: they may include private records or connection strings.
      console.error(
        error instanceof TransferError
          ? error.message
          : "SQLite transfer failed; source was retained and any import transaction rolled back. Check the command, verified backup, target schema/emptiness, and database connection.",
      );
      process.exitCode = 1;
    })
    .finally(closeDb);
}
