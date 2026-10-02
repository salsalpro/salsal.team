CREATE TABLE IF NOT EXISTS profile (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  company TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', locale TEXT NOT NULL DEFAULT 'en' CHECK(locale IN ('en','fa'))
);
CREATE TABLE IF NOT EXISTS lead (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', company TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL, budget TEXT NOT NULL DEFAULT '', message TEXT NOT NULL,
  preferred_language TEXT NOT NULL CHECK(preferred_language IN ('en','fa')), contact_method TEXT NOT NULL CHECK(contact_method IN ('email','phone')),
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','qualified','converted','closed')),
  notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS lead_status_created_idx ON lead(status, created_at DESC);
CREATE TABLE IF NOT EXISTS project (
  id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
  title TEXT NOT NULL, description TEXT NOT NULL, service_ids TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('planning','active','review','completed','paused')),
  progress INTEGER NOT NULL CHECK(progress BETWEEN 0 AND 100), stage TEXT NOT NULL,
  start_date TEXT NOT NULL, deadline TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', milestones TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, is_demo INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS project_client_idx ON project(client_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS client_service (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  service_slug TEXT NOT NULL, package TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','completed','paused')),
  start_date TEXT NOT NULL, end_date TEXT NOT NULL, progress INTEGER NOT NULL CHECK(progress BETWEEN 0 AND 100),
  team TEXT NOT NULL, latest_update TEXT NOT NULL, is_demo INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS client_service_user_idx ON client_service(user_id);
CREATE TABLE IF NOT EXISTS deliverable (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  title TEXT NOT NULL, filename TEXT NOT NULL, mime_type TEXT NOT NULL DEFAULT 'text/plain',
  content TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL, is_demo INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS deliverable_project_idx ON deliverable(project_id);
CREATE TABLE IF NOT EXISTS report (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE, title TEXT NOT NULL, category TEXT NOT NULL,
  period TEXT NOT NULL, summary TEXT NOT NULL, metrics TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, is_demo INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS report_user_idx ON report(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS notification (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  title TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS notification_user_idx ON notification(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS blog_post (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, excerpt TEXT NOT NULL, content TEXT NOT NULL,
  category TEXT NOT NULL, author TEXT NOT NULL, cover TEXT NOT NULL DEFAULT '', published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT, seo_title TEXT NOT NULL, seo_description TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, is_demo INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS blog_published_idx ON blog_post(published, published_at DESC);
CREATE TABLE IF NOT EXISTS portfolio (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, client TEXT NOT NULL,
  industry TEXT NOT NULL, services TEXT NOT NULL, cover TEXT NOT NULL DEFAULT '', gallery TEXT NOT NULL DEFAULT '[]',
  challenge TEXT NOT NULL, approach TEXT NOT NULL, solution TEXT NOT NULL, result TEXT NOT NULL, date TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS service_setting (slug TEXT PRIMARY KEY, visible INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS rate_limit (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
