import { createClient } from "@libsql/client";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { INIT_SQL } from "./schema.js";
let client = null;
let initPromise = null;
function createLibsqlClient() {
    const url = process.env.TURSO_DATABASE_URL ??
        pathToFileURL(path.join(process.cwd(), "data.sqlite")).href;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (authToken !== undefined && authToken !== "") {
        return createClient({ url, authToken });
    }
    return createClient({ url });
}
/** Recreate tasks table so for_date can be NULL (outstanding tasks). Idempotent. */
async function migrateTasksForDateNullable(c) {
    const rs = await c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'");
    if (rs.rows.length === 0)
        return;
    const createSql = String(rs.rows[0].sql ?? "");
    if (!createSql.includes("for_date TEXT NOT NULL"))
        return;
    await c.batch([
        `CREATE TABLE tasks__new (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    for_date TEXT,
    notes TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    owner_id TEXT
  )`,
        `INSERT INTO tasks__new SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id FROM tasks`,
        `DROP TABLE tasks`,
        `ALTER TABLE tasks__new RENAME TO tasks`,
        `CREATE INDEX IF NOT EXISTS idx_tasks_for_date ON tasks(for_date)`,
        `CREATE INDEX IF NOT EXISTS idx_tasks_owner_id_for_date ON tasks(owner_id, for_date)`,
    ], "write");
}
async function initClient() {
    const c = createLibsqlClient();
    await c.executeMultiple(INIT_SQL);
    await migrateTasksForDateNullable(c);
    return c;
}
export async function getDb() {
    if (client)
        return client;
    initPromise ??= initClient().then((c) => {
        client = c;
        return c;
    });
    return initPromise;
}
/** @deprecated Writes are persisted automatically; kept for minimal churn in callers. */
export function saveDb() { }
export function closeDb() {
    if (client) {
        client.close();
        client = null;
        initPromise = null;
    }
}
