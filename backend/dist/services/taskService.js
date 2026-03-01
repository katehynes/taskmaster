import { getDb, saveDb } from "../db/index.js";
import { rowToTask } from "../db/mappers.js";
import { isTaskVisible, todayISO } from "./expiration.js";
import { randomUUID } from "node:crypto";
export async function getTasks(options = {}) {
    const db = await getDb();
    const settings = await getExpirationDays();
    const today = todayISO();
    const includeExpired = options.includeExpired === true;
    let fromDate = options.fromDate;
    let toDate = options.toDate;
    if (options.forDate) {
        fromDate = options.forDate;
        toDate = options.forDate;
    }
    if (!fromDate || !toDate) {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        fromDate = start.toISOString().slice(0, 10);
        toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            .toISOString()
            .slice(0, 10);
    }
    const stmt = db.prepare(`SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id
     FROM tasks
     WHERE for_date >= ? AND for_date <= ?
     ORDER BY for_date, created_at`);
    stmt.bind([fromDate, toDate]);
    const result = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        const task = rowToTask(row);
        if (includeExpired || isTaskVisible(task.forDate, settings, today)) {
            result.push(task);
        }
    }
    stmt.free();
    return result;
}
export async function getExpirationDays() {
    const db = await getDb();
    const rows = db.exec("SELECT expiration_days FROM settings WHERE id = 'default'");
    if (rows.length > 0 && rows[0].values.length > 0) {
        return rows[0].values[0][0];
    }
    return 2;
}
export async function createTask(input) {
    const db = await getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    const notes = input.notes ?? null;
    db.run(`INSERT INTO tasks (id, title, for_date, notes, completed, created_at, updated_at, owner_id)
     VALUES (?, ?, ?, ?, 0, ?, ?, NULL)`, [id, input.title, input.forDate, notes, now, now]);
    saveDb();
    const sel = db.prepare("SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id FROM tasks WHERE id = ?");
    sel.bind([id]);
    if (sel.step()) {
        const r = sel.getAsObject();
        sel.free();
        return rowToTask(r);
    }
    sel.free();
    throw new Error("Failed to read created task");
}
export async function updateTask(id, input) {
    const db = await getDb();
    const now = new Date().toISOString();
    const existingStmt = db.prepare("SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id FROM tasks WHERE id = ?");
    existingStmt.bind([id]);
    if (!existingStmt.step()) {
        existingStmt.free();
        return null;
    }
    const current = existingStmt.getAsObject();
    existingStmt.free();
    const title = input.title ?? current.title;
    const for_date = input.forDate ?? current.for_date;
    const notes = input.notes !== undefined ? input.notes : current.notes;
    const completed = input.completed !== undefined ? (input.completed ? 1 : 0) : current.completed;
    db.run(`UPDATE tasks SET title = ?, for_date = ?, notes = ?, completed = ?, updated_at = ? WHERE id = ?`, [title, for_date, notes, completed, now, id]);
    saveDb();
    const updatedStmt = db.prepare("SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id FROM tasks WHERE id = ?");
    updatedStmt.bind([id]);
    if (updatedStmt.step()) {
        const r = updatedStmt.getAsObject();
        updatedStmt.free();
        return rowToTask(r);
    }
    updatedStmt.free();
    return null;
}
export async function deleteTask(id) {
    const db = await getDb();
    db.run("DELETE FROM tasks WHERE id = ?", [id]);
    saveDb();
    return db.getRowsModified() > 0;
}
