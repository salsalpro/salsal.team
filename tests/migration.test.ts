import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomBytes, createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { backupSqlite, transferSqlite } from "../scripts/sqlite-transfer";
import {
  testDatabase,
  createTestSchema,
  dropTestSchema,
} from "../scripts/test-database";
import { getDb, closeDb, query, transaction } from "../src/lib/db";
import {
  consumeRateLimit,
  listUsers,
  getAdminOverview,
  getProfile,
} from "../src/lib/repository";

const database = testDatabase("migration");
process.env.DATABASE_URL = database.url;
const directory = path.join(process.cwd(), "work", database.schema);
mkdirSync(directory, { recursive: true });
const sourcePath = path.join(directory, "source.sqlite");
const backupPath = path.join(directory, "verified.sqlite");
const source = new Database(sourcePath);
source.pragma("journal_mode=WAL");
source.pragma("foreign_keys=ON");
const secret = randomBytes(48).toString("base64url");
const options = {
  secret,
  baseURL: "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      role: {
        type: "string" as const,
        input: false,
        required: false,
        defaultValue: "USER",
      },
    },
  },
};
const sqliteAuth = betterAuth({ ...options, database: source });
const postgresAuth = betterAuth({ ...options, database: getDb() });
let adminId = "";
let cookie = "";
const password = "MigrationTestPassword2026!";
const hashFile = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
let sourceHash = "";

before(async () => {
  await createTestSchema(database.schema);
  await (await getMigrations(sqliteAuth.options)).runMigrations();
  source.exec(readFileSync("migrations/001-domain.sql", "utf8"));
  source.exec(
    "CREATE TABLE schema_migration(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  source
    .prepare("INSERT INTO schema_migration VALUES (?,?)")
    .run("001-domain.sql", new Date().toISOString());
  const result = await sqliteAuth.api.signUpEmail({
    body: {
      name: "Migration Admin",
      email: "migration@example.test",
      password,
    },
  });
  adminId = result.user.id;
  source.prepare('UPDATE "user" SET role=? WHERE id=?').run("ADMIN", adminId);
  const response = await sqliteAuth.api.signInEmail({
    body: { email: "migration@example.test", password },
    asResponse: true,
  });
  cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  source
    .prepare(
      "INSERT INTO lead(id,name,service,message,preferred_language,contact_method,created_at) VALUES (?,?,?,?,?,?,?)",
    )
    .run(
      "lead-fixture",
      "Migration lead",
      "seo",
      "Synthetic migration test lead.",
      "fa",
      "email",
      new Date().toISOString(),
    );
  source
    .prepare("INSERT INTO rate_limit VALUES (?,?,?)")
    .run("large-timestamp", 2, Date.now() + 600000);
  const localized = JSON.stringify({ en: "Synthetic", fa: "آزمایشی" });
  const timestamp = new Date().toISOString();
  source
    .prepare('UPDATE "user" SET "createdAt"=? WHERE id=?')
    .run(Date.now(), adminId);
  source
    .prepare("INSERT INTO profile(user_id,locale) VALUES (?,?)")
    .run(adminId, "fa");
  source
    .prepare(
      "INSERT INTO project(id,client_id,title,description,service_ids,status,progress,stage,start_date,deadline,created_at,updated_at,is_demo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
    )
    .run(
      "p1",
      adminId,
      localized,
      localized,
      '["seo"]',
      "active",
      50,
      localized,
      "2026-01-01",
      "2026-12-31",
      timestamp,
      timestamp,
      1,
    );
  source
    .prepare(
      "INSERT INTO client_service(id,user_id,service_slug,package,status,start_date,end_date,progress,team,latest_update,is_demo) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    )
    .run(
      "cs1",
      adminId,
      "seo",
      localized,
      "active",
      "2026-01-01",
      "2026-12-31",
      50,
      "test",
      localized,
      1,
    );
  source
    .prepare(
      "INSERT INTO deliverable(id,project_id,title,filename,content,size,created_at,is_demo) VALUES (?,?,?,?,?,?,?,?)",
    )
    .run(
      "d1",
      "p1",
      localized,
      "test.txt",
      "Synthetic private content",
      25,
      timestamp,
      1,
    );
  source
    .prepare(
      "INSERT INTO report(id,user_id,project_id,title,category,period,summary,created_at,is_demo) VALUES (?,?,?,?,?,?,?,?,?)",
    )
    .run(
      "r1",
      adminId,
      "p1",
      localized,
      "seo",
      "test",
      localized,
      timestamp,
      1,
    );
  source
    .prepare(
      "INSERT INTO notification(id,user_id,title,message,created_at,read) VALUES (?,?,?,?,?,?)",
    )
    .run("n1", adminId, localized, localized, timestamp, 1);
  source
    .prepare(
      "INSERT INTO blog_post(id,slug,title,excerpt,content,category,author,seo_title,seo_description,created_at,updated_at,published,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
    )
    .run(
      "b1",
      "test",
      localized,
      localized,
      localized,
      localized,
      "Test",
      localized,
      localized,
      timestamp,
      timestamp,
      0,
      null,
    );
  source
    .prepare(
      "INSERT INTO portfolio(id,slug,title,client,industry,services,challenge,approach,solution,result,date) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    )
    .run(
      "pf1",
      "test",
      localized,
      "Test",
      localized,
      '["seo"]',
      localized,
      localized,
      localized,
      localized,
      "2026-01-01",
    );
  source
    .prepare("INSERT INTO service_setting(slug,visible) VALUES (?,?)")
    .run("seo", 0);
  await (await getMigrations(postgresAuth.options)).runMigrations();
  // The legacy transfer deliberately targets the original schema before CMS expansion.
  await query(readFileSync("migrations/001-domain.sql", "utf8"));
  await query(
    "CREATE TABLE schema_migration(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  await query("INSERT INTO schema_migration VALUES ($1,$2)", [
    "001-domain.sql",
    new Date().toISOString(),
  ]);
});
after(async () => {
  source.close();
  await closeDb();
  await dropTestSchema(database.schema);
  rmSync(directory, { recursive: true, force: true });
});

test("WAL-aware backup includes records, verifies integrity, and refuses overwrite", async () => {
  const counts = await backupSqlite(sourcePath, backupPath);
  assert.equal(counts.user, 1);
  assert.equal(counts.account, 1);
  assert.equal(counts.lead, 1);
  assert.equal(statSync(backupPath).mode & 0o777, 0o600);
  assert.ok(statSync(`${backupPath}.manifest.json`).size);
  sourceHash = hashFile(backupPath);
  await assert.rejects(backupSqlite(sourcePath, backupPath), /destination/);
});

test("failed import rolls every table back; retry preserves all rows, hashes, roles and timestamps", async () => {
  await query(
    "CREATE FUNCTION reject_test_lead() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$",
  );
  await query(
    "CREATE TRIGGER reject_test_lead BEFORE INSERT ON lead FOR EACH ROW EXECUTE FUNCTION reject_test_lead()",
  );
  await assert.rejects(transferSqlite(backupPath));
  assert.equal(
    Number((await query('SELECT COUNT(*) AS n FROM "user"')).rows[0].n),
    0,
  );
  assert.equal(
    Number((await query("SELECT COUNT(*) AS n FROM account")).rows[0].n),
    0,
  );
  await query("DROP TRIGGER reject_test_lead ON lead");
  const counts = await transferSqlite(backupPath);
  assert.equal(counts.user, 1);
  assert.equal(counts.session, 2);
  assert.deepEqual(await transferSqlite(backupPath, true), counts);
  assert.equal(hashFile(backupPath), sourceHash);
  assert.equal((await getProfile(adminId))?.role, "ADMIN");
  assert.equal(
    (await listUsers({ search: "MIGRATION@EXAMPLE", role: "ADMIN" })).total,
    1,
  );
  assert.equal(
    (await getAdminOverview()).registrationSeries.reduce(
      (n, day) => n + day.count,
      0,
    ),
    1,
  );
  await assert.rejects(transferSqlite(backupPath), /not empty/);
  assert.deepEqual(await transferSqlite(backupPath, true), counts);
});

test("migrated credentials and existing sessions authenticate without resetting passwords", async () => {
  const session = await postgresAuth.api.getSession({
    headers: new Headers({ cookie }),
  });
  assert.equal(session?.user.id, adminId);
  assert.equal(session?.user.role, "ADMIN");
  const response = await postgresAuth.api.signInEmail({
    body: { email: "migration@example.test", password },
    asResponse: true,
  });
  assert.equal(response.status, 200);
  const duplicate = await postgresAuth.api.signUpEmail({
    body: { name: "Duplicate", email: "MIGRATION@example.test", password },
    asResponse: true,
  });
  assert.equal(duplicate.status, 422);
  assert.equal(
    (await duplicate.json()).code,
    "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
  );
  const wrong = await postgresAuth.api.signInEmail({
    body: {
      email: "migration@example.test",
      password: "IncorrectPassword2026!",
    },
    asResponse: true,
  });
  assert.equal(wrong.status, 401);
  assert.equal((await wrong.json()).code, "INVALID_EMAIL_OR_PASSWORD");
});

test("PostgreSQL constraints, rollback, and concurrent throttling retain behavior", async () => {
  await assert.rejects(
    query("INSERT INTO profile(user_id) VALUES ($1)", ["missing-user"]),
    { code: "23503" },
  );
  await assert.rejects(
    query(
      'INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6)',
      [
        "duplicate-id",
        "duplicate",
        "migration@example.test",
        false,
        new Date(),
        new Date(),
      ],
    ),
    { code: "23505" },
  );
  await assert.rejects(
    transaction(async () => {
      await query("INSERT INTO service_setting(slug) VALUES ($1)", [
        "rollback-test",
      ]);
      throw new Error("test rollback");
    }),
  );
  assert.equal(
    (
      await query("SELECT * FROM service_setting WHERE slug=$1", [
        "rollback-test",
      ])
    ).rowCount,
    0,
  );
  const results = await Promise.all(
    Array.from({ length: 20 }, () => consumeRateLimit("concurrent-test", 5)),
  );
  assert.equal(results.filter(Boolean).length, 5);
});
