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
