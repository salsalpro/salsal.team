-- Manual repair for the pre-CMS schema of salsal.team.
-- Run ALL statements together, first on a disposable Neon test branch.
-- Confirm the intended branch/database and preserve a separate pre-change
-- recovery branch before running on production. No connection URL change.
-- Expected baseline: 001-domain.sql applied, no partial CMS002 objects.
-- If any check fails: STOP. Do not remove guards or retry modified SQL.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $repair$
DECLARE
  before_count bigint;
  after_count bigint;
  before_fingerprint text;
  after_fingerprint text;
BEGIN
  PERFORM pg_advisory_xact_lock(1935764595);

  IF to_regclass(format('%I.blog_post', current_schema())) IS NULL
     OR to_regclass(format('%I.schema_migration', current_schema())) IS NULL THEN
    RAISE EXCEPTION 'STOP: expected blog_post/schema_migration missing in current schema. Check database and branch.';
  END IF;

  LOCK TABLE blog_post IN ACCESS EXCLUSIVE MODE;
  LOCK TABLE schema_migration IN SHARE ROW EXCLUSIVE MODE;

  IF NOT EXISTS (SELECT 1 FROM schema_migration WHERE version='001-domain.sql') THEN
    RAISE EXCEPTION 'STOP: baseline 001-domain.sql is not recorded. Inspect schema before repair.';
  END IF;
  IF EXISTS (SELECT 1 FROM schema_migration WHERE version='002-blog-cms.sql') THEN
    RAISE EXCEPTION 'STOP: 002 is already recorded. Do not rerun; verify existing schema.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema=current_schema() AND table_name='blog_post'
      AND column_name IN ('primary_language','editorial')
  ) OR to_regclass(format('%I.blog_image', current_schema())) IS NOT NULL
    OR to_regclass(format('%I.blog_slug_en_unique', current_schema())) IS NOT NULL
    OR to_regclass(format('%I.blog_slug_fa_unique', current_schema())) IS NOT NULL THEN
    RAISE EXCEPTION 'STOP: partial CMS schema detected. Requires a targeted repair, not this script.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid=to_regclass(format('%I.blog_post', current_schema()))
      AND conname='blog_post_slug_key' AND contype='u'
      AND pg_get_constraintdef(oid)='UNIQUE (slug)'
  ) THEN
    RAISE EXCEPTION 'STOP: original slug unique constraint differs from expected baseline.';
  END IF;

  SELECT count(*), md5(COALESCE(string_agg(to_jsonb(p)::text, E'\n' ORDER BY p.id),''))
    INTO before_count, before_fingerprint FROM blog_post p;

  -- The exact existing repository migration follows (no replacement migration).
  -- Preserve every existing localized value; NULL identifies legacy bilingual records.
  ALTER TABLE blog_post ADD COLUMN primary_language TEXT CHECK (primary_language IN ('fa','en'));
  ALTER TABLE blog_post ADD COLUMN editorial JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(editorial)='object');
  -- Legacy records reserve the slug in both locales; new records reserve their primary locale.
  CREATE UNIQUE INDEX blog_slug_en_unique ON blog_post(slug) WHERE primary_language IS NULL OR primary_language='en';
  CREATE UNIQUE INDEX blog_slug_fa_unique ON blog_post(slug) WHERE primary_language IS NULL OR primary_language='fa';
  ALTER TABLE blog_post DROP CONSTRAINT blog_post_slug_key;
  -- Article-only media references; private provider URLs never sent to the browser.
  CREATE TABLE blog_image (
    id TEXT PRIMARY KEY,
    pathname TEXT NOT NULL UNIQUE,
    content_type TEXT NOT NULL CHECK (content_type='image/webp'),
    created_at TEXT NOT NULL
  );

  INSERT INTO schema_migration(version,applied_at)
    VALUES ('002-blog-cms.sql',to_char(clock_timestamp() AT TIME ZONE 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));

  SELECT count(*), md5(COALESCE(string_agg(
      (to_jsonb(p)-'primary_language'-'editorial')::text, E'\n' ORDER BY p.id),''))
    INTO after_count, after_fingerprint FROM blog_post p;
  IF before_count <> after_count OR before_fingerprint <> after_fingerprint THEN
    RAISE EXCEPTION 'STOP: original article data changed. This transaction must roll back.';
  END IF;
END
$repair$;

COMMIT;

-- Successful execution returns the two expected migration versions,
-- the new columns and the article-image table name.
SELECT version FROM schema_migration ORDER BY version;
SELECT column_name,data_type,is_nullable
FROM information_schema.columns
WHERE table_schema=current_schema() AND table_name='blog_post'
  AND column_name IN ('primary_language','editorial')
ORDER BY column_name;
SELECT to_regclass(format('%I.blog_image', current_schema()))::text AS image_table;
