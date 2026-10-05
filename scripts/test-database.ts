import { randomUUID } from "node:crypto";
import { Pool } from "pg";

/** Tests require an explicitly designated PostgreSQL database; never use DATABASE_URL. */
export function testDatabase(prefix = "backend") {
  const base = process.env.TEST_DATABASE_URL;
  if (!base)
    throw new Error(
      "Set TEST_DATABASE_URL to a dedicated PostgreSQL test database.",
    );
  const schema = `salsal_test_${prefix}_${randomUUID().replaceAll("-", "")}`;
  const url = new URL(base);
  url.searchParams.set("options", `-c search_path=${schema}`);
  return { schema, url: url.toString() };
}
export async function createTestSchema(schema: string) {
  if (!/^salsal_test_[a-z0-9]+_[a-f0-9]{32}$/.test(schema))
    throw new Error("Invalid test schema.");
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await pool.query(`CREATE SCHEMA "${schema}"`);
  } finally {
    await pool.end();
  }
}
export async function dropTestSchema(schema: string) {
  if (!/^salsal_test_[a-z0-9]+_[a-f0-9]{32}$/.test(schema))
    throw new Error("Invalid test schema.");
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await pool.end();
  }
}
