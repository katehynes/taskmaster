import { getDb, saveDb } from "../db/index.js";
import { rowToTask } from "../db/mappers.js";
import type { TaskRow } from "../db/mappers.js";
import type { Task, TaskCreateInput, TaskUpdateInput } from "../types.js";
import { isTaskVisible, todayISO } from "./expiration.js";
import { randomUUID } from "node:crypto";

export interface GetTasksOptions {
  forDate?: string;
  fromDate?: string;
  toDate?: string;
  includeExpired?: boolean;
}

export async function getTasks(options: GetTasksOptions = {}): Promise<Task[]> {
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

  const stmt = db.prepare(
    `SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id
     FROM tasks
     WHERE for_date >= ? AND for_date <= ?
     ORDER BY for_date, created_at`
  );
  stmt.bind([fromDate, toDate]);

  const result: Task[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>;
    const task = rowToTask(row as unknown as TaskRow);
    if (includeExpired || isTaskVisible(task.forDate, settings, today)) {
      result.push(task);
    }
  }
  stmt.free();

  return result;
}

export async function getExpirationDays(): Promise<number> {
  const db = await getDb();
  const rows = db.exec(
    "SELECT expiration_days FROM settings WHERE id = 'default'"
  );
  if (rows.length > 0 && rows[0].values.length > 0) {
    return rows[0].values[0][0] as number;
  }
  return 2;
}

export async function createTask(input: TaskCreateInput): Promise<Task> {
  const db = await getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const notes = input.notes ?? null;

  db.run(
    `INSERT INTO tasks (id, title, for_date, notes, completed, created_at, updated_at, owner_id)
     VALUES (?, ?, ?, ?, 0, ?, ?, NULL)`,
    [id, input.title, input.forDate, notes, now, now]
  );
  saveDb();

  const sel = db.prepare(
    "SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id FROM tasks WHERE id = ?"
  );
  sel.bind([id]);
  if (sel.step()) {
    const r = sel.getAsObject() as unknown as TaskRow;
    sel.free();
    return rowToTask(r);
  }
  sel.free();
  throw new Error("Failed to read created task");
}

export async function updateTask(
  id: string,
  input: TaskUpdateInput
): Promise<Task | null> {
  const db = await getDb();
  const now = new Date().toISOString();

  const existingStmt = db.prepare(
    "SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id FROM tasks WHERE id = ?"
  );
  existingStmt.bind([id]);
  if (!existingStmt.step()) {
    existingStmt.free();
    return null;
  }
  const current = existingStmt.getAsObject() as Record<string, unknown>;
  existingStmt.free();

  const title = input.title ?? (current.title as string);
  const for_date = input.forDate ?? (current.for_date as string);
  const notes = input.notes !== undefined ? input.notes : (current.notes as string | null);
  const completed =
    input.completed !== undefined ? (input.completed ? 1 : 0) : (current.completed as number);

  db.run(
    `UPDATE tasks SET title = ?, for_date = ?, notes = ?, completed = ?, updated_at = ? WHERE id = ?`,
    [title, for_date, notes, completed, now, id]
  );
  saveDb();

  const updatedStmt = db.prepare(
    "SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id FROM tasks WHERE id = ?"
  );
  updatedStmt.bind([id]);
  if (updatedStmt.step()) {
    const r = updatedStmt.getAsObject() as unknown as TaskRow;
    updatedStmt.free();
    return rowToTask(r);
  }
  updatedStmt.free();
  return null;
}

export async function deleteTask(id: string): Promise<boolean> {
  const db = await getDb();
  const listStmt = db.prepare("SELECT id FROM tasks");
  const existingIds: string[] = [];
  while (listStmt.step()) {
    const row = listStmt.getAsObject() as { id?: string };
    if (row.id != null) existingIds.push(String(row.id));
  }
  listStmt.free();

  const escapedId = id.replace(/'/g, "''");
  const sql = `DELETE FROM tasks WHERE id = '${escapedId}'`;
  db.run(sql);
  const modified = db.getRowsModified();
  saveDb();
  return modified > 0;
}
