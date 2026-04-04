export const INIT_SQL = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  for_date TEXT,
  notes TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  owner_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_for_date ON tasks(for_date);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id_for_date ON tasks(owner_id, for_date);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  expiration_days INTEGER NOT NULL DEFAULT 2
);

INSERT OR IGNORE INTO settings (id, owner_id, expiration_days) VALUES ('default', NULL, 2);
`;
