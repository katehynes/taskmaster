import initSqlJs from "sql.js";
import path from "node:path";
import fs from "node:fs";
import { INIT_SQL } from "./schema.js";
const DB_PATH = path.join(process.cwd(), "data.sqlite");
let db = null;
/** Recreate tasks table so for_date can be NULL (outstanding tasks). Idempotent. */
function migrateTasksForDateNullable(database) {
    const r = database.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'");
    if (!r.length || !r[0].values.length)
        return;
    const createSql = String(r[0].values[0][0] ?? "");
    if (!createSql.includes("for_date TEXT NOT NULL"))
        return;
    database.run(`CREATE TABLE tasks__new (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    for_date TEXT,
    notes TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    owner_id TEXT
  )`);
    database.run(`INSERT INTO tasks__new SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id FROM tasks`);
    database.run(`DROP TABLE tasks`);
    database.run(`ALTER TABLE tasks__new RENAME TO tasks`);
    database.run(`CREATE INDEX IF NOT EXISTS idx_tasks_for_date ON tasks(for_date)`);
    database.run(`CREATE INDEX IF NOT EXISTS idx_tasks_owner_id_for_date ON tasks(owner_id, for_date)`);
}
export async function getDb() {
    if (db)
        return db;
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
        const buf = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buf);
    }
    else {
        db = new SQL.Database();
    }
    db.run(INIT_SQL);
    migrateTasksForDateNullable(db);
    saveDb();
    return db;
}
export function saveDb() {
    if (!db)
        return;
    const data = db.export();
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}
export function closeDb() {
    if (db) {
        saveDb();
        db.close();
        db = null;
    }
}
