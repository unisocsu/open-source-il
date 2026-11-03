PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id TEXT UNIQUE,
  google_id TEXT UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  reputation INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','trusted','moderator','admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  repository_url TEXT NOT NULL UNIQUE,
  repository_owner TEXT NOT NULL,
  repository_name TEXT NOT NULL,
  github_stars INTEGER NOT NULL DEFAULT 0,
  website_url TEXT,
  license TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected','archived')),
  submitted_by TEXT REFERENCES users(id),
  approved_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS project_categories (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, category_id)
);

CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  title TEXT,
  release_url TEXT NOT NULL,
  published_at TEXT,
  is_prerelease INTEGER NOT NULL DEFAULT 0,
  UNIQUE(project_id, tag_name)
);

CREATE TABLE IF NOT EXISTS release_assets (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  download_url TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  platform TEXT
);

CREATE TABLE IF NOT EXISTS votes (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, project_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reporter_id TEXT REFERENCES users(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_status_published ON projects(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_releases_project ON releases(project_id);
CREATE INDEX IF NOT EXISTS idx_votes_project ON votes(project_id);

INSERT OR IGNORE INTO categories (id,name,slug,description,sort_order) VALUES
('cat-dev','פיתוח','development','כלים וסביבות לפיתוח תוכנה',1),
('cat-android','אנדרואיד','android','אפליקציות וכלים למכשירי Android',2),
('cat-windows','Windows','windows','תוכנות וכלים ל-Windows',3),
('cat-linux','Linux','linux','תוכנות וכלים ל-Linux',4),
('cat-ai','בינה מלאכותית','ai','מודלים וכלים מבוססי AI',5),
('cat-security','אבטחה','security','כלי אבטחה ופרטיות',6),
('cat-media','מדיה','media','אודיו, וידאו ותמונות',7),
('cat-tools','כלים','tools','כלים שימושיים נוספים',8);
